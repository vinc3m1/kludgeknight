import fs from 'fs';
import path from 'path';
import { parseKBIniForImages, decodeKBIni } from './keyboardImages';

interface ImageManifest {
  [pid: string]: {
    hasKeyimg: boolean;
    hasKbled: boolean;
    useRgbDefault: boolean;
    kbImgUse?: string; // References another keyboard's images
    dirCase: string; // Actual directory case (uppercase or lowercase)
  };
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

    const kbIniPath = path.join(dirPath, 'KB.ini');
    if (fs.existsSync(kbIniPath)) {
      try {
        const buffer = fs.readFileSync(kbIniPath);
        const text = decodeKBIni(buffer);
        const imageConfig = parseKBIniForImages(text);
        useRgbDefault = imageConfig.useRgbDefault;
        kbImgUse = imageConfig.kbImgUse;
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
        dirCase: pid // Store actual case for later use
      };
    }
  }

  return manifest;
}
