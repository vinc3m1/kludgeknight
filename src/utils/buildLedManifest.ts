import fs from 'fs';
import path from 'path';

export interface LedManifest {
  global: {
    rgb: Map<number, string>;      // tc_led_mode1-21
    backlit: Map<number, string>;  // tc_led1-20
    eft: Map<number, string>;      // tc_eft1-19
  };
  devices: {
    [pid: string]: {
      rgb: Map<number, string>;
      backlit: Map<number, string>;
      eft: Map<number, string>;
    };
  };
}

/**
 * Parse UTF-16 LE XML file and extract mode names
 */
function parseLedXmlFile(filePath: string): {
  rgb: Map<number, string>;
  backlit: Map<number, string>;
  eft: Map<number, string>;
} {
  const rgb = new Map<number, string>();
  const backlit = new Map<number, string>();
  const eft = new Map<number, string>();

  try {
    const buffer = fs.readFileSync(filePath);
    const text = new TextDecoder('utf-16le').decode(buffer);

    // Parse XML manually (simple extraction)
    const extractModes = (prefix: string, maxModes: number, map: Map<number, string>) => {
      for (let i = 1; i <= maxModes; i++) {
        const regex = new RegExp(`<${prefix}${i}>([^<]+)</${prefix}${i}>`, 'i');
        const match = text.match(regex);
        if (match && match[1]) {
          map.set(i, match[1]);
        }
      }
    };

    extractModes('tc_led_mode', 21, rgb);       // RGB modes
    extractModes('tc_led', 20, backlit);        // Backlit modes
    extractModes('tc_eft', 19, eft);            // EFT (per-key) modes

  } catch (error) {
    console.warn(`Failed to parse led.xml at ${filePath}:`, error);
  }

  return { rgb, backlit, eft };
}

/**
 * Build manifest of all led.xml files at build time
 */
export function buildLedManifest(): LedManifest {
  const manifest: LedManifest = {
    global: {
      rgb: new Map(),
      backlit: new Map(),
      eft: new Map(),
    },
    devices: {},
  };

  const devDir = path.join(process.cwd(), 'public/rk/Dev');

  // Parse global led.xml
  const globalLedPath = path.join(devDir, 'en/led.xml');
  if (fs.existsSync(globalLedPath)) {
    const modes = parseLedXmlFile(globalLedPath);
    manifest.global = modes;
  }

  // Parse device-specific led.xml files
  const entries = fs.readdirSync(devDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const pid = entry.name;
    const ledPath = path.join(devDir, pid, 'en/led.xml');

    if (fs.existsSync(ledPath)) {
      const modes = parseLedXmlFile(ledPath);
      manifest.devices[pid.toUpperCase()] = modes;
    }
  }

  return manifest;
}

/**
 * Serialize manifest to JSON (converts Maps to objects)
 */
export function serializeLedManifest(manifest: LedManifest): string {
  const mapToObject = (map: Map<number, string>) => Object.fromEntries(map.entries());

  return JSON.stringify({
    global: {
      rgb: mapToObject(manifest.global.rgb),
      backlit: mapToObject(manifest.global.backlit),
      eft: mapToObject(manifest.global.eft),
    },
    devices: Object.fromEntries(
      Object.entries(manifest.devices).map(([pid, modes]) => [
        pid,
        {
          rgb: mapToObject(modes.rgb),
          backlit: mapToObject(modes.backlit),
          eft: mapToObject(modes.eft),
        }
      ])
    )
  });
}
