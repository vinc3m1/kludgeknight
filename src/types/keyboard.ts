import type { KeyInfo } from './keycode';

/**
 * Keyboard configuration parsed from KB.ini and Cfg.ini
 */
export interface KeyboardConfig {
  pid: string;
  name: string;
  keys: Key[];
  imageUrl: string; // Full URL to keyboard image
}

/**
 * Individual key configuration from KB.ini
 */
export interface Key {
  bIndex: number;
  keyInfo: KeyInfo; // Reference to VK/HID/label info
  rect: [number, number, number, number]; // [left, top, right, bottom] in image pixel coordinates
}
