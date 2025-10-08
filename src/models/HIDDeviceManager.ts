import type { KeyboardConfig } from '../types/keyboard';
import { KeyboardDevice } from './KeyboardDevice';
import { parseKBIni } from '../utils/kbIniParser';

/**
 * Singleton manager for HID device lifecycle
 */
export class HIDDeviceManager {
  private static instance: HIDDeviceManager;
  private devices: Map<string, KeyboardDevice> = new Map();
  private configs: Map<string, KeyboardConfig> = new Map();
  private opening: Map<string, Promise<KeyboardDevice | null>> = new Map(); // Track devices currently being opened
  private ledManifest: string | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Set the LED manifest (called from DeviceProvider)
   */
  setLedManifest(manifest: string) {
    this.ledManifest = manifest;
  }

  /**
   * Get the LED manifest
   */
  getLedManifest(): string | null {
    return this.ledManifest;
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
   * Get config for a PID, loading it on-demand if needed
   */
  private async getConfig(pid: string): Promise<KeyboardConfig | null> {
    // Check cache first
    if (this.configs.has(pid)) {
      return this.configs.get(pid)!;
    }

    // Load on-demand
    try {
      const config = await parseKBIni(pid, this.ledManifest);
      if (config) {
        this.configs.set(pid, config);
      }
      return config;
    } catch (error) {
      console.error(`Failed to load config for PID ${pid}:`, error);
      return null;
    }
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
      // Request device with RK vendor ID and configuration interface
      // Usage page 0x0001 (Generic Desktop), usage 0x0080 (System Control)
      const devices = await navigator.hid.requestDevice({
        filters: [{
          vendorId: 0x258a,
          usagePage: 0x0001,
          usage: 0x0080
        }],
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
      console.log(`Found ${hidDevices.length} authorized HID devices`);
      const keyboards: KeyboardDevice[] = [];

      for (const hidDevice of hidDevices) {
        // Only process RK keyboards (vendor ID 0x258a) with configuration interface
        // Check for usage page 0x0001 and usage 0x0080 (System Control)
        if (hidDevice.vendorId === 0x258a) {
          const hasConfigInterface = hidDevice.collections.some(
            col => col.usagePage === 0x0001 && col.usage === 0x0080
          );

          if (hasConfigInterface) {
            try {
              console.log(`Attempting to open RK device: ${hidDevice.productName}`);
              const keyboard = await this.openDevice(hidDevice);
              if (keyboard) {
                console.log(`Successfully opened device: ${keyboard.config.name}`);
                keyboards.push(keyboard);
              }
            } catch (error) {
              // Log but continue with other devices
              console.warn(`Failed to open device ${hidDevice.productName}:`, error);
            }
          }
        }
      }

      console.log(`Successfully connected to ${keyboards.length} RK keyboards`);
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
    // Generate device ID early
    const serial = hidDevice.serialNumber ? `-${hidDevice.serialNumber}` : '';
    const deviceId = `${hidDevice.vendorId}-${hidDevice.productId}-${hidDevice.productName}${serial}`;

    // Check if device is already in manager (prevents duplicate opens in React Strict Mode)
    if (this.devices.has(deviceId)) {
      console.log(`Device already in manager: ${hidDevice.productName}`);
      return this.devices.get(deviceId)!;
    }

    // Check if device is currently being opened - await the existing promise
    if (this.opening.has(deviceId)) {
      console.log(`Device is already being opened, awaiting existing promise...`);
      return await this.opening.get(deviceId)!;
    }

    // Create the opening promise
    const openingPromise = this.performOpen(hidDevice);
    this.opening.set(deviceId, openingPromise);

    try {
      const device = await openingPromise;
      return device;
    } finally {
      // Always clean up the opening promise when done (success or failure)
      this.opening.delete(deviceId);
    }
  }

  /**
   * Internal method to perform the actual device opening
   */
  private async performOpen(hidDevice: HIDDevice): Promise<KeyboardDevice | null> {
    try {
      // Load config for this device on-demand
      const pid = hidDevice.productId.toString(16).padStart(4, '0');
      const config = await this.getConfig(pid);

      if (!config) {
        console.warn(`No configuration found for device PID ${pid}`);
        return null;
      }

      // Debug: Log HID collections to understand device structure
      console.log('HID Device collections:', hidDevice.collections);
      console.log('Product name:', hidDevice.productName);

      // Open device if not already open
      if (!hidDevice.opened) {
        console.log(`Opening device (currently closed): ${hidDevice.productName}`);
        await hidDevice.open();
        console.log(`Device opened successfully: ${hidDevice.productName}`);
      } else {
        console.log(`Device already open: ${hidDevice.productName}`);
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
   * Ensures proper cleanup of event listeners
   */
  removeDevice(id: string): void {
    const device = this.devices.get(id);
    if (device) {
      // Clean up event listeners before removing
      device.cleanup();
      this.devices.delete(id);
    }
  }
}
