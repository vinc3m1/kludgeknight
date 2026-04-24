/**
 * Augments the standard WebHID types with non-standard properties
 * that Chromium (and other WebHID implementations) expose in practice.
 */

declare global {
  interface HIDDevice {
    readonly serialNumber?: string;
  }
}

export {};
