import { KeyCode } from '../types/keycode';
import type { KeyboardConfig } from '../types/keyboard';
import { ProtocolTranslator } from './ProtocolTranslator';
import { OperationQueue } from './OperationQueue';

/**
 * Represents a connected Royal Kludge keyboard
 * Stores current key mappings and syncs to hardware
 */
export class KeyboardDevice {
  readonly id: string;
  readonly hidDevice: HIDDevice;
  readonly config: KeyboardConfig;

  connected: boolean = true;
  mappings: Map<number, KeyCode> = new Map();
  notify?: () => void;

  private translator: ProtocolTranslator;
  private queue = new OperationQueue();

  constructor(hidDevice: HIDDevice, config: KeyboardConfig) {
    this.hidDevice = hidDevice;
    this.config = config;
    this.id = `${hidDevice.vendorId}-${hidDevice.productId}-${hidDevice.productName}`;
    this.translator = new ProtocolTranslator(hidDevice, config);

    // Listen for disconnect
    hidDevice.addEventListener('disconnect', () => {
      this.connected = false;
      this.notify?.();
    });
  }

  /**
   * Set a key mapping and sync to hardware
   */
  async setMapping(keyIndex: number, keyCode: KeyCode): Promise<void> {
    return this.queue.enqueue(async () => {
      const oldValue = this.mappings.get(keyIndex);
      try {
        this.mappings.set(keyIndex, keyCode);
        await this.translator.sendProfile(this.mappings);
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
   */
  getMapping(keyIndex: number): KeyCode | undefined {
    return this.mappings.get(keyIndex);
  }

  /**
   * Check if a key has a custom mapping
   */
  hasMapping(keyIndex: number): boolean {
    return this.mappings.has(keyIndex);
  }
}
