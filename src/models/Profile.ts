import { KeyCode } from '../types/keycode';
import type { ProfileSnapshot } from '../types/keyboard';
import { OperationQueue } from './OperationQueue';

/**
 * Manages key mappings with queued updates
 */
export class Profile {
  name: string;
  mappings: Map<number, KeyCode> = new Map();
  notify?: () => void;

  private queue = new OperationQueue();
  private sendToHardware?: (mappings: Map<number, KeyCode>) => Promise<void>;

  constructor(
    name: string,
    sendToHardware?: (mappings: Map<number, KeyCode>) => Promise<void>
  ) {
    this.name = name;
    this.sendToHardware = sendToHardware;
  }

  /**
   * Set a key mapping and sync to hardware
   * Promise resolves when HID write completes
   */
  async setMapping(keyIndex: number, keyCode: KeyCode): Promise<void> {
    return this.queue.enqueue(async () => {
      const oldValue = this.mappings.get(keyIndex);
      try {
        this.mappings.set(keyIndex, keyCode);
        if (this.sendToHardware) {
          await this.sendToHardware(this.mappings);
        }
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
      if (oldValue === undefined) return; // Nothing to clear

      try {
        this.mappings.delete(keyIndex);
        if (this.sendToHardware) {
          await this.sendToHardware(this.mappings);
        }
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
        if (this.sendToHardware) {
          await this.sendToHardware(this.mappings);
        }
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
   * Get mapping for a key index (synchronous)
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

  /**
   * Convert to JSON for export
   */
  toJSON(): ProfileSnapshot {
    const mappings: Record<number, KeyCode> = {};
    this.mappings.forEach((value, key) => {
      mappings[key] = value;
    });
    return {
      name: this.name,
      mappings,
    };
  }

  /**
   * Create profile from JSON snapshot
   */
  static fromJSON(
    data: ProfileSnapshot,
    sendToHardware?: (mappings: Map<number, KeyCode>) => Promise<void>
  ): Profile {
    const profile = new Profile(data.name, sendToHardware);
    Object.entries(data.mappings).forEach(([key, value]) => {
      profile.mappings.set(parseInt(key), value);
    });
    return profile;
  }
}
