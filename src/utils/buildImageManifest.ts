import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ini from 'ini';
import { parseKBIniForImages, decodeKBIni } from './keyboardImages';

export interface KeyRect {
  bIndex: number;
  rect: [number, number, number, number];
}

export interface ExceptionKey {
  bIndex: number;
  rect: [number, number, number, number];
  background: string;
}

export interface LuminanceData {
  majorityBackground: string; // Background color for majority of keys
  keyboardBounds: [number, number, number, number]; // [minX, minY, maxX, maxY]
  exceptionKeys: ExceptionKey[]; // Only keys needing opposite color
}

export interface ImageManifest {
  [pid: string]: {
    hasKeyimg: boolean;
    hasKbled: boolean;
    useRgbDefault: boolean;
    kbImgUse?: string; // References another keyboard's images
    dirCase: string; // Actual directory case (uppercase or lowercase)
    luminance?: LuminanceData; // Optimized luminance data
  };
}

/**
 * Simple key rectangle parser for build-time use
 * Format: left,top,right,bottom,flags,vkcode,unknown,bIndex
 */
function parseKeyRect(value: string): { rect: [number, number, number, number]; bIndex: number } | null {
  const parts = value.split(',').map(p => p.trim());
  if (parts.length !== 8) return null;

  return {
    rect: [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])],
    bIndex: parseInt(parts[7]),
  };
}

/**
 * Analyze per-key luminance for a keyboard image
 * Returns optimized structure with majority background and exception keys only
 */
async function analyzeKeyboardLuminance(
  imagePath: string,
  keys: Array<{ rect: [number, number, number, number]; bIndex: number }>
): Promise<LuminanceData | null> {
  try {
    // Load image with Sharp
    const image = sharp(imagePath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    const keyBackgrounds: Map<number, string> = new Map();

    // Analyze each key region
    for (const key of keys) {
      const [left, top, right, bottom] = key.rect;
      let totalLuminance = 0;
      let opaquePixelCount = 0;

      // Sample pixels within this key's bounds
      for (let y = Math.floor(top); y < Math.ceil(bottom); y++) {
        for (let x = Math.floor(left); x < Math.ceil(right); x++) {
          if (x >= 0 && x < info.width && y >= 0 && y < info.height) {
            const idx = (y * info.width + x) * info.channels;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const alpha = info.channels === 4 ? data[idx + 3] : 255;

            if (alpha > 25) { // Skip mostly transparent pixels
              const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
              totalLuminance += luminance;
              opaquePixelCount++;
            }
          }
        }
      }

      if (opaquePixelCount > 0) {
        const avgLuminance = totalLuminance / opaquePixelCount;
        // Light keys get dark background, dark keys get light background
        const background = avgLuminance > 128 ? '#1f2937' : '#ffffff';
        keyBackgrounds.set(key.bIndex, background);
      }
    }

    // Calculate majority background color
    const colorCounts = new Map<string, number>();
    for (const color of keyBackgrounds.values()) {
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    }

    let majorityBackground = '#ffffff';
    let maxCount = 0;
    for (const [color, count] of colorCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        majorityBackground = color;
      }
    }

    // Calculate keyboard bounds (min/max of all key rectangles)
    const bounds = keys.reduce(
      (acc, key) => ({
        minX: Math.min(acc.minX, key.rect[0]),
        minY: Math.min(acc.minY, key.rect[1]),
        maxX: Math.max(acc.maxX, key.rect[2]),
        maxY: Math.max(acc.maxY, key.rect[3])
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
    );

    const keyboardBounds: [number, number, number, number] = [
      bounds.minX,
      bounds.minY,
      bounds.maxX,
      bounds.maxY
    ];

    // Only store exception keys (keys needing opposite color from majority)
    const exceptionKeys: ExceptionKey[] = [];
    for (const key of keys) {
      const background = keyBackgrounds.get(key.bIndex);
      if (background && background !== majorityBackground) {
        exceptionKeys.push({
          bIndex: key.bIndex,
          rect: key.rect,
          background
        });
      }
    }

    return {
      majorityBackground,
      keyboardBounds,
      exceptionKeys
    };
  } catch (error) {
    console.warn(`Failed to analyze luminance for ${imagePath}:`, error);
    return null;
  }
}

/**
 * Scans the public/rk/Dev directory at build time to create a manifest
 * of all available keyboard images and their configurations.
 */
export async function buildImageManifest(): Promise<ImageManifest> {
  const manifest: ImageManifest = {};
  const devDir = path.join(process.cwd(), 'public/rk/Dev');

  // Get all subdirectories in Dev/
  const entries = fs.readdirSync(devDir, { withFileTypes: true });

  const startTime = performance.now();
  let analyzedCount = 0;

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pid = entry.name;
    const dirPath = path.join(devDir, pid);

    // Check for images
    const hasKeyimg = fs.existsSync(path.join(dirPath, 'keyimg.png'));
    const hasKbled = fs.existsSync(path.join(dirPath, 'kbled.png'));

    // Parse KB.ini if it exists
    let useRgbDefault = false;
    let kbImgUse: string | undefined;
    let luminance: LuminanceData | undefined;

    const kbIniPath = path.join(dirPath, 'KB.ini');
    if (fs.existsSync(kbIniPath)) {
      try {
        const buffer = fs.readFileSync(kbIniPath);
        const text = decodeKBIni(buffer);
        const imageConfig = parseKBIniForImages(text);
        useRgbDefault = imageConfig.useRgbDefault;
        kbImgUse = imageConfig.kbImgUse;

        // Parse key positions for luminance analysis
        const parsed = ini.parse(text);
        if (parsed.KEY && (hasKeyimg || hasKbled)) {
          const keys: Array<{ rect: [number, number, number, number]; bIndex: number }> = [];

          for (const [keyName, value] of Object.entries(parsed.KEY)) {
            if (!keyName.startsWith('K') || typeof value !== 'string') continue;
            const key = parseKeyRect(value);
            if (key) keys.push(key);
          }

          // Analyze luminance if we have keys and an image
          if (keys.length > 0) {
            // Prefer kbled.png if useRgbDefault, otherwise keyimg.png
            const imageToAnalyze = (useRgbDefault && hasKbled) ? 'kbled.png' : 'keyimg.png';
            const imagePath = path.join(dirPath, imageToAnalyze);

            if (fs.existsSync(imagePath)) {
              luminance = await analyzeKeyboardLuminance(imagePath, keys) || undefined;
              if (luminance) {
                analyzedCount++;
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to parse KB.ini for ${pid}:`, error);
      }
    }

    // Only add to manifest if there are images or KB.ini exists
    if (hasKeyimg || hasKbled || kbImgUse) {
      manifest[pid.toUpperCase()] = {
        hasKeyimg,
        hasKbled,
        useRgbDefault,
        kbImgUse,
        dirCase: pid, // Store actual case for later use
        luminance,
      };
    }
  }

  const elapsed = performance.now() - startTime;

  // Calculate optimization stats
  let totalKeys = 0;
  let totalExceptions = 0;
  const distributionBuckets = {
    '0': 0,
    '1-5': 0,
    '6-10': 0,
    '11-20': 0,
    '21-30': 0,
    '31-40': 0,
    '41-50': 0,
    '50+': 0
  };

  for (const entry of Object.values(manifest)) {
    if (entry.luminance) {
      // Estimate total keys from bounds calculation (rough estimate based on typical keyboard)
      const approxKeys = entry.luminance.exceptionKeys.length > 0
        ? entry.luminance.exceptionKeys.length / 0.1 // Assume exceptions are ~10%
        : 68; // Typical 68-key keyboard
      totalKeys += approxKeys;
      totalExceptions += entry.luminance.exceptionKeys.length;

      // Track distribution
      const count = entry.luminance.exceptionKeys.length;
      if (count === 0) distributionBuckets['0']++;
      else if (count <= 5) distributionBuckets['1-5']++;
      else if (count <= 10) distributionBuckets['6-10']++;
      else if (count <= 20) distributionBuckets['11-20']++;
      else if (count <= 30) distributionBuckets['21-30']++;
      else if (count <= 40) distributionBuckets['31-40']++;
      else if (count <= 50) distributionBuckets['41-50']++;
      else distributionBuckets['50+']++;
    }
  }

  const avgExceptions = analyzedCount > 0 ? (totalExceptions / analyzedCount).toFixed(1) : 0;
  const reduction = totalKeys > 0 ? (((totalKeys - totalExceptions - analyzedCount) / totalKeys) * 100).toFixed(1) : 0;

  console.log(`Built image manifest with luminance data for ${analyzedCount} keyboards in ${(elapsed / 1000).toFixed(2)}s`);
  console.log(`Optimization: ${totalExceptions} exception keys vs ~${totalKeys.toFixed(0)} total keys (~${reduction}% reduction, avg ${avgExceptions} exceptions/keyboard)`);
  console.log(`Distribution: 0=${distributionBuckets['0']}, 1-5=${distributionBuckets['1-5']}, 6-10=${distributionBuckets['6-10']}, 11-20=${distributionBuckets['11-20']}, 21-30=${distributionBuckets['21-30']}, 31-40=${distributionBuckets['31-40']}, 41-50=${distributionBuckets['41-50']}, 50+=${distributionBuckets['50+']}`);

  return manifest;
}
