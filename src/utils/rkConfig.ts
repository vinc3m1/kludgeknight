/**
 * Parse RK Cfg.ini to get device mappings
 * Shared code between Node.js (build-time) and browser (runtime)
 */

export interface RKDevice {
  pid: string;
  name: string;
}

let deviceCache: Map<string, string> | null = null;

/**
 * Parse Cfg.ini text content (shared parsing logic)
 */
export function parseCfgIni(text: string): Map<string, string> {
  const devices = new Map<string, string>();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    // Match DevName entries: DevName123=014E,RK-F68
    const match = line.match(/^DevName\d+=([0-9A-Fa-f]+),(.+)$/);
    if (match) {
      const pid = match[1].toLowerCase();
      const name = match[2].trim();
      devices.set(pid, name);
    }
  }

  return devices;
}

/**
 * Load and parse Cfg.ini (works in both Node.js and browser)
 * Returns a map of PID -> Device Name
 */
export async function getRKDevices(): Promise<Map<string, string>> {
  if (deviceCache) {
    return deviceCache;
  }

  try {
    let buffer: ArrayBuffer;

    // Server-side (Node.js/Bun)
    if (typeof window === 'undefined') {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const cfgPath = join(process.cwd(), 'public', 'rk', 'Cfg.ini');
      buffer = readFileSync(cfgPath);
    } else {
      // Client-side (browser)
      const response = await fetch(`${import.meta.env.BASE_URL}rk/Cfg.ini`);
      buffer = await response.arrayBuffer();
    }

    // Decode UTF-16 LE
    const decoder = new TextDecoder('utf-16le');
    const text = decoder.decode(buffer);

    deviceCache = parseCfgIni(text);
    return deviceCache;
  } catch (error) {
    console.error('Failed to load RK Cfg.ini:', error);
    return new Map();
  }
}

/**
 * Get device name for a specific PID
 */
export async function getDeviceName(pid: string): Promise<string | undefined> {
  const devices = await getRKDevices();
  return devices.get(pid.toLowerCase());
}

/**
 * Get all supported PIDs
 */
export async function getSupportedPIDs(): Promise<string[]> {
  const devices = await getRKDevices();
  return Array.from(devices.keys());
}
