import type { KeyboardConfig } from '../types/keyboard';
import type { StandardLightingSettings, PerKeyColors } from './LightingCodec';
import type { FirmwareCode } from '../types/keycode';

/**
 * Shared shape for real and demo keyboard devices.
 * Both HIDKeyboardDevice and DemoKeyboardDevice implement this so that
 * consumers can hold a single type and stay in lockstep on the public API.
 */
export interface KeyboardDevice {
  readonly id: string;
  readonly hidDevice: HIDDevice;
  readonly config: KeyboardConfig;
  readonly isDemo?: boolean;

  connected: boolean;
  mappings: Map<number, FirmwareCode>;
  lightingSettings: StandardLightingSettings | null;
  perKeyColors: PerKeyColors;
  isMappingLoading: boolean;

  notify?: () => void;
  onDisconnect?: () => void;

  cleanup(): void;

  setMapping(keyIndex: number, fwCode: FirmwareCode): Promise<void>;
  clearMapping(keyIndex: number): Promise<void>;
  clearAll(): Promise<void>;
  getMapping(keyIndex: number): FirmwareCode | undefined;
  hasMapping(keyIndex: number): boolean;

  setLighting(settings: StandardLightingSettings): Promise<void>;
  setPerKeyColors(colors: PerKeyColors): Promise<void>;
  setKeyColor(bIndex: number, r: number, g: number, b: number): Promise<void>;
  clearKeyColor(bIndex: number): Promise<void>;
}
