import type { KeyboardConfig } from '../types/keyboard';
import { ProtocolTranslator } from './ProtocolTranslator';
import { OperationQueue } from './OperationQueue';
import type { StandardLightingSettings, PerKeyColors } from './LightingCodec';
import type { FirmwareCode } from '../types/keycode';
import { loadProfile, saveProfile } from '../utils/profileStorage';

/**
 * Represents a connected Royal Kludge keyboard
 * Stores current key mappings and syncs to hardware
 */
export class KeyboardDevice {
  readonly id: string;
  readonly hidDevice: HIDDevice;
  readonly config: KeyboardConfig;

  connected: boolean = true;
  mappings: Map<number, FirmwareCode> = new Map();

  // Lighting state
  lightingSettings: StandardLightingSettings | null = null;
  perKeyColors: PerKeyColors = {};

  notify?: () => void;
  onDisconnect?: () => void;

  private translator: ProtocolTranslator;
  private queue = new OperationQueue();

  constructor(hidDevice: HIDDevice, config: KeyboardConfig) {
    this.hidDevice = hidDevice;
    this.config = config;
    // Include serial number if available for device-specific profiles
    const serial = hidDevice.serialNumber ? `-${hidDevice.serialNumber}` : '';
    this.id = `${hidDevice.vendorId}-${hidDevice.productId}-${hidDevice.productName}${serial}`;
    this.translator = new ProtocolTranslator(hidDevice, config);

    // Load saved mappings from localStorage (if any)
    const savedMappings = loadProfile(this.id);
    if (savedMappings) {
      this.mappings = savedMappings;
    }

    // Initialize lighting with defaults if keyboard has lighting
    if (config.lightEnabled && config.lightingModes.length > 0) {
      const firstMode = config.lightingModes[0];
      this.lightingSettings = {
        modeIndex: firstMode.index,
        speed: 3, // Normal
        brightness: 5, // Max
        color: { r: 255, g: 255, b: 255 }, // White
        randomColor: false,
        sleep: 2, // 10 min default
      };
    }

    // Listen for disconnect event on navigator.hid (global disconnect events)
    const disconnectHandler = (event: HIDConnectionEvent) => {
      if (event.device === hidDevice) {
        console.log('HID disconnect event fired for', hidDevice.productName);
        this.handleDisconnect();
        navigator.hid.removeEventListener('disconnect', disconnectHandler);
      }
    };
    navigator.hid.addEventListener('disconnect', disconnectHandler);

    // Also listen on the device itself (belt and suspenders)
    hidDevice.addEventListener('disconnect', () => {
      console.log('HID device disconnect event fired for', hidDevice.productName);
      this.handleDisconnect();
    });
  }

  private handleDisconnect() {
    if (!this.connected) return; // Already handled

    console.log('Handling disconnect for device:', this.hidDevice.productName);
    this.connected = false;

    this.onDisconnect?.();
    this.notify?.();
  }

  /**
   * Set a key mapping and sync to hardware
   * @param keyIndex - The keyboard key index (bIndex)
   * @param fwCode - The RK firmware code to map to
   */
  async setMapping(keyIndex: number, fwCode: FirmwareCode): Promise<void> {
    return this.queue.enqueue(async () => {
      const oldValue = this.mappings.get(keyIndex);
      try {
        this.mappings.set(keyIndex, fwCode);
        await this.translator.sendProfile(this.mappings);
        saveProfile(this.id, this.mappings);
        this.notify?.();
      } catch (error) {
        // Rollback on failure
        if (oldValue !== undefined) {
          this.mappings.set(keyIndex, oldValue);
        } else {
          this.mappings.delete(keyIndex);
        }
        this.notify?.();
        throw error;
      }
    });
  }

  /**
   * Clear a single key mapping
   */
  async clearMapping(keyIndex: number): Promise<void> {
    return this.queue.enqueue(async () => {
      const oldValue = this.mappings.get(keyIndex);
      if (oldValue === undefined) return;

      try {
        this.mappings.delete(keyIndex);
        await this.translator.sendProfile(this.mappings);
        saveProfile(this.id, this.mappings);
        this.notify?.();
      } catch (error) {
        // Rollback on failure
        this.mappings.set(keyIndex, oldValue);
        this.notify?.();
        throw error;
      }
    });
  }

  /**
   * Clear all mappings
   */
  async clearAll(): Promise<void> {
    return this.queue.enqueue(async () => {
      const oldMappings = new Map(this.mappings);
      try {
        this.mappings.clear();
        await this.translator.sendProfile(this.mappings);
        saveProfile(this.id, this.mappings);
        this.notify?.();
      } catch (error) {
        // Rollback on failure
        this.mappings = oldMappings;
        this.notify?.();
        throw error;
      }
    });
  }

  /**
   * Get mapping for a key index
   * @returns The RK firmware code mapped to this key, or undefined if no custom mapping
   */
  getMapping(keyIndex: number): FirmwareCode | undefined {
    return this.mappings.get(keyIndex);
  }

  /**
   * Check if a key has a custom mapping
   */
  hasMapping(keyIndex: number): boolean {
    return this.mappings.has(keyIndex);
  }

  /**
   * Update lighting settings and sync to hardware
   */
  async setLighting(settings: StandardLightingSettings): Promise<void> {
    if (!this.config.lightEnabled) {
      throw new Error('Keyboard does not support lighting');
    }

    return this.queue.enqueue(async () => {
      const oldSettings = this.lightingSettings;
      try {
        this.lightingSettings = settings;
        await this.translator.sendStandardLighting(settings);
        this.notify?.();
      } catch (error) {
        // Rollback on failure
        this.lightingSettings = oldSettings;
        this.notify?.();
        throw error;
      }
    });
  }

  /**
   * Update per-key colors for custom RGB mode
   */
  async setPerKeyColors(colors: PerKeyColors): Promise<void> {
    if (!this.config.lightEnabled || !this.config.rgb) {
      throw new Error('Keyboard does not support RGB lighting');
    }

    return this.queue.enqueue(async () => {
      const oldColors = { ...this.perKeyColors };
      try {
        this.perKeyColors = colors;
        await this.translator.sendCustomRGB(colors);
        this.notify?.();
      } catch (error) {
        // Rollback on failure
        this.perKeyColors = oldColors;
        this.notify?.();
        throw error;
      }
    });
  }

  /**
   * Set color for a single key in custom mode
   */
  async setKeyColor(bIndex: number, r: number, g: number, b: number): Promise<void> {
    const newColors = {
      ...this.perKeyColors,
      [bIndex]: { r, g, b },
    };
    await this.setPerKeyColors(newColors);
  }

  /**
   * Clear color for a single key (set to black/off)
   */
  async clearKeyColor(bIndex: number): Promise<void> {
    const newColors = { ...this.perKeyColors };
    delete newColors[bIndex];
    await this.setPerKeyColors(newColors);
  }
}
