/**
 * Parse KB.ini files from RK software
 */

import ini from 'ini';
import { parseVK } from '../types/keycode';
import type { Key, KeyboardConfig } from '../types/keyboard';
import { getDeviceName } from './rkConfig';

/**
 * Parse a single key entry from KB.ini
 * Format: left,top,right,bottom,flags,vkcode,unknown,bIndex
 */
function parseKeyEntry(value: string, keyName: string): Key | null {
  const parts = value.split(',').map(p => p.trim());
  if (parts.length !== 8) {
    console.error(`Invalid key entry format for ${keyName}: expected 8 parts, got ${parts.length}`, value);
    return null;
  }

  const keyInfo = parseVK(parts[5]);
  if (!keyInfo) {
    console.error(`Unknown VK code for ${keyName}: ${parts[5]}`);
    return null;
  }

  return {
    rect: [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])],
    keyInfo,
    bIndex: parseInt(parts[7]),
  };
}

/**
 * Parse KB.ini file for a specific keyboard PID
 */
export async function parseKBIni(pid: string): Promise<KeyboardConfig | null> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}rk/Dev/${pid.toUpperCase()}/KB.ini`);
    if (!response.ok) {
      console.warn(`KB.ini not found for PID ${pid}`);
      return null;
    }

    const text = await response.text();
    const parsed = ini.parse(text);

    if (!parsed.KEY) {
      console.warn(`No [KEY] section found in KB.ini for PID ${pid}`);
      return null;
    }

    const keys: Key[] = [];

    // Parse all key entries
    for (const [keyName, value] of Object.entries(parsed.KEY)) {
      if (!keyName.startsWith('K')) {
        continue;
      }

      if (typeof value !== 'string') {
        console.error(`Invalid value type for ${keyName}: expected string, got ${typeof value}`);
        continue;
      }

      const key = parseKeyEntry(value, keyName);
      if (!key) {
        continue;
      }

      keys.push(key);
    }

    // Determine image URL - check for KbImgUse reference
    const kbImgUse = parsed.OPT?.KbImgUse;
    let imageUrl: string;

    if (kbImgUse) {
      // KbImgUse is a hex reference to another device's image
      const referencePid = kbImgUse.replace('0x', '').toLowerCase();
      imageUrl = `${import.meta.env.BASE_URL}rk/Dev/${referencePid.toUpperCase()}/keyimg.png`;
    } else {
      // Use this device's own image
      imageUrl = `${import.meta.env.BASE_URL}rk/Dev/${pid.toUpperCase()}/keyimg.png`;
    }

    // Get device name from Cfg.ini
    const name = await getDeviceName(pid) || `RK ${pid.toUpperCase()}`;

    return {
      pid: pid.toLowerCase(),
      name,
      keys,
      imageUrl,
    };
  } catch (error) {
    console.error(`Failed to parse KB.ini for PID ${pid}:`, error);
    return null;
  }
}

/**
 * Check if keyimg.png exists for a PID
 */
export async function hasKeyboardImage(pid: string): Promise<boolean> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}rk/Dev/${pid.toUpperCase()}/keyimg.png`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
