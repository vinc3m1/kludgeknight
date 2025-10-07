import { z } from 'zod';
import type { FirmwareCode } from '../types/keycode';
import type { StandardLightingSettings } from '../models/LightingCodec';

const STORAGE_PREFIX = 'kludgeknight_profile_';

// Zod schemas for validation
const MappingTupleSchema = z.tuple([
  z.number(), // keyIndex
  z.number(), // FirmwareCode
]);

const LightingSettingsSchema = z.object({
  modeIndex: z.number(),
  speed: z.number(),
  brightness: z.number(),
  randomColor: z.boolean(),
  sleep: z.number(),
  color: z.object({
    r: z.number(),
    g: z.number(),
    b: z.number(),
  }),
});

const DeviceProfileSchema = z.object({
  mappings: z.array(MappingTupleSchema).optional(),
  lightingSettings: LightingSettingsSchema.optional(),
  version: z.number().optional(),
});

// Legacy format support - just an array of mappings
const LegacyProfileSchema = z.array(MappingTupleSchema);

// Type inference from schemas
export type DeviceProfile = z.infer<typeof DeviceProfileSchema>;

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

    // Try legacy format first (just array of mappings)
    if (Array.isArray(data)) {
      const legacyResult = LegacyProfileSchema.safeParse(data);
      if (legacyResult.success) {
        return {
          mappings: new Map(legacyResult.data as Array<[number, FirmwareCode]>),
          lightingSettings: null,
        };
      } else {
        console.warn('Invalid legacy profile format:', legacyResult.error.flatten());
        return { mappings: null, lightingSettings: null };
      }
    }

    // Try new format with version
    const result = DeviceProfileSchema.safeParse(data);
    if (result.success) {
      return {
        mappings: result.data.mappings
          ? new Map(result.data.mappings as Array<[number, FirmwareCode]>)
          : null,
        lightingSettings: result.data.lightingSettings as StandardLightingSettings | undefined || null,
      };
    } else {
      console.warn('Invalid profile format:', result.error.flatten());
      return { mappings: null, lightingSettings: null };
    }
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
