/**
 * Client-side image pipeline for the AI avatar creator.
 *
 * Gemini (Nano Banana) can't emit real alpha, so the Edge Function returns
 * the character rendered on a solid magenta plate (#FF00FF). Here we key the
 * magenta out into a true RGBA cutout (distance-based alpha ramp + despill,
 * same algorithm the media-gen skill uses in Pillow), then compose the final
 * canvases that match the app's avatar conventions:
 *
 *   - bust: square 1:1, subject filling most of the frame
 *   - body: portrait 2:3, centred, feet at ~93% of the canvas height
 *           (see AVATAR_OPTIONS in constants/config.ts)
 */

export interface ImagePart {
  /** base64 payload, no `data:` prefix */
  data: string;
  mimeType: string;
}

/** Chroma key thresholds (squared-distance ramp), mirrors gemini_gen.py. */
const KEY_T_LOW = 48;
const KEY_T_HIGH = 175;
/** Alpha below this counts as empty when autocropping. */
const CROP_ALPHA = 8;

const BUST_CANVAS = 1024; // 1:1
const BODY_CANVAS_W = 1024; // 2:3
const BODY_CANVAS_H = 1536;
const BODY_FEET_AT = 0.93; // feet anchor (fraction of canvas height)
const BODY_MAX_HEIGHT = 0.86; // subject height budget above the feet line
const BUST_FILL = 0.94; // bust subject fills 94% of the square

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  return ctx;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 80)}`));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob failed'))),
      'image/png'
    );
  });
}

/**
 * Downscale a local photo (camera/gallery) to a compact JPEG ImagePart for
 * the Edge Function payload. JPEG is fine here — user photos have no alpha.
 */
export async function fileToImagePart(file: File, maxDim = 768): Promise<ImagePart> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const canvas = createCanvas(
      Math.round(img.width * scale),
      Math.round(img.height * scale)
    );
    const ctx = context2d(canvas);
    // Flatten possible transparency onto a neutral background.
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.87);
    return { data: dataUrl.split(',')[1] ?? '', mimeType: 'image/jpeg' };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Fetch one of the app's own style-reference assets and downscale it to a
 * PNG ImagePart (PNG keeps the alpha silhouette, which helps the model read
 * the figurine style).
 */
export async function assetToImagePart(url: string, maxDim = 640): Promise<ImagePart> {
  const img = await loadImage(url);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = createCanvas(
    Math.round(img.width * scale),
    Math.round(img.height * scale)
  );
  context2d(canvas).drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/png');
  return { data: dataUrl.split(',')[1] ?? '', mimeType: 'image/png' };
}

/**
 * Key out the magenta plate into real alpha.
 *
 * alpha = clamp(((d² - tLow²) / (tHigh² - tLow²)) * 255) where d² is the
 * squared RGB distance to #FF00FF, then a despill pass removes the magenta
 * fringe on anti-aliased edges (excess = min(R,B) - G subtracted from R,B).
 */
function keyOutChroma(canvas: HTMLCanvasElement): void {
  const ctx = context2d(canvas);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = imageData.data;
  const tl2 = KEY_T_LOW * KEY_T_LOW;
  const th2 = KEY_T_HIGH * KEY_T_HIGH;
  const span = th2 - tl2;

  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]!;
    const g = px[i + 1]!;
    const b = px[i + 2]!;
    const dr = r - 255;
    const db = b - 255;
    const d2 = dr * dr + g * g + db * db;
    const alpha = Math.max(0, Math.min(255, ((d2 - tl2) * 255) / span));
    const excess = Math.max(0, Math.min(r, b) - g);
    px[i] = r - excess;
    px[i + 2] = b - excess;
    px[i + 3] = alpha;
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Bounding box of pixels with alpha above CROP_ALPHA, or null if empty. */
function alphaBBox(
  canvas: HTMLCanvasElement
): { x: number; y: number; w: number; h: number } | null {
  const { width, height } = canvas;
  const px = context2d(canvas).getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (px[(y * width + x) * 4 + 3]! > CROP_ALPHA) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Decode a magenta-plate ImagePart into an autocropped RGBA cutout canvas. */
async function partToCutout(part: ImagePart): Promise<HTMLCanvasElement> {
  const img = await loadImage(`data:${part.mimeType};base64,${part.data}`);
  const raw = createCanvas(img.width, img.height);
  context2d(raw).drawImage(img, 0, 0);
  keyOutChroma(raw);

  const box = alphaBBox(raw);
  if (!box) throw new Error('Chroma key produced an empty image');
  const cutout = createCanvas(box.w, box.h);
  context2d(cutout).drawImage(raw, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  return cutout;
}

/** Compose the square bust PNG (subject centred, ~94% of the frame). */
export async function composeBust(part: ImagePart): Promise<Blob> {
  const cutout = await partToCutout(part);
  const canvas = createCanvas(BUST_CANVAS, BUST_CANVAS);
  const scale = (BUST_CANVAS * BUST_FILL) / Math.max(cutout.width, cutout.height);
  const w = cutout.width * scale;
  const h = cutout.height * scale;
  context2d(canvas).drawImage(cutout, (BUST_CANVAS - w) / 2, (BUST_CANVAS - h) / 2, w, h);
  return canvasToBlob(canvas);
}

/**
 * Compose the full-body PNG following the hero canvas convention:
 * portrait 2:3, horizontally centred, feet resting at ~93% of the height.
 */
export async function composeBody(part: ImagePart): Promise<Blob> {
  const cutout = await partToCutout(part);
  const canvas = createCanvas(BODY_CANVAS_W, BODY_CANVAS_H);
  const scale = Math.min(
    (BODY_CANVAS_H * BODY_MAX_HEIGHT) / cutout.height,
    (BODY_CANVAS_W * 0.9) / cutout.width
  );
  const w = cutout.width * scale;
  const h = cutout.height * scale;
  const x = (BODY_CANVAS_W - w) / 2;
  const y = BODY_CANVAS_H * BODY_FEET_AT - h; // bottom of subject = feet line
  context2d(canvas).drawImage(cutout, x, y, w, h);
  return canvasToBlob(canvas);
}
