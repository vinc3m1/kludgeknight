/**
 * Parse led.xml files for lighting mode names
 * Files are UTF-16 LE encoded
 */

/**
 * Parse led.xml to get mode names
 * Tries device-specific path first, falls back to global
 */
export async function parseLedXml(pid: string): Promise<Map<number, string>> {
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
  } catch (error) {
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

  // Extract tc_led1, tc_led2, etc.
  for (let i = 1; i <= 21; i++) {
    const element = doc.querySelector(`tc_led${i}`);
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
