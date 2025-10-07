import type { FirmwareCode } from '../types/keycode';
import type { StandardLightingSettings } from '../models/LightingCodec';

const STORAGE_PREFIX = 'kludgeknight_profile_';

export interface DeviceProfile {
  mappings?: Array<[number, FirmwareCode]>;
  lightingSettings?: StandardLightingSettings;
  version?: number;  // For future migration support
}

/**
 * Save device profile (key mappings and lighting) to localStorage
 */
export function saveProfile(
  deviceId: string,
  mappings?: Map<number, FirmwareCode>,
  lightingSettings?: StandardLightingSettings
): void {
  try {
    const key = STORAGE_PREFIX + deviceId;

    // Load existing profile to preserve other settings
    const existing = loadFullProfile(deviceId);

    const profile: DeviceProfile = {
      mappings: mappings ? Array.from(mappings.entries()) : existing.mappings,
      lightingSettings: lightingSettings !== undefined ? lightingSettings : existing.lightingSettings,
      version: 2,  // Version 2 includes lighting
    };

    localStorage.setItem(key, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save profile to localStorage:', error);
  }
}

/**
 * Load key mappings from localStorage for a device (backward compatible)
 */
export function loadProfile(deviceId: string): Map<number, FirmwareCode> | null {
  const { mappings } = loadFullProfile(deviceId);
  return mappings;
}

/**
 * Load complete device profile including lighting settings
 */
export function loadFullProfile(deviceId: string): {
  mappings: Map<number, FirmwareCode> | null;
  lightingSettings: StandardLightingSettings | null;
} {
  try {
    const key = STORAGE_PREFIX + deviceId;
    const json = localStorage.getItem(key);
    if (!json) {
      return { mappings: null, lightingSettings: null };
    }

    const data = JSON.parse(json);

    // Handle legacy format (just array of mappings)
    if (Array.isArray(data)) {
      return {
        mappings: new Map(data as Array<[number, FirmwareCode]>),
        lightingSettings: null,
      };
    }

    // Handle new format with version
    const profile = data as DeviceProfile;
    return {
      mappings: profile.mappings ? new Map(profile.mappings) : null,
      lightingSettings: profile.lightingSettings || null,
    };
  } catch (error) {
    console.error('Failed to load profile from localStorage:', error);
    return { mappings: null, lightingSettings: null };
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
