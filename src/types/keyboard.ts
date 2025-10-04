import { KeyCode } from './keycode';

/**
 * Keyboard configuration loaded from JSON
 */
export interface KeyboardConfig {
  pid: string;
  name: string;
  enabled: boolean;
  keyMapEnabled: boolean;
  top: [number, number];
  bottom: [number, number];
  keys: Key[];
}

/**
 * Individual key configuration
 */
export interface Key {
  bufferIndex: number;
  keyCode: KeyCode;
  topX: number;
  topY: number;
  bottomX: number;
  bottomY: number;
}

/**
 * Profile snapshot for export/import
 */
export interface ProfileSnapshot {
  name: string;
  mappings: Record<number, KeyCode>;
}

/**
 * Device snapshot for export/import
 */
export interface DeviceSnapshot {
  deviceName: string;
  exportName: string;
  exportedAt: string;
  profiles: ProfileSnapshot[];
  activeProfileIndex: number;
}
