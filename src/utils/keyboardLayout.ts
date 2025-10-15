/**
 * Defines the visual keyboard layout for the key selector
 * Arranges keys in a QWERTY keyboard style
 */

import { KEY_MAP, type KeyInfo } from '../types/keycode';

export interface KeyLayoutItem {
  keyInfo?: KeyInfo;
  label?: string;
  displayLabel?: string; // Override label for compact display
  iconName?: string; // Lucide icon name (e.g., 'Play', 'Volume2')
  width?: number; // Width in key units (1 = standard key width)
  rowSpan?: number; // Span multiple rows (for numpad Enter, etc.)
  isPlaceholder?: boolean; // For spacing/gaps
}

export interface KeyboardRow {
  keys: KeyLayoutItem[];
  rowClass?: string; // Optional CSS class for the row
}

/**
 * Get KeyInfo by VK code
 */
function getKey(vk: number): KeyInfo | undefined {
  return KEY_MAP[vk];
}

/**
 * Create a key with optional custom display label, rowspan, and icon
 */
function key(
  vk: number,
  width: number = 1,
  displayLabel?: string,
  rowSpan?: number,
  iconName?: string
): KeyLayoutItem {
  const keyInfo = getKey(vk);
  return { keyInfo, width, displayLabel, rowSpan, iconName };
}

/**
 * Create a spacer/placeholder for layout spacing
 */
function spacer(width: number = 0.5): KeyLayoutItem {
  return { width, isPlaceholder: true };
}

/**
 * Define the main keyboard layout in QWERTY style
 */
export const KEYBOARD_LAYOUT: KeyboardRow[] = [
  // Function key row
  {
    keys: [
      key(0x1b, 1), // Esc
      spacer(),
      key(0x70, 1), // F1
      key(0x71, 1), // F2
      key(0x72, 1), // F3
      key(0x73, 1), // F4
      spacer(0.5),
      key(0x74, 1), // F5
      key(0x75, 1), // F6
      key(0x76, 1), // F7
      key(0x77, 1), // F8
      spacer(0.5),
      key(0x78, 1), // F9
      key(0x79, 1), // F10
      key(0x7a, 1), // F11
      key(0x7b, 1), // F12
    ],
    rowClass: 'function-row',
  },

  // Number row
  {
    keys: [
      key(0xc0, 1), // ` ~
      key(0x31, 1), // 1
      key(0x32, 1), // 2
      key(0x33, 1), // 3
      key(0x34, 1), // 4
      key(0x35, 1), // 5
      key(0x36, 1), // 6
      key(0x37, 1), // 7
      key(0x38, 1), // 8
      key(0x39, 1), // 9
      key(0x30, 1), // 0
      key(0xbd, 1), // - _
      key(0xbb, 1), // = +
      key(0x08, 2), // Backspace
    ],
    rowClass: 'number-row',
  },

  // QWERTY row
  {
    keys: [
      key(0x09, 1.5), // Tab
      key(0x51, 1), // Q
      key(0x57, 1), // W
      key(0x45, 1), // E
      key(0x52, 1), // R
      key(0x54, 1), // T
      key(0x59, 1), // Y
      key(0x55, 1), // U
      key(0x49, 1), // I
      key(0x4f, 1), // O
      key(0x50, 1), // P
      key(0xdb, 1), // [ {
      key(0xdd, 1), // ] }
      key(0xdc, 1.5), // \ |
    ],
    rowClass: 'qwerty-row',
  },

  // ASDF row (home row)
  {
    keys: [
      key(0x14, 1.75, 'Caps'), // Caps Lock
      key(0x41, 1), // A
      key(0x53, 1), // S
      key(0x44, 1), // D
      key(0x46, 1), // F
      key(0x47, 1), // G
      key(0x48, 1), // H
      key(0x4a, 1), // J
      key(0x4b, 1), // K
      key(0x4c, 1), // L
      key(0xba, 1), // ; :
      key(0xde, 1), // ' "
      key(0x0d, 2.25), // Enter
    ],
    rowClass: 'home-row',
  },

  // ZXCV row
  {
    keys: [
      key(0xa0, 2.25, 'L Shift'), // Left Shift
      key(0x5a, 1), // Z
      key(0x58, 1), // X
      key(0x43, 1), // C
      key(0x56, 1), // V
      key(0x42, 1), // B
      key(0x4e, 1), // N
      key(0x4d, 1), // M
      key(0xbc, 1), // , <
      key(0xbe, 1), // . >
      key(0xbf, 1), // / ?
      key(0xa1, 2.75, 'R Shift'), // Right Shift
    ],
    rowClass: 'zxcv-row',
  },

  // Bottom modifier row
  {
    keys: [
      key(0xa2, 1.25, 'L Ctrl'), // Left Ctrl
      key(0x5b, 1.25, 'L Win'), // Left Win
      key(0xa4, 1.25, 'L Alt'), // Left Alt
      key(0x20, 6.25), // Space
      key(0xa5, 1.25, 'R Alt'), // Right Alt
      key(0xfa, 1.25, 'Fn'), // Fn (moved here from App)
      key(0x5c, 1.25, 'R Win'), // Right Win
      key(0xa3, 1.25, 'R Ctrl'), // Right Ctrl
    ],
    rowClass: 'modifier-row',
  },
];

/**
 * Navigation and editing cluster
 */
export const NAVIGATION_CLUSTER: KeyboardRow[] = [
  {
    keys: [
      key(0x2c, 1.75, 'PrtScn'), // Print Screen
      key(0x91, 1.75, 'ScrLk'), // Scroll Lock
      key(0x13, 1.75), // Pause
    ],
    rowClass: 'nav-top',
  },
  {
    keys: [
      key(0x2d, 1.75, 'Insert'), // Insert
      key(0x24, 1.75), // Home
      key(0x21, 1.75, 'PgUp'), // Page Up
    ],
    rowClass: 'nav-middle',
  },
  {
    keys: [
      key(0x2e, 1.75, 'Delete'), // Delete
      key(0x23, 1.75), // End
      key(0x22, 1.75, 'PgDn'), // Page Down
    ],
    rowClass: 'nav-bottom',
  },
  {
    keys: [
      spacer(1.75),
      key(0x26, 1.75, '↑'), // Up
      spacer(1.75),
    ],
    rowClass: 'arrow-top',
  },
  {
    keys: [
      key(0x25, 1.75, '←'), // Left
      key(0x28, 1.75, '↓'), // Down
      key(0x27, 1.75, '→'), // Right
    ],
    rowClass: 'arrow-bottom',
  },
];

/**
 * Numpad cluster
 */
export const NUMPAD_CLUSTER: KeyboardRow[] = [
  {
    keys: [
      key(0x90, 1.25, 'Lock'), // Num Lock
      key(0x6f, 1.25, '/'), // Num /
      key(0x6a, 1.25, '*'), // Num *
      key(0x6d, 1.25, '-'), // Num -
    ],
    rowClass: 'numpad-row1',
  },
  {
    keys: [
      key(0x67, 1.25, '7'), // Num 7
      key(0x68, 1.25, '8'), // Num 8
      key(0x69, 1.25, '9'), // Num 9
      key(0x6b, 1.25, '+', 2), // Num + (spans 2 rows)
    ],
    rowClass: 'numpad-row2',
  },
  {
    keys: [
      key(0x64, 1.25, '4'), // Num 4
      key(0x65, 1.25, '5'), // Num 5
      key(0x66, 1.25, '6'), // Num 6
      // + continues here (row 2 of span)
    ],
    rowClass: 'numpad-row3',
  },
  {
    keys: [
      key(0x61, 1.25, '1'), // Num 1
      key(0x62, 1.25, '2'), // Num 2
      key(0x63, 1.25, '3'), // Num 3
      key(0xfd, 1.25, 'Enter', 2), // Num Enter (spans 2 rows)
    ],
    rowClass: 'numpad-row4',
  },
  {
    keys: [
      key(0x60, 2.5, '0'), // Num 0 (double width)
      key(0x6e, 1.25, '.'), // Num .
      // Enter continues here (row 2 of span)
    ],
    rowClass: 'numpad-row5',
  },
];

/**
 * Additional keys that don't fit in the main layout
 */
export const ADDITIONAL_KEYS_LAYOUT: KeyboardRow[] = [
  {
    keys: [
      key(0xad, 0, 'Mute', undefined, 'VolumeX'), // Mute
      key(0xae, 0, 'Vol Down', undefined, 'Volume1'), // Vol Down
      key(0xaf, 0, 'Vol Up', undefined, 'Volume2'), // Vol Up
      key(0xb1, 0, 'Prev', undefined, 'SkipBack'), // Prev Track
      key(0xb3, 0, 'Play/Pause', undefined, 'Play'), // Play/Pause
      key(0xb0, 0, 'Next', undefined, 'SkipForward'), // Next Track
      key(0xb2, 0, 'Stop', undefined, 'Square'), // Stop
    ],
    rowClass: 'media-row',
  },
  {
    keys: [
      key(0x1001, 0, 'Brightness Up', undefined, 'SunMedium'), // Brightness Up
      key(0x1002, 0, 'Brightness Down', undefined, 'SunDim'), // Brightness Down
    ],
    rowClass: 'brightness-row',
  },
  {
    keys: [
      key(0x5d, 0, 'App'), // App/Menu
      key(0xd9, 0), // Select All (Ctrl+A) - use default label
      key(0xb9, 0), // Copy (Ctrl+C) - use default label
      key(0xb8, 0), // Cut (Ctrl+X) - use default label
      key(0xd8, 0, 'Sleep?'), // Sleep?
      key(0xda, 0, 'Unknown'), // Unknown
    ],
    rowClass: 'special-row',
  },
];
