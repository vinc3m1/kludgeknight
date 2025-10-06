/**
 * Script to check which keyboards are missing images after resolving KbImgUse references
 */

import { readFile, access, readdir } from 'fs/promises';
import { join } from 'path';
import {
  decodeKBIni,
  getKeyboardImageInfo as getKeyboardImageInfoShared
} from '../src/utils/keyboardImages.js';

interface KeyboardInfo {
  pid: string;
  name: string;
  hasImage: boolean;
  imagePath?: string;
  kbImgUse?: string;
  error?: string;
}

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

// Adapter function to work with the shared utility
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

async function getKeyboardImagePath(pid: string, devDir: string): Promise<{ path: string | null; kbImgUse?: string }> {
  try {
    const fetchFn = (p: string) => fetchKBIniForNode(p, devDir);
    const info = await getKeyboardImageInfoShared(pid, fetchFn);

    if (!info) {
      const actualDirName = await getActualDirName(pid, devDir);
      return {
        path: join(devDir, actualDirName, 'keyimg.png')
      };
    }

    const imageName = info.useRgbDefault ? 'kbled.png' : 'keyimg.png';
    const basePath = join(devDir, info.dirCase);

    return {
      path: join(basePath, imageName),
      kbImgUse: info.kbImgUseRef
    };
  } catch {
    const actualDirName = await getActualDirName(pid, devDir);
    return {
      path: join(devDir, actualDirName, 'keyimg.png')
    };
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

async function main() {
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

  console.log(`Checking ${devices.size} keyboards for images...\n`);

  const results: KeyboardInfo[] = [];
  const missingImages: KeyboardInfo[] = [];

  for (const [pid, name] of devices) {
    const { path, kbImgUse } = await getKeyboardImagePath(pid, devDir);

    if (!path) {
      const info: KeyboardInfo = {
        pid,
        name,
        hasImage: false,
        error: 'Could not determine image path'
      };
      results.push(info);
      missingImages.push(info);
      continue;
    }

    const hasImage = await checkImageExists(path);
    const info: KeyboardInfo = {
      pid,
      name,
      hasImage,
      imagePath: path,
      kbImgUse
    };

    results.push(info);
    if (!hasImage) {
      missingImages.push(info);
    }
  }

  // Summary
  const totalKeyboards = results.length;
  const withImages = results.filter(r => r.hasImage).length;
  const withoutImages = missingImages.length;

  console.log('=== SUMMARY ===');
  console.log(`Total keyboards: ${totalKeyboards}`);
  console.log(`With images: ${withImages} (${((withImages / totalKeyboards) * 100).toFixed(1)}%)`);
  console.log(`Without images: ${withoutImages} (${((withoutImages / totalKeyboards) * 100).toFixed(1)}%)`);

  if (missingImages.length > 0) {
    console.log('\n=== KEYBOARDS MISSING IMAGES ===');
    for (const kb of missingImages) {
      console.log(`${kb.pid.toUpperCase()} - ${kb.name}`);
      if (kb.kbImgUse) {
        console.log(`  -> References ${kb.kbImgUse.toUpperCase()} (image not found)`);
      }
      if (kb.error) {
        console.log(`  -> Error: ${kb.error}`);
      }
    }
  }
}

main().catch(console.error);
