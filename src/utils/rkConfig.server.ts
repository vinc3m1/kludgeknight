/**
 * Build-time RK Cfg.ini loader.
 * Keep Node filesystem imports out of browser-reachable modules.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parseCfgIni } from './rkConfig';

let deviceCache: Map<string, string> | null = null;

/**
 * Load and parse Cfg.ini directly from disk during Astro static generation.
 */
export function getRKDevices(): Map<string, string> {
  if (deviceCache) {
    return deviceCache;
  }

  const cfgPath = join(process.cwd(), 'public', 'rk', 'Cfg.ini');
  const bytes = readFileSync(cfgPath);
  const decoder = new TextDecoder('utf-16le');
  const text = decoder.decode(bytes);

  deviceCache = parseCfgIni(text);
  return deviceCache;
}
