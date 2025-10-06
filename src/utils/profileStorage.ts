import type { FirmwareCode } from '../types/keycode';

const STORAGE_PREFIX = 'kludgeknight_profile_';

/**
 * Save key mappings to localStorage for a device
 */
export function saveProfile(deviceId: string, mappings: Map<number, FirmwareCode>): void {
  try {
    const key = STORAGE_PREFIX + deviceId;
    const data = Array.from(mappings.entries());
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save profile to localStorage:', error);
  }
}

/**
 * Load key mappings from localStorage for a device
 */
export function loadProfile(deviceId: string): Map<number, FirmwareCode> | null {
  try {
    const key = STORAGE_PREFIX + deviceId;
    const json = localStorage.getItem(key);
    if (!json) {
      return null;
    }
    const data = JSON.parse(json) as Array<[number, FirmwareCode]>;
    return new Map(data);
  } catch (error) {
    console.error('Failed to load profile from localStorage:', error);
    return null;
  }
}

/**
 * Clear saved profile for a device
 */
export function clearProfile(deviceId: string): void {
  try {
    const key = STORAGE_PREFIX + deviceId;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear profile from localStorage:', error);
  }
}
