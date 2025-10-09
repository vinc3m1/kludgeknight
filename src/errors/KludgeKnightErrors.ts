/**
 * Custom error types for Kludge Knight
 * These errors provide type-safe error handling and separation of concerns
 * between model layer (throws) and UI layer (catches and displays messages)
 */

/**
 * Thrown when WebHID API is not available (unsupported browser)
 */
export class WebHIDNotAvailableError extends Error {
  constructor() {
    super('WebHID API not available');
    this.name = 'WebHIDNotAvailableError';
  }
}

/**
 * Thrown when a keyboard model is not supported (no configuration found)
 */
export class UnsupportedKeyboardError extends Error {
  constructor(public readonly pid: string) {
    super(`Keyboard with PID ${pid} is not supported`);
    this.name = 'UnsupportedKeyboardError';
  }
}

/**
 * Thrown when user cancels the browser device picker
 * This should be caught and handled silently (no error toast)
 */
export class UserCancelledError extends Error {
  constructor() {
    super('User cancelled device selection');
    this.name = 'UserCancelledError';
  }
}

/**
 * Thrown when attempting lighting operations on a keyboard without lighting support
 */
export class LightingNotSupportedError extends Error {
  constructor(public readonly keyboardName: string) {
    super(`Keyboard ${keyboardName} does not support lighting`);
    this.name = 'LightingNotSupportedError';
  }
}

/**
 * Thrown when attempting RGB operations on a keyboard without RGB support
 */
export class RGBNotSupportedError extends Error {
  constructor(public readonly keyboardName: string) {
    super(`Keyboard ${keyboardName} does not support RGB lighting`);
    this.name = 'RGBNotSupportedError';
  }
}
