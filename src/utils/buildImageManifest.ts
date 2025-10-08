import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import ini from 'ini';
import { parseKBIniForImages, decodeKBIni } from './keyboardImages';

export interface KeyRect {
  bIndex: number;
  rect: [number, number, number, number];
}

export interface ImageManifest {
  [pid: string]: {
    hasKeyimg: boolean;
    hasKbled: boolean;
    useRgbDefault: boolean;
    kbImgUse?: string; // References another keyboard's images
    dirCase: string; // Actual directory case (uppercase or lowercase)
    keyBackgrounds?: Record<number, string>; // Per-key background colors
    keyRects?: KeyRect[]; // Key rectangles for rendering backgrounds
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
 */
async function analyzeKeyboardLuminance(
  imagePath: string,
  keys: Array<{ rect: [number, number, number, number]; bIndex: number }>
): Promise<Record<number, string> | null> {
  try {
    // Load image with Sharp
    const image = sharp(imagePath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    const keyBackgrounds: Record<number, string> = {};

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
        keyBackgrounds[key.bIndex] = avgLuminance > 128 ? '#1f2937' : '#ffffff';
      }
    }

    return keyBackgrounds;
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
    let keyBackgrounds: Record<number, string> | undefined;
    let keyRects: KeyRect[] | undefined;

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
              keyBackgrounds = await analyzeKeyboardLuminance(imagePath, keys) || undefined;
              if (keyBackgrounds) {
                analyzedCount++;
                // Store key rectangles for rendering
                keyRects = keys;
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
        keyBackgrounds,
        keyRects,
      };
    }
  }

  const elapsed = performance.now() - startTime;
  console.log(`Built image manifest with luminance data for ${analyzedCount} keyboards in ${(elapsed / 1000).toFixed(2)}s`);

  return manifest;
}
