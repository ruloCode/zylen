/**
 * Pure-JS raster core for the AI avatar pipeline (React Native port).
 *
 * The web keys the magenta plate out with Canvas 2D (src/utils/avatarImage.ts);
 * RN has no canvas, so this module re-implements the same algorithm over raw
 * RGBA buffers: PNG/JPEG decode (upng-js / jpeg-js), distance-ramp chroma key
 * + despill, autocrop, bilinear resampling and canvas composition, PNG encode.
 * Zero React Native imports — the module also runs in Node, which is how it's
 * verified (see the pipeline test in the repo history).
 */

import UPNG from 'upng-js';
import * as jpeg from 'jpeg-js';
import { fromByteArray, toByteArray } from 'base64-js';

export interface ImagePart {
  /** base64 payload, no `data:` prefix */
  data: string;
  mimeType: string;
}

/** Raw RGBA image buffer (4 bytes per pixel, row-major). */
export interface Raster {
  width: number;
  height: number;
  data: Uint8Array;
}

/** Chroma key thresholds (squared-distance ramp), mirrors the web/gemini_gen.py. */
const KEY_T_LOW = 48;
const KEY_T_HIGH = 175;
/** Alpha below this counts as empty when autocropping. */
const CROP_ALPHA = 8;

// Native does the chroma-key + compose entirely on the JS heap (no GPU
// canvas), so peak memory scales with canvas area. The avatar renders at
// ≤192px in the app, so 768/1152 is plenty and cuts peak RGBA buffers ~44%
// vs the web's 1024/1536 — the difference between a smooth run and an OOM on
// low-RAM Androids. (Web keeps 1024/1536; it uses a native Canvas.)
const BUST_CANVAS = 768; // 1:1
const BODY_CANVAS_W = 768; // 2:3
const BODY_CANVAS_H = 1152;
// The 3D-forge rig sheet feeds Meshy's image-to-3D, which benefits from more
// resolution — keep it at the full size (it's a rarer, opt-in flow).
const RIG_CANVAS_W = 1024;
const RIG_CANVAS_H = 1536;
const BODY_FEET_AT = 0.93; // feet anchor (fraction of canvas height)
const BODY_MAX_HEIGHT = 0.86; // subject height budget above the feet line
const BUST_FILL = 0.94; // bust subject fills 94% of the square

// ── Decode / encode ──

export function decodeImage(bytes: Uint8Array, mimeType: string): Raster {
  if (/jpe?g/i.test(mimeType)) {
    const out = jpeg.decode(bytes, { useTArray: true, maxMemoryUsageInMB: 512 });
    return { width: out.width, height: out.height, data: new Uint8Array(out.data) };
  }
  const img = UPNG.decode(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  );
  const rgba = UPNG.toRGBA8(img)[0];
  return { width: img.width, height: img.height, data: new Uint8Array(rgba) };
}

export function decodePart(part: ImagePart): Raster {
  return decodeImage(toByteArray(part.data), part.mimeType);
}

/** Lossless RGBA PNG bytes. */
export function encodePng(img: Raster): Uint8Array {
  const buf = UPNG.encode(
    [
      img.data.buffer.slice(
        img.data.byteOffset,
        img.data.byteOffset + img.data.byteLength
      ) as ArrayBuffer,
    ],
    img.width,
    img.height,
    0
  );
  return new Uint8Array(buf);
}

export function rasterToPart(img: Raster): ImagePart {
  return { data: fromByteArray(encodePng(img)), mimeType: 'image/png' };
}

export function partToDataUri(part: ImagePart): string {
  return `data:${part.mimeType};base64,${part.data}`;
}

// ── Primitives ──

export function createRaster(width: number, height: number): Raster {
  return { width, height, data: new Uint8Array(width * height * 4) };
}

/** Flatten transparency onto a solid background color, in place. */
export function flattenOnto(img: Raster, r: number, g: number, b: number): void {
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3]! / 255;
    if (a >= 1) continue;
    px[i] = Math.round(px[i]! * a + r * (1 - a));
    px[i + 1] = Math.round(px[i + 1]! * a + g * (1 - a));
    px[i + 2] = Math.round(px[i + 2]! * a + b * (1 - a));
    px[i + 3] = 255;
  }
}

/** Bilinear resample to the target size. */
export function scaleBilinear(src: Raster, dw: number, dh: number): Raster {
  const dst = createRaster(dw, dh);
  const sx = src.width / dw;
  const sy = src.height / dh;
  const sp = src.data;
  const dp = dst.data;
  for (let y = 0; y < dh; y++) {
    const fy = Math.min(src.height - 1, (y + 0.5) * sy - 0.5);
    const y0 = Math.max(0, Math.floor(fy));
    const y1 = Math.min(src.height - 1, y0 + 1);
    const wy = fy - y0;
    for (let x = 0; x < dw; x++) {
      const fx = Math.min(src.width - 1, (x + 0.5) * sx - 0.5);
      const x0 = Math.max(0, Math.floor(fx));
      const x1 = Math.min(src.width - 1, x0 + 1);
      const wx = fx - x0;
      const i00 = (y0 * src.width + x0) * 4;
      const i10 = (y0 * src.width + x1) * 4;
      const i01 = (y1 * src.width + x0) * 4;
      const i11 = (y1 * src.width + x1) * 4;
      const di = (y * dw + x) * 4;
      for (let c = 0; c < 4; c++) {
        const top = sp[i00 + c]! * (1 - wx) + sp[i10 + c]! * wx;
        const bot = sp[i01 + c]! * (1 - wx) + sp[i11 + c]! * wx;
        dp[di + c] = Math.round(top * (1 - wy) + bot * wy);
      }
    }
  }
  return dst;
}

/** Alpha-over blit of `src` into `dst` at integer offset (no scaling). */
export function blitOver(dst: Raster, src: Raster, ox: number, oy: number): void {
  for (let y = 0; y < src.height; y++) {
    const ty = y + oy;
    if (ty < 0 || ty >= dst.height) continue;
    for (let x = 0; x < src.width; x++) {
      const tx = x + ox;
      if (tx < 0 || tx >= dst.width) continue;
      const si = (y * src.width + x) * 4;
      const di = (ty * dst.width + tx) * 4;
      const sa = src.data[si + 3]! / 255;
      if (sa <= 0) continue;
      const da = dst.data[di + 3]! / 255;
      const outA = sa + da * (1 - sa);
      if (outA <= 0) continue;
      for (let c = 0; c < 3; c++) {
        dst.data[di + c] = Math.round(
          (src.data[si + c]! * sa + dst.data[di + c]! * da * (1 - sa)) / outA
        );
      }
      dst.data[di + 3] = Math.round(outA * 255);
    }
  }
}

// ── Avatar pipeline (mirrors src/utils/avatarImage.ts) ──

/**
 * Key out the magenta plate into real alpha, in place.
 * alpha = clamp(((d² - tLow²) / (tHigh² - tLow²)) * 255) with d² = squared RGB
 * distance to #FF00FF, then despill (excess = min(R,B) - G subtracted from R,B).
 */
export function keyOutChroma(img: Raster): void {
  const px = img.data;
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
}

/** Bounding box of pixels with alpha above CROP_ALPHA, or null if empty. */
export function alphaBBox(
  img: Raster
): { x: number; y: number; w: number; h: number } | null {
  const { width, height, data: px } = img;
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

export function crop(
  src: Raster,
  box: { x: number; y: number; w: number; h: number }
): Raster {
  const dst = createRaster(box.w, box.h);
  for (let y = 0; y < box.h; y++) {
    const srcStart = ((y + box.y) * src.width + box.x) * 4;
    dst.data.set(src.data.subarray(srcStart, srcStart + box.w * 4), y * box.w * 4);
  }
  return dst;
}

/** Decode a magenta-plate ImagePart into an autocropped RGBA cutout. */
export function partToCutout(part: ImagePart): Raster {
  const raw = decodePart(part);
  keyOutChroma(raw);
  const box = alphaBBox(raw);
  if (!box) throw new Error('Chroma key produced an empty image');
  return crop(raw, box);
}

/** Compose the square bust PNG (subject centred, ~94% of the frame). */
export function composeBust(part: ImagePart): Uint8Array {
  const cutout = partToCutout(part);
  const canvas = createRaster(BUST_CANVAS, BUST_CANVAS);
  const scale = (BUST_CANVAS * BUST_FILL) / Math.max(cutout.width, cutout.height);
  const w = Math.max(1, Math.round(cutout.width * scale));
  const h = Math.max(1, Math.round(cutout.height * scale));
  blitOver(canvas, scaleBilinear(cutout, w, h), Math.round((BUST_CANVAS - w) / 2), Math.round((BUST_CANVAS - h) / 2));
  return encodePng(canvas);
}

/**
 * Compose the full-body PNG following the hero canvas convention:
 * portrait 2:3, horizontally centred, feet resting at ~93% of the height.
 */
export function composeBody(part: ImagePart): Uint8Array {
  const cutout = partToCutout(part);
  const canvas = createRaster(BODY_CANVAS_W, BODY_CANVAS_H);
  const scale = Math.min(
    (BODY_CANVAS_H * BODY_MAX_HEIGHT) / cutout.height,
    (BODY_CANVAS_W * 0.9) / cutout.width
  );
  const w = Math.max(1, Math.round(cutout.width * scale));
  const h = Math.max(1, Math.round(cutout.height * scale));
  const x = Math.round((BODY_CANVAS_W - w) / 2);
  const y = Math.round(BODY_CANVAS_H * BODY_FEET_AT - h);
  blitOver(canvas, scaleBilinear(cutout, w, h), x, y);
  return encodePng(canvas);
}

/**
 * Compose the A-pose rig sheet for Meshy image-to-3D: the keyed-out subject
 * centred on a PURE WHITE canvas, small margin.
 */
export function composeRigSheet(part: ImagePart): Uint8Array {
  const cutout = partToCutout(part);
  const canvas = createRaster(RIG_CANVAS_W, RIG_CANVAS_H);
  canvas.data.fill(255); // opaque white
  const scale = Math.min(
    (RIG_CANVAS_H * 0.92) / cutout.height,
    (RIG_CANVAS_W * 0.92) / cutout.width
  );
  const w = Math.max(1, Math.round(cutout.width * scale));
  const h = Math.max(1, Math.round(cutout.height * scale));
  blitOver(canvas, scaleBilinear(cutout, w, h), Math.round((RIG_CANVAS_W - w) / 2), Math.round((RIG_CANVAS_H - h) / 2));
  return encodePng(canvas);
}

/**
 * Flatten a (possibly transparent) decoded asset onto the magenta plate and
 * downscale it — the style refs must REINFORCE the plate instruction (see the
 * web pipeline's rationale in src/utils/avatarImage.ts).
 */
export function toMagentaRef(img: Raster, maxDim = 640): ImagePart {
  flattenOnto(img, 255, 0, 255);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const out =
    scale < 1
      ? scaleBilinear(img, Math.max(1, Math.round(img.width * scale)), Math.max(1, Math.round(img.height * scale)))
      : img;
  return rasterToPart(out);
}
