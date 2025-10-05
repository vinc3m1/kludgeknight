import type { KeyInfo } from './keycode';

/**
 * Lighting mode capability flags from LedOpt in KB.ini
 */
export interface LightingModeFlags {
  animation: boolean;   // Position 1: Animation toggle (always 0, reserved)
  speed: boolean;       // Position 2: Animation speed slider (1-5)
  brightness: boolean;  // Position 3: Brightness slider (1-5)
  direction: number;    // Position 4: Direction (0=none, 1=left/right, 2=up/down)
  random: boolean;      // Position 5: Random color toggle
  colorPicker: boolean; // Position 6: RGB color picker
}

/**
 * Lighting mode definition
 */
export interface LightingMode {
  index: number;           // 1-based mode index (LedOpt1 = index 1)
  name: string;            // Display name from led.xml
  flags: LightingModeFlags; // Capability flags
}

/**
 * Keyboard configuration parsed from KB.ini and Cfg.ini
 */
export interface KeyboardConfig {
  pid: string;
  name: string;
  keys: Key[];
  imageUrl: string; // Full URL to keyboard image
  lightEnabled: boolean; // Has lighting support
  rgb: boolean; // true = RGB, false = single-color backlit
  lightingModes: LightingMode[]; // Available lighting modes
}

/**
 * Individual key configuration from KB.ini
 */
export interface Key {
  bIndex: number;
  keyInfo: KeyInfo; // Reference to VK/HID/label info
  rect: [number, number, number, number]; // [left, top, right, bottom] in image pixel coordinates
}
