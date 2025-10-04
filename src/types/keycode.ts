/**
 * Unified key mapping system
 * Maps Windows VK codes (source of truth from KB.ini) to USB HID scan codes and labels
 */

export interface KeyInfo {
  vk: number;     // Windows Virtual Key code (from KB.ini)
  hid: number;    // USB HID scan code (sent to keyboard)
  label: string;  // Human-readable label
}

/**
 * Complete key mapping with VK code as the source of truth
 * VK codes from KB.ini files → HID scan codes for keyboard
 */
export const KEY_MAP: Record<number, KeyInfo> = {
  // Letters (VK: 0x41-0x5A, HID: 0x04-0x1D)
  0x41: { vk: 0x41, hid: 0x04, label: 'A' },
  0x42: { vk: 0x42, hid: 0x05, label: 'B' },
  0x43: { vk: 0x43, hid: 0x06, label: 'C' },
  0x44: { vk: 0x44, hid: 0x07, label: 'D' },
  0x45: { vk: 0x45, hid: 0x08, label: 'E' },
  0x46: { vk: 0x46, hid: 0x09, label: 'F' },
  0x47: { vk: 0x47, hid: 0x0a, label: 'G' },
  0x48: { vk: 0x48, hid: 0x0b, label: 'H' },
  0x49: { vk: 0x49, hid: 0x0c, label: 'I' },
  0x4A: { vk: 0x4a, hid: 0x0d, label: 'J' },
  0x4B: { vk: 0x4b, hid: 0x0e, label: 'K' },
  0x4C: { vk: 0x4c, hid: 0x0f, label: 'L' },
  0x4D: { vk: 0x4d, hid: 0x10, label: 'M' },
  0x4E: { vk: 0x4e, hid: 0x11, label: 'N' },
  0x4F: { vk: 0x4f, hid: 0x12, label: 'O' },
  0x50: { vk: 0x50, hid: 0x13, label: 'P' },
  0x51: { vk: 0x51, hid: 0x14, label: 'Q' },
  0x52: { vk: 0x52, hid: 0x15, label: 'R' },
  0x53: { vk: 0x53, hid: 0x16, label: 'S' },
  0x54: { vk: 0x54, hid: 0x17, label: 'T' },
  0x55: { vk: 0x55, hid: 0x18, label: 'U' },
  0x56: { vk: 0x56, hid: 0x19, label: 'V' },
  0x57: { vk: 0x57, hid: 0x1a, label: 'W' },
  0x58: { vk: 0x58, hid: 0x1b, label: 'X' },
  0x59: { vk: 0x59, hid: 0x1c, label: 'Y' },
  0x5A: { vk: 0x5a, hid: 0x1d, label: 'Z' },

  // Numbers (VK: 0x30-0x39, HID: 0x27, 0x1E-0x26)
  0x30: { vk: 0x30, hid: 0x27, label: '0' },
  0x31: { vk: 0x31, hid: 0x1e, label: '1' },
  0x32: { vk: 0x32, hid: 0x1f, label: '2' },
  0x33: { vk: 0x33, hid: 0x20, label: '3' },
  0x34: { vk: 0x34, hid: 0x21, label: '4' },
  0x35: { vk: 0x35, hid: 0x22, label: '5' },
  0x36: { vk: 0x36, hid: 0x23, label: '6' },
  0x37: { vk: 0x37, hid: 0x24, label: '7' },
  0x38: { vk: 0x38, hid: 0x25, label: '8' },
  0x39: { vk: 0x39, hid: 0x26, label: '9' },

  // Function keys (VK: 0x70-0x7B, HID: 0x3A-0x45)
  0x70: { vk: 0x70, hid: 0x3a, label: 'F1' },
  0x71: { vk: 0x71, hid: 0x3b, label: 'F2' },
  0x72: { vk: 0x72, hid: 0x3c, label: 'F3' },
  0x73: { vk: 0x73, hid: 0x3d, label: 'F4' },
  0x74: { vk: 0x74, hid: 0x3e, label: 'F5' },
  0x75: { vk: 0x75, hid: 0x3f, label: 'F6' },
  0x76: { vk: 0x76, hid: 0x40, label: 'F7' },
  0x77: { vk: 0x77, hid: 0x41, label: 'F8' },
  0x78: { vk: 0x78, hid: 0x42, label: 'F9' },
  0x79: { vk: 0x79, hid: 0x43, label: 'F10' },
  0x7A: { vk: 0x7a, hid: 0x44, label: 'F11' },
  0x7B: { vk: 0x7b, hid: 0x45, label: 'F12' },

  // Special keys
  0x08: { vk: 0x08, hid: 0x2a, label: 'Backspace' },
  0x09: { vk: 0x09, hid: 0x2b, label: 'Tab' },
  0x0D: { vk: 0x0d, hid: 0x28, label: 'Enter' },
  0x13: { vk: 0x13, hid: 0x48, label: 'Pause' },
  0x14: { vk: 0x14, hid: 0x39, label: 'Caps Lock' },
  0x1B: { vk: 0x1b, hid: 0x29, label: 'Esc' },
  0x20: { vk: 0x20, hid: 0x2c, label: 'Space' },

  // Navigation
  0x21: { vk: 0x21, hid: 0x4b, label: 'Page Up' },
  0x22: { vk: 0x22, hid: 0x4e, label: 'Page Down' },
  0x23: { vk: 0x23, hid: 0x4d, label: 'End' },
  0x24: { vk: 0x24, hid: 0x4a, label: 'Home' },
  0x25: { vk: 0x25, hid: 0x50, label: 'Left' },
  0x26: { vk: 0x26, hid: 0x52, label: 'Up' },
  0x27: { vk: 0x27, hid: 0x4f, label: 'Right' },
  0x28: { vk: 0x28, hid: 0x51, label: 'Down' },
  0x2C: { vk: 0x2c, hid: 0x46, label: 'Print Screen' },
  0x2D: { vk: 0x2d, hid: 0x49, label: 'Insert' },
  0x2E: { vk: 0x2e, hid: 0x4c, label: 'Delete' },

  // Punctuation
  0xBA: { vk: 0xba, hid: 0x33, label: '; :' },
  0xBB: { vk: 0xbb, hid: 0x2e, label: '= +' },
  0xBC: { vk: 0xbc, hid: 0x36, label: ', <' },
  0xBD: { vk: 0xbd, hid: 0x2d, label: '- _' },
  0xBE: { vk: 0xbe, hid: 0x37, label: '. >' },
  0xBF: { vk: 0xbf, hid: 0x38, label: '/ ?' },
  0xC0: { vk: 0xc0, hid: 0x35, label: '` ~' },
  0xDB: { vk: 0xdb, hid: 0x2f, label: '[ {' },
  0xDC: { vk: 0xdc, hid: 0x31, label: '\\ |' },
  0xDD: { vk: 0xdd, hid: 0x30, label: '] }' },
  0xDE: { vk: 0xde, hid: 0x34, label: '\' "' },

  // Modifiers
  0x91: { vk: 0x91, hid: 0x47, label: 'Scroll Lock' },
  0xA0: { vk: 0xa0, hid: 0xe1, label: 'Left Shift' },
  0xA1: { vk: 0xa1, hid: 0xe5, label: 'Right Shift' },
  0xA2: { vk: 0xa2, hid: 0xe0, label: 'Left Ctrl' },
  0xA3: { vk: 0xa3, hid: 0xe4, label: 'Right Ctrl' },
  0xA4: { vk: 0xa4, hid: 0xe2, label: 'Left Alt' },
  0xA5: { vk: 0xa5, hid: 0xe6, label: 'Right Alt' },

  // Windows/Meta keys
  0x5B: { vk: 0x5b, hid: 0xe3, label: 'Left Win' },
  0x5C: { vk: 0x5c, hid: 0xe7, label: 'Right Win' },
  0x5D: { vk: 0x5d, hid: 0x65, label: 'App' },

  // Numpad (VK: 0x60-0x6F, HID: 0x62, 0x59-0x63, 0x54-0x57)
  0x60: { vk: 0x60, hid: 0x62, label: 'Num 0' },
  0x61: { vk: 0x61, hid: 0x59, label: 'Num 1' },
  0x62: { vk: 0x62, hid: 0x5a, label: 'Num 2' },
  0x63: { vk: 0x63, hid: 0x5b, label: 'Num 3' },
  0x64: { vk: 0x64, hid: 0x5c, label: 'Num 4' },
  0x65: { vk: 0x65, hid: 0x5d, label: 'Num 5' },
  0x66: { vk: 0x66, hid: 0x5e, label: 'Num 6' },
  0x67: { vk: 0x67, hid: 0x5f, label: 'Num 7' },
  0x68: { vk: 0x68, hid: 0x60, label: 'Num 8' },
  0x69: { vk: 0x69, hid: 0x61, label: 'Num 9' },
  0x6A: { vk: 0x6a, hid: 0x55, label: 'Num *' },
  0x6B: { vk: 0x6b, hid: 0x57, label: 'Num +' },
  0x6D: { vk: 0x6d, hid: 0x56, label: 'Num -' },
  0x6E: { vk: 0x6e, hid: 0x63, label: 'Num .' },
  0x6F: { vk: 0x6f, hid: 0x54, label: 'Num /' },
  0x90: { vk: 0x90, hid: 0x53, label: 'Num Lock' },

  // Special RK keys
  0xFA: { vk: 0xfa, hid: 0xb0, label: 'Fn' },
  0xFD: { vk: 0xfd, hid: 0x58, label: 'Num Enter' },
};

/**
 * Convert Windows VK code to USB HID scan code
 */
export function vkToHid(vk: number): number | undefined {
  return KEY_MAP[vk]?.hid;
}

/**
 * Convert Windows VK code to human-readable label
 */
export function vkToLabel(vk: number): string {
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
export function getKeyInfo(vk: number): KeyInfo | undefined {
  return KEY_MAP[vk];
}

/**
 * Legacy KeyCode enum for backward compatibility
 * @deprecated Use KEY_MAP and helper functions instead
 */
export enum KeyCode {
  // Letters
  Key_A = 0x04,
  Key_B = 0x05,
  Key_C = 0x06,
  Key_D = 0x07,
  Key_E = 0x08,
  Key_F = 0x09,
  Key_G = 0x0a,
  Key_H = 0x0b,
  Key_I = 0x0c,
  Key_J = 0x0d,
  Key_K = 0x0e,
  Key_L = 0x0f,
  Key_M = 0x10,
  Key_N = 0x11,
  Key_O = 0x12,
  Key_P = 0x13,
  Key_Q = 0x14,
  Key_R = 0x15,
  Key_S = 0x16,
  Key_T = 0x17,
  Key_U = 0x18,
  Key_V = 0x19,
  Key_W = 0x1a,
  Key_X = 0x1b,
  Key_Y = 0x1c,
  Key_Z = 0x1d,

  // Numbers
  Key_1 = 0x1e,
  Key_2 = 0x1f,
  Key_3 = 0x20,
  Key_4 = 0x21,
  Key_5 = 0x22,
  Key_6 = 0x23,
  Key_7 = 0x24,
  Key_8 = 0x25,
  Key_9 = 0x26,
  Key_0 = 0x27,

  // Special keys
  Key_Return = 0x28,
  Key_Enter = 0x28,
  Key_Escape = 0x29,
  Key_Backspace = 0x2a,
  Key_Tab = 0x2b,
  Key_Space = 0x2c,
  Key_Minus = 0x2d,
  Key_Hyphen = 0x2d,
  Key_Equal = 0x2e,
  Key_Equals = 0x2e,
  Key_BracketLeft = 0x2f,
  Key_Left_Bracket = 0x2f,
  Key_BracketRight = 0x30,
  Key_Right_Bracket = 0x30,
  Key_Backslash = 0x31,
  Key_Back_Slash = 0x31,
  Key_Semicolon = 0x33,
  Key_Semi_Colon = 0x33,
  Key_Apostrophe = 0x34,
  Key_Quote = 0x34,
  Key_Grave = 0x35,
  Key_Back_Quote = 0x35,
  Key_Comma = 0x36,
  Key_Period = 0x37,
  Key_Dot = 0x37,
  Key_Slash = 0x38,
  Key_CapsLock = 0x39,
  Key_Caps_Lock = 0x39,

  // Function keys
  Key_F1 = 0x3a,
  Key_F2 = 0x3b,
  Key_F3 = 0x3c,
  Key_F4 = 0x3d,
  Key_F5 = 0x3e,
  Key_F6 = 0x3f,
  Key_F7 = 0x40,
  Key_F8 = 0x41,
  Key_F9 = 0x42,
  Key_F10 = 0x43,
  Key_F11 = 0x44,
  Key_F12 = 0x45,

  // Navigation
  Key_PrintScreen = 0x46,
  Key_ScrollLock = 0x47,
  Key_Pause = 0x48,
  Key_Insert = 0x49,
  Key_Home = 0x4a,
  Key_PageUp = 0x4b,
  Key_Page_Up = 0x4b,
  Key_Delete = 0x4c,
  Key_End = 0x4d,
  Key_PageDown = 0x4e,
  Key_Page_Down = 0x4e,
  Key_ArrowRight = 0x4f,
  Key_Right = 0x4f,
  Key_ArrowLeft = 0x50,
  Key_Left = 0x50,
  Key_ArrowDown = 0x51,
  Key_Down = 0x51,
  Key_ArrowUp = 0x52,
  Key_Up = 0x52,

  // Keypad
  Key_NumLock = 0x53,
  Key_KeypadDivide = 0x54,
  Key_KeypadMultiply = 0x55,
  Key_KeypadMinus = 0x56,
  Key_KeypadPlus = 0x57,
  Key_KeypadEnter = 0x58,
  Key_Keypad1 = 0x59,
  Key_Keypad2 = 0x5a,
  Key_Keypad3 = 0x5b,
  Key_Keypad4 = 0x5c,
  Key_Keypad5 = 0x5d,
  Key_Keypad6 = 0x5e,
  Key_Keypad7 = 0x5f,
  Key_Keypad8 = 0x60,
  Key_Keypad9 = 0x61,
  Key_Keypad0 = 0x62,
  Key_KeypadPeriod = 0x63,

  // Modifiers
  Key_ControlLeft = 0xe0,
  Key_Left_Control = 0xe0,
  Key_ShiftLeft = 0xe1,
  Key_Left_Shift = 0xe1,
  Key_AltLeft = 0xe2,
  Key_Left_Alt = 0xe2,
  Key_MetaLeft = 0xe3,
  Key_Left_Super = 0xe3,
  Key_ControlRight = 0xe4,
  Key_Right_Control = 0xe4,
  Key_ShiftRight = 0xe5,
  Key_Right_Shift = 0xe5,
  Key_AltRight = 0xe6,
  Key_Right_Alt = 0xe6,
  Key_MetaRight = 0xe7,
  Key_Right_Super = 0xe7,
  Key_Fn = 0xb0,

  // Media keys
  Key_MediaPlayPause = 0xe8,
  Key_MediaStop = 0xe9,
  Key_MediaTrackNext = 0xea,
  Key_MediaTrackPrevious = 0xeb,
  Key_MediaEject = 0xec,
  Key_VolumeMute = 0xed,
  Key_VolumeUp = 0xee,
  Key_VolumeDown = 0xef,
}
