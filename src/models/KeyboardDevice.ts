import { KeyCode } from '../types/keycode';
import { KeyboardConfig, DeviceSnapshot } from '../types/keyboard';
import { Profile } from './Profile';
import { ProtocolTranslator } from './ProtocolTranslator';
import { OperationQueue } from './OperationQueue';

/**
 * Represents a connected Royal Kludge keyboard
 */
export class KeyboardDevice {
  readonly id: string;
  readonly hidDevice: HIDDevice;
  readonly config: KeyboardConfig;

  connected: boolean = true;
  profiles: Profile[] = [];
  activeProfileIndex: number = -1;
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
   * Add a new profile and activate it
   * Returns promise that resolves when profile is activated
   */
  async addProfile(
    name: string,
    mappings?: Map<number, KeyCode>
  ): Promise<Profile> {
    return this.queue.enqueue(async () => {
      const profile = new Profile(name, (m) => this.translator.sendProfile(m));
      profile.notify = this.notify;

      if (mappings) {
        mappings.forEach((code, index) => {
          profile.mappings.set(index, code);
        });
      }

      this.profiles.push(profile);
      await this.activateProfileInternal(this.profiles.length - 1);
      this.notify?.();
      return profile;
    });
  }

  /**
   * Delete a profile by index
   */
  async deleteProfile(index: number): Promise<void> {
    return this.queue.enqueue(async () => {
      if (index < 0 || index >= this.profiles.length) {
        throw new Error('Invalid profile index');
      }

      this.profiles.splice(index, 1);

      // Adjust active index if needed
      if (this.activeProfileIndex === index) {
        this.activeProfileIndex = -1;
      } else if (this.activeProfileIndex > index) {
        this.activeProfileIndex--;
      }

      this.notify?.();
    });
  }

  /**
   * Activate a profile by index
   * Sends all mappings to keyboard
   */
  async activateProfile(index: number): Promise<void> {
    return this.queue.enqueue(async () => {
      await this.activateProfileInternal(index);
      this.notify?.();
    });
  }

  /**
   * Internal method to activate profile (not queued)
   */
  private async activateProfileInternal(index: number): Promise<void> {
    if (index < 0 || index >= this.profiles.length) {
      throw new Error('Invalid profile index');
    }

    const profile = this.profiles[index];
    await this.translator.sendProfile(profile.mappings);
    this.activeProfileIndex = index;
  }

  /**
   * Get the currently active profile
   */
  getActiveProfile(): Profile | null {
    if (this.activeProfileIndex < 0 || this.activeProfileIndex >= this.profiles.length) {
      return null;
    }
    return this.profiles[this.activeProfileIndex];
  }

  /**
   * Export all profiles to JSON snapshot
   */
  exportSnapshot(exportName: string): string {
    const snapshot: DeviceSnapshot = {
      deviceName: this.config.name,
      exportName,
      exportedAt: new Date().toISOString(),
      profiles: this.profiles.map(p => p.toJSON()),
      activeProfileIndex: this.activeProfileIndex,
    };
    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Import profiles from JSON snapshot
   * Replaces all existing profiles
   */
  async importSnapshot(json: string): Promise<void> {
    return this.queue.enqueue(async () => {
      const snapshot: DeviceSnapshot = JSON.parse(json);

      // Validate device compatibility
      if (snapshot.deviceName !== this.config.name) {
        console.warn(
          `Snapshot is for ${snapshot.deviceName}, but connected device is ${this.config.name}`
        );
      }

      // Clear existing profiles
      this.profiles = [];

      // Import profiles
      snapshot.profiles.forEach(profileData => {
        const profile = Profile.fromJSON(
          profileData,
          (m) => this.translator.sendProfile(m)
        );
        profile.notify = this.notify;
        this.profiles.push(profile);
      });

      // Activate the profile that was active when exported
      if (snapshot.activeProfileIndex >= 0 && snapshot.activeProfileIndex < this.profiles.length) {
        await this.activateProfileInternal(snapshot.activeProfileIndex);
      }

      this.notify?.();
    });
  }
}
