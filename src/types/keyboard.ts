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
  image?: string;
}

/**
 * Individual key configuration
 */
export interface Key {
  bIndex: number;
  keyCode: string;
  top: [number, number];
  bottom: [number, number];
}
