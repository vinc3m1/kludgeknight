/**
 * Parse led.xml files for lighting mode names
 * Files are UTF-16 LE encoded
 */

import { LightingType } from '../types/keyboard';

/**
 * Parse led.xml to get mode names
 * Uses pre-built manifest if available, otherwise falls back to fetching
 * @param pid - Product ID
 * @param lightingType - Type of lighting system
 * @param ledManifestJson - Pre-built LED manifest (optional)
 */
export async function parseLedXml(
  pid: string,
  lightingType: LightingType,
  ledManifestJson: string | null = null
): Promise<Map<number, string>> {
  const modeNames = new Map<number, string>();

  // Use manifest if available
  if (ledManifestJson) {
    try {
      const manifest = JSON.parse(ledManifestJson);

      // Determine which mode type to use
      let modeType: 'rgb' | 'backlit' | 'eft';
      switch (lightingType) {
        case LightingType.EFT:
          // Per-key reactive RGB effects (tc_eft1-19)
          modeType = 'eft';
          break;
        case LightingType.RGB:
          // Full keyboard RGB (tc_led_mode1-21)
          modeType = 'rgb';
          break;
        case LightingType.Backlit:
          // Single-color backlight (tc_led1-20)
          modeType = 'backlit';
          break;
        default:
          return modeNames;
      }

      // Try device-specific first
      const deviceModes = manifest.devices?.[pid.toUpperCase()]?.[modeType];
      if (deviceModes) {
        for (const [index, name] of Object.entries(deviceModes)) {
          modeNames.set(parseInt(index), name as string);
        }
        return modeNames;
      }

      // Fallback to global
      const globalModes = manifest.global?.[modeType];
      if (globalModes) {
        for (const [index, name] of Object.entries(globalModes)) {
          modeNames.set(parseInt(index), name as string);
        }
        return modeNames;
      }
    } catch (error) {
      console.warn('Failed to parse LED manifest, falling back to fetch:', error);
    }
  }

  // Fallback: Fetch XML files (old behavior, now only used if manifest unavailable)
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
  let tagPrefix: string;
  let maxModes: number;

  switch (lightingType) {
    case LightingType.EFT:
      // Per-key reactive RGB effects (tc_eft1-19)
      tagPrefix = 'tc_eft';
      maxModes = 19;
      break;
    case LightingType.RGB:
      // Full keyboard RGB (tc_led_mode1-21)
      tagPrefix = 'tc_led_mode';
      maxModes = 21;
      break;
    case LightingType.Backlit:
      // Single-color backlight (tc_led1-20)
      tagPrefix = 'tc_led';
      maxModes = 20;
      break;
    default:
      return modeNames;
  }

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
