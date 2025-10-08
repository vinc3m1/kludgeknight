import type { ImageManifest } from './buildImageManifest';
import type { Key } from '../types/keyboard';

/**
 * Get key background colors from pre-calculated luminance data
 * Follows kbImgUse references and applies majority + exception pattern
 */
export function getKeyBackgrounds(
  pid: string,
  keys: Key[],
  imageManifest?: ImageManifest
): Map<number, string> {
  const backgrounds = new Map<number, string>();

  if (!imageManifest) return backgrounds;

  const pidUpper = pid.toUpperCase();
  let manifestEntry = imageManifest[pidUpper];

  // Follow kbImgUse reference if present
  if (manifestEntry?.kbImgUse) {
    const refEntry = imageManifest[manifestEntry.kbImgUse.toUpperCase()];
    if (refEntry) manifestEntry = refEntry;
  }

  if (!manifestEntry?.luminance) return backgrounds;

  const { majorityBackground, exceptionKeys } = manifestEntry.luminance;

  // Set majority background for all keys first
  keys.forEach((key) => {
    backgrounds.set(key.bIndex, majorityBackground);
  });

  // Override with exception keys
  exceptionKeys.forEach((exceptionKey) => {
    backgrounds.set(exceptionKey.bIndex, exceptionKey.background);
  });

  return backgrounds;
}
