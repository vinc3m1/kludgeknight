/**
 * Unified key mapping system
 * Maps Windows VK codes (source of truth from KB.ini) to RK firmware codes and labels
 */

/**
 * Windows Virtual Key code (from KB.ini files)
 */
export type VKCode = number;

/**
 * Royal Kludge firmware keycode (sent to keyboard hardware)
 * Based on Rangoli's keycode.h - NOT standard USB HID codes
 */
export type FirmwareCode = number;

/**
 * Key categories in display order
 */
export const KEY_CATEGORIES = [
  'Letters',
  'Numbers',
  'Symbols',
  'Function Keys',
  'Navigation',
  'Modifiers',
  'Numpad',
  'Media',
  'Special',
] as const;

export type KeyCategory = typeof KEY_CATEGORIES[number];

export interface KeyInfo {
  vk: VKCode;     // Windows Virtual Key code (from KB.ini)
  fw: FirmwareCode;    // RK firmware code (sent to keyboard)
  category: KeyCategory;  // Key category for UI grouping
  label: string;  // Human-readable label
}

/**
 * Complete key mapping with VK code as the source of truth
 * VK codes from KB.ini files → RK firmware codes for keyboard
 * Firmware codes based on Rangoli's keycode.h
 */
export const KEY_MAP: Record<number, KeyInfo> = {
  // Letters (VK: 0x41-0x5A, FW: HID << 8)
  0x41: { vk: 0x41, fw: 0x0400, category: 'Letters', label: 'A' },
  0x42: { vk: 0x42, fw: 0x0500, category: 'Letters', label: 'B' },
  0x43: { vk: 0x43, fw: 0x0600, category: 'Letters', label: 'C' },
  0x44: { vk: 0x44, fw: 0x0700, category: 'Letters', label: 'D' },
  0x45: { vk: 0x45, fw: 0x0800, category: 'Letters', label: 'E' },
  0x46: { vk: 0x46, fw: 0x0900, category: 'Letters', label: 'F' },
  0x47: { vk: 0x47, fw: 0x0a00, category: 'Letters', label: 'G' },
  0x48: { vk: 0x48, fw: 0x0b00, category: 'Letters', label: 'H' },
  0x49: { vk: 0x49, fw: 0x0c00, category: 'Letters', label: 'I' },
  0x4A: { vk: 0x4a, fw: 0x0d00, category: 'Letters', label: 'J' },
  0x4B: { vk: 0x4b, fw: 0x0e00, category: 'Letters', label: 'K' },
  0x4C: { vk: 0x4c, fw: 0x0f00, category: 'Letters', label: 'L' },
  0x4D: { vk: 0x4d, fw: 0x1000, category: 'Letters', label: 'M' },
  0x4E: { vk: 0x4e, fw: 0x1100, category: 'Letters', label: 'N' },
  0x4F: { vk: 0x4f, fw: 0x1200, category: 'Letters', label: 'O' },
  0x50: { vk: 0x50, fw: 0x1300, category: 'Letters', label: 'P' },
  0x51: { vk: 0x51, fw: 0x1400, category: 'Letters', label: 'Q' },
  0x52: { vk: 0x52, fw: 0x1500, category: 'Letters', label: 'R' },
  0x53: { vk: 0x53, fw: 0x1600, category: 'Letters', label: 'S' },
  0x54: { vk: 0x54, fw: 0x1700, category: 'Letters', label: 'T' },
  0x55: { vk: 0x55, fw: 0x1800, category: 'Letters', label: 'U' },
  0x56: { vk: 0x56, fw: 0x1900, category: 'Letters', label: 'V' },
  0x57: { vk: 0x57, fw: 0x1a00, category: 'Letters', label: 'W' },
  0x58: { vk: 0x58, fw: 0x1b00, category: 'Letters', label: 'X' },
  0x59: { vk: 0x59, fw: 0x1c00, category: 'Letters', label: 'Y' },
  0x5A: { vk: 0x5a, fw: 0x1d00, category: 'Letters', label: 'Z' },

  // Numbers (VK: 0x30-0x39, FW: HID << 8)
  0x30: { vk: 0x30, fw: 0x2700, category: 'Numbers', label: '0' },
  0x31: { vk: 0x31, fw: 0x1e00, category: 'Numbers', label: '1' },
  0x32: { vk: 0x32, fw: 0x1f00, category: 'Numbers', label: '2' },
  0x33: { vk: 0x33, fw: 0x2000, category: 'Numbers', label: '3' },
  0x34: { vk: 0x34, fw: 0x2100, category: 'Numbers', label: '4' },
  0x35: { vk: 0x35, fw: 0x2200, category: 'Numbers', label: '5' },
  0x36: { vk: 0x36, fw: 0x2300, category: 'Numbers', label: '6' },
  0x37: { vk: 0x37, fw: 0x2400, category: 'Numbers', label: '7' },
  0x38: { vk: 0x38, fw: 0x2500, category: 'Numbers', label: '8' },
  0x39: { vk: 0x39, fw: 0x2600, category: 'Numbers', label: '9' },

  // Function keys (VK: 0x70-0x7B, FW: HID << 8)
  0x70: { vk: 0x70, fw: 0x3a00, category: 'Function Keys', label: 'F1' },
  0x71: { vk: 0x71, fw: 0x3b00, category: 'Function Keys', label: 'F2' },
  0x72: { vk: 0x72, fw: 0x3c00, category: 'Function Keys', label: 'F3' },
  0x73: { vk: 0x73, fw: 0x3d00, category: 'Function Keys', label: 'F4' },
  0x74: { vk: 0x74, fw: 0x3e00, category: 'Function Keys', label: 'F5' },
  0x75: { vk: 0x75, fw: 0x3f00, category: 'Function Keys', label: 'F6' },
  0x76: { vk: 0x76, fw: 0x4000, category: 'Function Keys', label: 'F7' },
  0x77: { vk: 0x77, fw: 0x4100, category: 'Function Keys', label: 'F8' },
  0x78: { vk: 0x78, fw: 0x4200, category: 'Function Keys', label: 'F9' },
  0x79: { vk: 0x79, fw: 0x4300, category: 'Function Keys', label: 'F10' },
  0x7A: { vk: 0x7a, fw: 0x4400, category: 'Function Keys', label: 'F11' },
  0x7B: { vk: 0x7b, fw: 0x4500, category: 'Function Keys', label: 'F12' },

  // Special keys
  0x08: { vk: 0x08, fw: 0x2a00, category: 'Special', label: 'Backspace' },
  0x09: { vk: 0x09, fw: 0x2b00, category: 'Special', label: 'Tab' },
  0x0D: { vk: 0x0d, fw: 0x2800, category: 'Special', label: 'Enter' },
  0x13: { vk: 0x13, fw: 0x4800, category: 'Special', label: 'Pause' },
  0x14: { vk: 0x14, fw: 0x3900, category: 'Special', label: 'Caps Lock' },
  0x1B: { vk: 0x1b, fw: 0x2900, category: 'Special', label: 'Esc' },
  0x20: { vk: 0x20, fw: 0x2c00, category: 'Special', label: 'Space' },
  0xE0: { vk: 0xe0, fw: 0x2c00, category: 'Special', label: 'Space (Right)' },

  // Navigation
  0x21: { vk: 0x21, fw: 0x4b00, category: 'Navigation', label: 'Page Up' },
  0x22: { vk: 0x22, fw: 0x4e00, category: 'Navigation', label: 'Page Down' },
  0x23: { vk: 0x23, fw: 0x4d00, category: 'Navigation', label: 'End' },
  0x24: { vk: 0x24, fw: 0x4a00, category: 'Navigation', label: 'Home' },
  0x25: { vk: 0x25, fw: 0x5000, category: 'Navigation', label: 'Left' },
  0x26: { vk: 0x26, fw: 0x5200, category: 'Navigation', label: 'Up' },
  0x27: { vk: 0x27, fw: 0x4f00, category: 'Navigation', label: 'Right' },
  0x28: { vk: 0x28, fw: 0x5100, category: 'Navigation', label: 'Down' },
  0x2C: { vk: 0x2c, fw: 0x4600, category: 'Navigation', label: 'Print Screen' },
  0x2D: { vk: 0x2d, fw: 0x4900, category: 'Navigation', label: 'Insert' },
  0x2E: { vk: 0x2e, fw: 0x4c00, category: 'Navigation', label: 'Delete' },

  // Punctuation
  0xBA: { vk: 0xba, fw: 0x3300, category: 'Symbols', label: '; :' },
  0xBB: { vk: 0xbb, fw: 0x2e00, category: 'Symbols', label: '= +' },
  0xBC: { vk: 0xbc, fw: 0x3600, category: 'Symbols', label: ', <' },
  0xBD: { vk: 0xbd, fw: 0x2d00, category: 'Symbols', label: '- _' },
  0xBE: { vk: 0xbe, fw: 0x3700, category: 'Symbols', label: '. >' },
  0xBF: { vk: 0xbf, fw: 0x3800, category: 'Symbols', label: '/ ?' },
  0xC0: { vk: 0xc0, fw: 0x3500, category: 'Symbols', label: '` ~' },
  0xDB: { vk: 0xdb, fw: 0x2f00, category: 'Symbols', label: '[ {' },
  0xDC: { vk: 0xdc, fw: 0x3100, category: 'Symbols', label: '\\ |' },
  0xDD: { vk: 0xdd, fw: 0x3000, category: 'Symbols', label: '] }' },
  0xDE: { vk: 0xde, fw: 0x3400, category: 'Symbols', label: '\' "' },

  // Modifiers - SPECIAL FIRMWARE BIT FLAGS (from Rangoli keycode.h)
  0x91: { vk: 0x91, fw: 0x4700, category: 'Special', label: 'Scroll Lock' },
  0xA0: { vk: 0xa0, fw: 0x020000, category: 'Modifiers', label: 'Left Shift' },
  0xA1: { vk: 0xa1, fw: 0x200000, category: 'Modifiers', label: 'Right Shift' },
  0xA2: { vk: 0xa2, fw: 0x010000, category: 'Modifiers', label: 'Left Ctrl' },
  0xA3: { vk: 0xa3, fw: 0x100000, category: 'Modifiers', label: 'Right Ctrl' },
  0xA4: { vk: 0xa4, fw: 0x040000, category: 'Modifiers', label: 'Left Alt' },
  0xA5: { vk: 0xa5, fw: 0x400000, category: 'Modifiers', label: 'Right Alt' },

  // Windows/Meta keys
  0x5B: { vk: 0x5b, fw: 0x080000, category: 'Modifiers', label: 'Left Win' },
  0x5C: { vk: 0x5c, fw: 0x800000, category: 'Modifiers', label: 'Right Win' },
  0x5D: { vk: 0x5d, fw: 0x6500, category: 'Special', label: 'App' },

  // Numpad (VK: 0x60-0x6F, FW: HID << 8)
  0x60: { vk: 0x60, fw: 0x6200, category: 'Numpad', label: 'Num 0' },
  0x61: { vk: 0x61, fw: 0x5900, category: 'Numpad', label: 'Num 1' },
  0x62: { vk: 0x62, fw: 0x5a00, category: 'Numpad', label: 'Num 2' },
  0x63: { vk: 0x63, fw: 0x5b00, category: 'Numpad', label: 'Num 3' },
  0x64: { vk: 0x64, fw: 0x5c00, category: 'Numpad', label: 'Num 4' },
  0x65: { vk: 0x65, fw: 0x5d00, category: 'Numpad', label: 'Num 5' },
  0x66: { vk: 0x66, fw: 0x5e00, category: 'Numpad', label: 'Num 6' },
  0x67: { vk: 0x67, fw: 0x5f00, category: 'Numpad', label: 'Num 7' },
  0x68: { vk: 0x68, fw: 0x6000, category: 'Numpad', label: 'Num 8' },
  0x69: { vk: 0x69, fw: 0x6100, category: 'Numpad', label: 'Num 9' },
  0x6A: { vk: 0x6a, fw: 0x5500, category: 'Numpad', label: 'Num *' },
  0x6B: { vk: 0x6b, fw: 0x5700, category: 'Numpad', label: 'Num +' },
  0x6D: { vk: 0x6d, fw: 0x5600, category: 'Numpad', label: 'Num -' },
  0x6E: { vk: 0x6e, fw: 0x6300, category: 'Numpad', label: 'Num .' },
  0x6F: { vk: 0x6f, fw: 0x5400, category: 'Numpad', label: 'Num /' },
  0x90: { vk: 0x90, fw: 0x5300, category: 'Numpad', label: 'Num Lock' },

  // Special RK keys
  0xFA: { vk: 0xfa, fw: 0xb000, category: 'Modifiers', label: 'Fn' },
  0xFD: { vk: 0xfd, fw: 0x5800, category: 'Numpad', label: 'Num Enter' },

  // RK Macro keys (from USB capture of SPLIT70 reset)
  0xD9: { vk: 0xd9, fw: 0x010400, category: 'Special', label: 'M1 (Ctrl+A)' },
  0xB9: { vk: 0xb9, fw: 0x010600, category: 'Special', label: 'M2 (Ctrl+C)' },
  0xD8: { vk: 0xd8, fw: 0x003200, category: 'Special', label: 'M3 (Sleep?)' },
  0xB8: { vk: 0xb8, fw: 0x011b00, category: 'Special', label: 'M4 (Ctrl+X)' },
  0xDA: { vk: 0xda, fw: 0x008a00, category: 'Special', label: 'M5' },  // Unknown

  // Media keys (VK: 0xAD-0xB3, FW: 0x01000000 | HID Consumer Control)
  0xAD: { vk: 0xad, fw: 0x010000e2, category: 'Media', label: 'Mute' },
  0xAE: { vk: 0xae, fw: 0x010000ea, category: 'Media', label: 'Volume Down' },
  0xAF: { vk: 0xaf, fw: 0x010000e9, category: 'Media', label: 'Volume Up' },
  0xB0: { vk: 0xb0, fw: 0x010000b5, category: 'Media', label: 'Next Track' },
  0xB1: { vk: 0xb1, fw: 0x010000b6, category: 'Media', label: 'Previous Track' },
  0xB2: { vk: 0xb2, fw: 0x010000b7, category: 'Media', label: 'Stop' },
  0xB3: { vk: 0xb3, fw: 0x010000cd, category: 'Media', label: 'Play/Pause' },

  // Programmable functions (stub VK codes - not real Windows VKs, only for remapping)
  // Use 0x1xxx range to avoid conflicts with real VK codes (which max at 0xFF)
  0x1001: { vk: 0x1001, fw: 0x0100006f, category: 'Media', label: 'Brightness Up' },
  0x1002: { vk: 0x1002, fw: 0x01000070, category: 'Media', label: 'Brightness Down' },
};

/**
 * Convert Windows VK code to RK firmware code
 */
export function vkToFirmwareCode(vk: VKCode): FirmwareCode | undefined {
  return KEY_MAP[vk]?.fw;
}

/**
 * Convert Windows VK code to human-readable label
 */
export function vkToLabel(vk: VKCode): string {
  return KEY_MAP[vk]?.label || `VK_0x${vk.toString(16).toUpperCase()}`;
}

/**
 * Parse VK hex string (e.g., "0x41") to KeyInfo
 */
export function parseVK(vkHex: string): KeyInfo | undefined {
  const vk = parseInt(vkHex, 16);
  return KEY_MAP[vk];
}

/**
 * Get all key information by VK code
 */
export function getKeyInfo(vk: VKCode): KeyInfo | undefined {
  return KEY_MAP[vk];
}

/**
 * Get all keys in a specific category
 */
export function getKeysByCategory(category: KeyCategory): KeyInfo[] {
  return Object.values(KEY_MAP).filter(key => key.category === category);
}

/**
 * Get all keys grouped by category, in display order
 */
export function getAllKeysByCategory(): Record<KeyCategory, KeyInfo[]> {
  const grouped: Partial<Record<KeyCategory, KeyInfo[]>> = {};

  for (const key of Object.values(KEY_MAP)) {
    if (!grouped[key.category]) {
      grouped[key.category] = [];
    }
    // Safe to use non-null assertion here because we just initialized it above
    // But let's make it safer by checking first
    const categoryArray = grouped[key.category];
    if (categoryArray) {
      categoryArray.push(key);
    }
  }

  // Return categories in display order
  const result: Partial<Record<KeyCategory, KeyInfo[]>> = {};
  for (const category of KEY_CATEGORIES) {
    if (grouped[category]) {
      result[category] = grouped[category];
    }
  }

  return result as Record<KeyCategory, KeyInfo[]>;
}
