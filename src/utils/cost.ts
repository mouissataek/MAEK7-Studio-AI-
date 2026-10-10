/**
 * Relative cost model shared by the server (budget enforcement) and the UI
 * (pre-generation estimate).
 *
 * These are RELATIVE "units", not currency: 1 unit ≈ one 1K image.
 * Real prices change, so tune the numbers below to match your own billing.
 */
import type { ImageSize, VideoResolution } from '../types';

export const IMAGE_SIZE_UNITS: Record<ImageSize, number> = {
  '1K': 1,
  '2K': 2,
  '4K': 4,
};

/** Cost of one video generation (lite model, 720p = baseline). */
export const VIDEO_RES_UNITS: Record<VideoResolution, number> = {
  '720p': 10,
  '1080p': 15,
};

/** Full (non-lite) Veo models cost more. */
export const VIDEO_FULL_MODEL_MULTIPLIER = 2.5;

export const DEFAULT_IMAGE_MODEL = 'gemini-3-pro-image-preview';
export const DEFAULT_VIDEO_MODEL = 'veo-3.1-lite-generate-preview';
export const VIDEO_MODELS = ['veo-3.1-lite-generate-preview', 'veo-3.1-generate-preview'];

export function imageCost(size: ImageSize): number {
  return IMAGE_SIZE_UNITS[size] ?? 1;
}

export function videoCost(resolution: VideoResolution, model: string): number {
  const base = VIDEO_RES_UNITS[resolution] ?? VIDEO_RES_UNITS['720p'];
  return model.includes('lite') ? base : Math.round(base * VIDEO_FULL_MODEL_MULTIPLIER);
}
