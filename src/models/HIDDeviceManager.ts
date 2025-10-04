import { KeyboardConfig } from '../types/keyboard';
import { KeyboardDevice } from './KeyboardDevice';

/**
 * Singleton manager for HID device lifecycle
 */
export class HIDDeviceManager {
  private static instance: HIDDeviceManager;
  private devices: Map<string, KeyboardDevice> = new Map();
  private configs: Map<string, KeyboardConfig> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): HIDDeviceManager {
    if (!HIDDeviceManager.instance) {
      HIDDeviceManager.instance = new HIDDeviceManager();
    }
    return HIDDeviceManager.instance;
  }

  /**
   * Load keyboard configurations from public/keyboards/
   * Should be called on app initialization
   */
  async loadConfigs(configUrls: string[]): Promise<void> {
    const promises = configUrls.map(async url => {
      try {
        const response = await fetch(url);
        const config: KeyboardConfig = await response.json();
        if (config.enabled && config.keyMapEnabled) {
          this.configs.set(config.pid, config);
        }
      } catch (error) {
        console.error(`Failed to load config from ${url}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Request device from user (shows browser picker)
   * Opens device and creates KeyboardDevice instance
   */
  async requestDevice(): Promise<KeyboardDevice | null> {
    if (!navigator.hid) {
      throw new Error('WebHID API not available. Use Chrome, Edge, or Opera.');
    }

    try {
      // Request device with RK vendor ID
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: 0x258a }],
      });

      if (devices.length === 0) {
        return null;
      }

      const hidDevice = devices[0];
      return await this.openDevice(hidDevice);
    } catch (error) {
      console.error('Failed to request device:', error);
      throw error;
    }
  }

  /**
   * Scan for previously authorized devices
   * Useful for reconnecting on page reload
   */
  async scanAuthorizedDevices(): Promise<KeyboardDevice[]> {
    if (!navigator.hid) {
      throw new Error('WebHID API not available. Use Chrome, Edge, or Opera.');
    }

    try {
      const hidDevices = await navigator.hid.getDevices();
      const keyboards: KeyboardDevice[] = [];

      for (const hidDevice of hidDevices) {
        // Only process RK keyboards (vendor ID 0x258a)
        if (hidDevice.vendorId === 0x258a) {
          const keyboard = await this.openDevice(hidDevice);
          if (keyboard) {
            keyboards.push(keyboard);
          }
        }
      }

      return keyboards;
    } catch (error) {
      console.error('Failed to scan authorized devices:', error);
      return [];
    }
  }

  /**
   * Open a HID device and create KeyboardDevice instance
   */
  private async openDevice(hidDevice: HIDDevice): Promise<KeyboardDevice | null> {
    try {
      // Find config for this device
      const pid = hidDevice.productId.toString(16).padStart(4, '0');
      const config = this.configs.get(pid);

      if (!config) {
        console.warn(`No configuration found for device PID ${pid}`);
        return null;
      }

      // Open device if not already open
      if (!hidDevice.opened) {
        await hidDevice.open();
      }

      // Create KeyboardDevice instance
      const device = new KeyboardDevice(hidDevice, config);
      this.devices.set(device.id, device);

      return device;
    } catch (error) {
      console.error('Failed to open device:', error);
      throw error;
    }
  }

  /**
   * Get device by ID
   */
  getDevice(id: string): KeyboardDevice | undefined {
    return this.devices.get(id);
  }

  /**
   * Get all connected devices
   */
  getAllDevices(): KeyboardDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Remove device from manager (e.g., on disconnect)
   */
  removeDevice(id: string): void {
    this.devices.delete(id);
  }
}
