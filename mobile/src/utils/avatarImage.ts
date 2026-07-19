/**
 * React Native glue for the AI avatar image pipeline.
 *
 * Mirrors the web src/utils/avatarImage.ts API but without Canvas: the pixel
 * work (chroma key, autocrop, compose) lives in the pure-JS avatarRaster core;
 * this module handles the RN-specific I/O — reading the user photo via
 * expo-image-manipulator and resolving bundled/remote style assets to bytes.
 */

import { Image as RNImage } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { toByteArray } from 'base64-js';
import { img } from '@/assets/registry';
import {
  decodeImage,
  toMagentaRef,
  composeBust as rasterComposeBust,
  composeBody as rasterComposeBody,
  composeRigSheet as rasterComposeRigSheet,
  partToDataUri,
  type ImagePart,
} from './avatarRaster';

export type { ImagePart };
export { partToDataUri };

function getSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err instanceof Error ? err : new Error(String(err)))
    );
  });
}

/**
 * Downscale a local photo (camera/gallery URI) to a compact JPEG ImagePart
 * for the Edge Function payload. JPEG is fine here — user photos have no
 * alpha (the manipulator flattens any transparency).
 */
export async function photoToImagePart(uri: string, maxDim = 768): Promise<ImagePart> {
  let scale = 1;
  try {
    const { width, height } = await getSize(uri);
    scale = Math.min(1, maxDim / Math.max(width, height));
  } catch {
    // Unknown dimensions — resize by width as a safe default.
    scale = 0;
  }

  const ctx = ImageManipulator.manipulate(uri);
  if (scale === 0) {
    ctx.resize({ width: maxDim });
  } else if (scale < 1) {
    ctx.resize({ width: Math.round(maxDim) });
  }
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.87,
    base64: true,
  });
  if (!saved.base64) throw new Error('Photo compression produced no data');
  return { data: saved.base64, mimeType: 'image/jpeg' };
}

/** Sniff PNG vs JPEG from magic bytes (fallback JPEG). */
function sniffMime(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  return 'image/jpeg';
}

/**
 * Resolve one of the app's style-reference assets (bundled `/path` from the
 * registry, or a remote https URL like the saved bust) to raw bytes.
 */
async function assetBytes(src: string): Promise<Uint8Array> {
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`Failed to load image: ${src.slice(0, 80)}`);
    return new Uint8Array(await res.arrayBuffer());
  }
  const module = img(src);
  if (module == null) throw new Error(`Unknown bundled asset: ${src}`);
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  const localUri = asset.localUri ?? asset.uri;
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return toByteArray(base64);
}

/**
 * Fetch a style-reference asset and downscale it to a PNG ImagePart,
 * flattened onto the magenta plate (same rationale as the web pipeline:
 * transparent refs render as black and poison the plate instruction).
 */
export async function assetToImagePart(src: string, maxDim = 640): Promise<ImagePart> {
  const bytes = await assetBytes(src);
  const raster = decodeImage(bytes, sniffMime(bytes));
  return toMagentaRef(raster, maxDim);
}

/** Compose the square bust PNG (subject centred, ~94% of the frame). */
export async function composeBust(part: ImagePart): Promise<Uint8Array> {
  return rasterComposeBust(part);
}

/** Compose the full-body PNG (2:3, feet at ~93% of the canvas height). */
export async function composeBody(part: ImagePart): Promise<Uint8Array> {
  return rasterComposeBody(part);
}

/** Compose the A-pose rig sheet on pure white for Meshy image-to-3D. */
export async function composeRigSheet(part: ImagePart): Promise<Uint8Array> {
  return rasterComposeRigSheet(part);
}
