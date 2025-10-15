/**
 * Tests to ensure all keyboards have associated images
 */
import { test, expect } from 'bun:test';
import { readFile, readdir, access } from 'fs/promises';
import { join } from 'path';
import { decodeKBIni, getKeyboardImageInfo } from './keyboardImages';

// Cache of actual directory names (case-sensitive)
let directoryCaseMap: Map<string, string> | null = null;

async function getDirectoryCaseMap(devDir: string): Promise<Map<string, string>> {
  if (directoryCaseMap) {
    return directoryCaseMap;
  }

  directoryCaseMap = new Map();
  const dirs = await readdir(devDir);

  for (const dir of dirs) {
    // Map lowercase version to actual case
    directoryCaseMap.set(dir.toLowerCase(), dir);
  }

  return directoryCaseMap;
}

async function getActualDirName(pid: string, devDir: string): Promise<string> {
  const caseMap = await getDirectoryCaseMap(devDir);
  const actualCase = caseMap.get(pid.toLowerCase());
  return actualCase || pid.toUpperCase(); // fallback to uppercase if not found
}

async function fetchKBIniForNode(pid: string, devDir: string): Promise<{ text: string; dirCase: string } | null> {
  try {
    const actualDirName = await getActualDirName(pid, devDir);
    const kbIniPath = join(devDir, actualDirName, 'KB.ini');
    const buffer = await readFile(kbIniPath);
    const text = decodeKBIni(buffer);
    return { text, dirCase: actualDirName };
  } catch {
    return null;
  }
}

async function checkImageExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

test('all keyboards in Cfg.ini should have at least one image', async () => {
  const devDir = join(process.cwd(), 'public', 'rk', 'Dev');
  const cfgPath = join(process.cwd(), 'public', 'rk', 'Cfg.ini');

  // Read Cfg.ini
  const cfgBuffer = await readFile(cfgPath);
  const decoder = new TextDecoder('utf-16le');
  const cfgText = decoder.decode(cfgBuffer);

  // Parse device names
  const devices = new Map<string, string>();
  const lines = cfgText.split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/^DevName\d+=([0-9A-Fa-f]+),(.+)$/);
    if (match) {
      const pid = match[1].toLowerCase();
      const name = match[2].trim();
      devices.set(pid, name);
    }
  }

  expect(devices.size).toBeGreaterThan(0);

  const missingImages: Array<{ pid: string; name: string; reason: string }> = [];

  for (const [pid, name] of devices) {
    const fetchFn = (p: string) => fetchKBIniForNode(p, devDir);
    const info = await getKeyboardImageInfo(pid, fetchFn);

    let hasImage = false;
    let reason = '';

    if (info) {
      // Check if the referenced image exists
      const imageName = info.useRgbDefault ? 'kbled.png' : 'keyimg.png';
      const imagePath = join(devDir, info.dirCase, imageName);
      hasImage = await checkImageExists(imagePath);

      if (!hasImage) {
        if (info.kbImgUseRef) {
          reason = `References ${info.kbImgUseRef.toUpperCase()} but image ${imageName} not found at ${imagePath}`;
        } else {
          reason = `Image ${imageName} not found at ${imagePath}`;
        }
      }
    } else {
      // No KB.ini or imageInfo, check for default keyimg.png
      const actualDirName = await getActualDirName(pid, devDir);
      const keyimgPath = join(devDir, actualDirName, 'keyimg.png');
      const kbledPath = join(devDir, actualDirName, 'kbled.png');

      const hasKeyimg = await checkImageExists(keyimgPath);
      const hasKbled = await checkImageExists(kbledPath);

      hasImage = hasKeyimg || hasKbled;

      if (!hasImage) {
        reason = `No KB.ini and neither keyimg.png nor kbled.png found in ${actualDirName}`;
      }
    }

    if (!hasImage) {
      missingImages.push({ pid, name, reason });
    }
  }

  // If there are missing images, create a helpful error message
  if (missingImages.length > 0) {
    const errorMessage = [
      `Found ${missingImages.length} keyboard(s) without images:`,
      '',
      ...missingImages.map(kb => `  ${kb.pid.toUpperCase()} - ${kb.name}\n    → ${kb.reason}`),
      '',
      `Total keyboards: ${devices.size}`,
      `With images: ${devices.size - missingImages.length}`,
      `Without images: ${missingImages.length}`,
    ].join('\n');

    throw new Error(errorMessage);
  }

  // Success message
  console.log(`✓ All ${devices.size} keyboards have images`);
});
