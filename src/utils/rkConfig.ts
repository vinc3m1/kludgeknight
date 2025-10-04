/**
 * Parse RK Cfg.ini to get device mappings
 */

export interface RKDevice {
  pid: string;
  name: string;
}

let deviceCache: Map<string, string> | null = null;

/**
 * Parse Cfg.ini which is UTF-16 LE encoded
 * Returns a map of PID -> Device Name
 */
export async function getRKDevices(): Promise<Map<string, string>> {
  if (deviceCache) {
    return deviceCache;
  }

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}rk/Cfg.ini`);
    const buffer = await response.arrayBuffer();

    // Decode UTF-16 LE
    const decoder = new TextDecoder('utf-16le');
    const text = decoder.decode(buffer);

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

    deviceCache = devices;
    return devices;
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
