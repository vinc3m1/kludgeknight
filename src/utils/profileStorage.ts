import type { FirmwareCode } from '../types/keycode';
import type { StandardLightingSettings } from '../models/LightingCodec';

const STORAGE_PREFIX = 'kludgeknight_profile_';

export interface DeviceProfile {
  mappings?: Array<[number, FirmwareCode]>;
  lightingSettings?: StandardLightingSettings;
  version?: number;  // For future migration support
}

/**
 * Type guard: Check if value is a valid mapping tuple
 */
function isValidMappingTuple(value: unknown): value is [number, FirmwareCode] {
  if (!Array.isArray(value)) return false;
  if (value.length !== 2) return false;
  return typeof value[0] === 'number' && typeof value[1] === 'number';
}

/**
 * Type guard: Check if value is a valid array of mapping tuples
 */
function isValidMappingsArray(value: unknown): value is Array<[number, FirmwareCode]> {
  if (!Array.isArray(value)) return false;
  return value.every(item => isValidMappingTuple(item));
}

/**
 * Type guard: Check if value is valid StandardLightingSettings
 */
function isValidLightingSettings(value: unknown): value is StandardLightingSettings {
  if (!value || typeof value !== 'object') return false;

  const settings = value as Record<string, unknown>;

  // Check required properties
  if (typeof settings.modeIndex !== 'number') return false;
  if (typeof settings.speed !== 'number') return false;
  if (typeof settings.brightness !== 'number') return false;
  if (typeof settings.randomColor !== 'boolean') return false;
  if (typeof settings.sleep !== 'number') return false;

  // Check color object
  if (!settings.color || typeof settings.color !== 'object') return false;
  const color = settings.color as Record<string, unknown>;
  if (typeof color.r !== 'number') return false;
  if (typeof color.g !== 'number') return false;
  if (typeof color.b !== 'number') return false;

  return true;
}

/**
 * Type guard: Check if value is a valid DeviceProfile
 */
function isDeviceProfile(value: unknown): value is DeviceProfile {
  if (!value || typeof value !== 'object') return false;

  const profile = value as Record<string, unknown>;

  // Check optional version field
  if (profile.version !== undefined && typeof profile.version !== 'number') {
    return false;
  }

  // Check optional mappings field
  if (profile.mappings !== undefined) {
    if (!isValidMappingsArray(profile.mappings)) {
      return false;
    }
  }

  // Check optional lightingSettings field
  if (profile.lightingSettings !== undefined) {
    if (!isValidLightingSettings(profile.lightingSettings)) {
      return false;
    }
  }

  return true;
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
      // Validate legacy format
      if (!isValidMappingsArray(data)) {
        console.warn('Invalid legacy profile format, ignoring saved data');
        return { mappings: null, lightingSettings: null };
      }
      return {
        mappings: new Map(data),
        lightingSettings: null,
      };
    }

    // Handle new format with version
    if (!isDeviceProfile(data)) {
      console.warn('Invalid profile format, ignoring saved data');
      return { mappings: null, lightingSettings: null };
    }

    return {
      mappings: data.mappings ? new Map(data.mappings) : null,
      lightingSettings: data.lightingSettings || null,
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
