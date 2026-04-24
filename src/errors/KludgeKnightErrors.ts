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
  readonly pid: string;
  constructor(pid: string) {
    super(`Keyboard with PID ${pid} is not supported`);
    this.name = 'UnsupportedKeyboardError';
    this.pid = pid;
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
 * Thrown when device.open() fails with NotAllowedError.
 * Common cause: another application has exclusive access to the device.
 */
export class DeviceOpenError extends Error {
  readonly pid: string;
  constructor(pid: string) {
    super(`Failed to open device with PID ${pid}`);
    this.name = 'DeviceOpenError';
    this.pid = pid;
  }
}

/**
 * Thrown when attempting lighting operations on a keyboard without lighting support
 */
export class LightingNotSupportedError extends Error {
  readonly keyboardName: string;
  constructor(keyboardName: string) {
    super(`Keyboard ${keyboardName} does not support lighting`);
    this.name = 'LightingNotSupportedError';
    this.keyboardName = keyboardName;
  }
}

/**
 * Thrown when attempting RGB operations on a keyboard without RGB support
 */
export class RGBNotSupportedError extends Error {
  readonly keyboardName: string;
  constructor(keyboardName: string) {
    super(`Keyboard ${keyboardName} does not support RGB lighting`);
    this.name = 'RGBNotSupportedError';
    this.keyboardName = keyboardName;
  }
}
