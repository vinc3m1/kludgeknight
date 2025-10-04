/**
 * USB HID Keyboard Key Codes
 * Based on Rangoli's keycode.h
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
  Key_Enter = 0x28, // Alias for Return
  Key_Escape = 0x29,
  Key_Backspace = 0x2a,
  Key_Tab = 0x2b,
  Key_Space = 0x2c,
  Key_Minus = 0x2d,
  Key_Hyphen = 0x2d, // Alias for Minus (Rangoli naming)
  Key_Equal = 0x2e,
  Key_Equals = 0x2e, // Alias for Equal (Rangoli naming)
  Key_BracketLeft = 0x2f,
  Key_Left_Bracket = 0x2f, // Alias for BracketLeft (Rangoli naming)
  Key_BracketRight = 0x30,
  Key_Right_Bracket = 0x30, // Alias for BracketRight (Rangoli naming)
  Key_Backslash = 0x31,
  Key_Back_Slash = 0x31, // Alias for Backslash (Rangoli naming)
  Key_Semicolon = 0x33,
  Key_Semi_Colon = 0x33, // Alias for Semicolon (Rangoli naming)
  Key_Apostrophe = 0x34,
  Key_Quote = 0x34, // Alias for Apostrophe (Rangoli naming)
  Key_Grave = 0x35,
  Key_Back_Quote = 0x35, // Alias for Grave (Rangoli naming)
  Key_Comma = 0x36,
  Key_Period = 0x37,
  Key_Dot = 0x37, // Alias for Period (Rangoli naming)
  Key_Slash = 0x38,
  Key_CapsLock = 0x39,
  Key_Caps_Lock = 0x39, // Alias for CapsLock (Rangoli naming)

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
  Key_Page_Up = 0x4b, // Alias for PageUp (Rangoli naming)
  Key_Delete = 0x4c,
  Key_End = 0x4d,
  Key_PageDown = 0x4e,
  Key_Page_Down = 0x4e, // Alias for PageDown (Rangoli naming)
  Key_ArrowRight = 0x4f,
  Key_Right = 0x4f, // Alias for ArrowRight (Rangoli naming)
  Key_ArrowLeft = 0x50,
  Key_Left = 0x50, // Alias for ArrowLeft (Rangoli naming)
  Key_ArrowDown = 0x51,
  Key_Down = 0x51, // Alias for ArrowDown (Rangoli naming)
  Key_ArrowUp = 0x52,
  Key_Up = 0x52, // Alias for ArrowUp (Rangoli naming)

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
  Key_Left_Control = 0xe0, // Alias for ControlLeft (Rangoli naming)
  Key_ShiftLeft = 0xe1,
  Key_Left_Shift = 0xe1, // Alias for ShiftLeft (Rangoli naming)
  Key_AltLeft = 0xe2,
  Key_Left_Alt = 0xe2, // Alias for AltLeft (Rangoli naming)
  Key_MetaLeft = 0xe3,
  Key_Left_Super = 0xe3, // Alias for MetaLeft (Rangoli naming)
  Key_ControlRight = 0xe4,
  Key_Right_Control = 0xe4, // Alias for ControlRight (Rangoli naming)
  Key_ShiftRight = 0xe5,
  Key_Right_Shift = 0xe5, // Alias for ShiftRight (Rangoli naming)
  Key_AltRight = 0xe6,
  Key_Right_Alt = 0xe6, // Alias for AltRight (Rangoli naming)
  Key_MetaRight = 0xe7,
  Key_Right_Super = 0xe7, // Alias for MetaRight (Rangoli naming)
  Key_Fn = 0xb0, // Fn key (non-standard, Rangoli-specific)

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
