/**
 * Parse led.xml files for lighting mode names
 * Files are UTF-16 LE encoded
 */

/**
 * Parse led.xml to get mode names
 * Tries device-specific path first, falls back to global
 * @param pid - Product ID
 * @param isRgb - Whether the keyboard is RGB (true) or single-color backlit (false)
 */
export async function parseLedXml(pid: string, isRgb: boolean = false): Promise<Map<number, string>> {
  const modeNames = new Map<number, string>();

  // Try device-specific path first
  const devicePath = `${import.meta.env.BASE_URL}rk/Dev/${pid.toUpperCase()}/en/led.xml`;
  const globalPath = `${import.meta.env.BASE_URL}rk/Dev/en/led.xml`;

  let xmlText: string | null = null;

  // Try device-specific
  try {
    const response = await fetch(devicePath);
    if (response.ok) {
      xmlText = await parseUtf16Xml(await response.arrayBuffer());
    }
  } catch {
    // Fallback to global
  }

  // Try global fallback if device-specific failed
  if (!xmlText) {
    try {
      const response = await fetch(globalPath);
      if (response.ok) {
        xmlText = await parseUtf16Xml(await response.arrayBuffer());
      }
    } catch (error) {
      console.error('Failed to load led.xml:', error);
      return modeNames;
    }
  }

  if (!xmlText) {
    return modeNames;
  }

  // Parse XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'text/xml');

  // Extract mode names based on keyboard type
  // RGB keyboards use tc_led_mode1-21, backlit keyboards use tc_led1-20
  const tagPrefix = isRgb ? 'tc_led_mode' : 'tc_led';
  const maxModes = isRgb ? 21 : 20;

  for (let i = 1; i <= maxModes; i++) {
    const element = doc.querySelector(`${tagPrefix}${i}`);
    if (element && element.textContent) {
      modeNames.set(i, element.textContent);
    }
  }

  return modeNames;
}

/**
 * Parse UTF-16 LE encoded XML
 */
async function parseUtf16Xml(arrayBuffer: ArrayBuffer): Promise<string> {
  const decoder = new TextDecoder('utf-16le');
  return decoder.decode(arrayBuffer);
}
