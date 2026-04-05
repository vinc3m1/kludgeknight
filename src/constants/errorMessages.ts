/**
 * User-facing error messages for Kludge Knight
 * Centralized location for all error messages shown to users
 */

export const ERROR_MESSAGES = {
  // Browser compatibility errors
  WEBHID_NOT_AVAILABLE: 'This browser doesn\'t support WebHID. Please use Chrome, Edge, or Opera on desktop. Mobile browsers and Firefox/Safari are not supported.',

  // Device connection errors
  UNSUPPORTED_KEYBOARD: 'This keyboard model is not supported. Check the device list for compatible models.',
  CONNECTION_FAILED: 'Failed to connect to keyboard. Please try again.',
  DEVICE_OPEN_BLOCKED: 'Could not open this keyboard on macOS. If you have Karabiner-Elements or other HID interceptors running, quit them and restart your browser — they seize exclusive access to keyboard devices.',
  DISCONNECT_FAILED: 'Failed to disconnect from keyboard. The device may already be disconnected.',
  SCAN_FAILED: 'Failed to reconnect to previously authorized keyboards. Please try connecting again.',

  // Key mapping errors
  REMAP_FAILED: 'Failed to update key mapping. Please try again.',
  RESET_KEY_FAILED: 'Failed to reset key to default. Please try again.',
  RESET_ALL_FAILED: 'Failed to reset keys. Please try again.',

  // Lighting errors
  LIGHTING_NOT_SUPPORTED: 'This keyboard does not support lighting controls.',
  RGB_NOT_SUPPORTED: 'This keyboard does not support RGB lighting.',
  LIGHTING_UPDATE_FAILED: 'Failed to update lighting settings',
} as const;
