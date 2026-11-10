/**
 * Spritesheets were repacked at smaller frame sizes by scripts/optimize-assets.mjs.
 * `ratio` is newFrameWidth / originalFrameWidth: divide display scales by it, and multiply
 * physics body sizes and offsets (which are in frame pixels) by it, so everything keeps
 * the same on-screen size.
 */
export const SHEETS = {
  dog: { frameWidth: 280, frameHeight: 265, ratio: 280 / 1005 },
  cat: { frameWidth: 240, frameHeight: 240, ratio: 240 / 480 },
  snow: { frameWidth: 400, frameHeight: 240, ratio: 400 / 1000 },
  fire: { frameWidth: 98, frameHeight: 156, ratio: 98 / 392 },
  lightning: { frameWidth: 270, frameHeight: 480, ratio: 1 },
  cat_idle: { frameWidth: 125, frameHeight: 150, ratio: 1 }
} as const;

export type SheetKey = keyof typeof SHEETS;

/** Scale that draws `key` at the size `originalScale` drew the original sheet. */
export function sheetScale(key: SheetKey, originalScale: number): number {
  return originalScale / SHEETS[key].ratio;
}

/** Converts a size in original-frame pixels to repacked-frame pixels. */
export function sheetPx(key: SheetKey, originalPx: number): number {
  return originalPx * SHEETS[key].ratio;
}
