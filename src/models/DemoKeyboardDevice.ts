import type { KeyboardConfig } from '../types/keyboard';
import type { StandardLightingSettings, PerKeyColors } from './LightingCodec';
import type { FirmwareCode } from '../types/keycode';
import { loadFullProfile, saveProfile } from '../utils/profileStorage';

/**
 * Demo keyboard device that simulates all operations without hardware
 * Used for demo mode to let users explore the UI without a physical keyboard
 */
export class DemoKeyboardDevice {
  readonly id: string;
  readonly hidDevice: HIDDevice; // Mock HIDDevice
  readonly config: KeyboardConfig;
  readonly isDemo: boolean = true;

  connected: boolean = true;
  mappings: Map<number, FirmwareCode> = new Map();

  // Lighting state
  lightingSettings: StandardLightingSettings | null = null;
  perKeyColors: PerKeyColors = {};

  // Loading states
  isMappingLoading: boolean = false;

  notify?: () => void;
  onDisconnect?: () => void;

  constructor(config: KeyboardConfig) {
    this.config = config;

    // Create a mock HIDDevice object
    this.hidDevice = this.createMockHIDDevice(config);

    // Generate demo device ID
    const pid = parseInt(config.pid, 16);
    this.id = `demo-${0x258a}-${pid}-${config.name}`;

    // Load saved profile from localStorage (if any)
    const profile = loadFullProfile(this.id);
    if (profile.mappings) {
      this.mappings = profile.mappings;
    }

    // Initialize lighting - use saved settings or defaults
    if (config.lightEnabled && config.lightingModes.length > 0) {
      if (profile.lightingSettings) {
        // Use saved lighting settings
        this.lightingSettings = profile.lightingSettings;
      } else {
        // Use defaults
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
    }
  }

  /**
   * Create a mock HIDDevice object for demo purposes
   */
  private createMockHIDDevice(config: KeyboardConfig): HIDDevice {
    const pid = parseInt(config.pid, 16);

    // Create a mock object that satisfies the HIDDevice interface
    const mock = {
      vendorId: 0x258a, // Royal Kludge vendor ID
      productId: pid,
      productName: config.name,
      serialNumber: 'DEMO-MODE',
      opened: true,
      collections: [
        {
          usagePage: 0x0001,
          usage: 0x0080,
          type: 0,
          children: [],
        }
      ],
      // Mock methods
      open: async () => {},
      close: async () => {},
      forget: async () => {},
      sendReport: async () => {},
      sendFeatureReport: async () => {},
      receiveFeatureReport: async () => new DataView(new ArrayBuffer(0)),
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      oninputreport: null,
    } as unknown as HIDDevice;

    return mock;
  }

  /**
   * Simulate device disconnect (for demo mode)
   */
  private handleDisconnect() {
    if (!this.connected) return;

    console.log('Demo device disconnect simulated');
    this.connected = false;
    this.onDisconnect?.();
    this.notify?.();
  }

  /**
   * No-op cleanup for demo device
   */
  cleanup(): void {
    // Demo device has no real event listeners to clean up
  }

  /**
   * Simulate setting a key mapping (no hardware write)
   */
  async setMapping(keyIndex: number, fwCode: FirmwareCode): Promise<void> {
    this.isMappingLoading = true;
    this.notify?.();

    // Simulate network delay for realism
    await this.simulateDelay(100);

    try {
      this.mappings.set(keyIndex, fwCode);
      saveProfile(this.id, this.mappings);
    } finally {
      this.isMappingLoading = false;
      this.notify?.();
    }
  }

  /**
   * Simulate clearing a key mapping
   */
  async clearMapping(keyIndex: number): Promise<void> {
    this.isMappingLoading = true;
    this.notify?.();

    await this.simulateDelay(100);

    try {
      this.mappings.delete(keyIndex);
      saveProfile(this.id, this.mappings);
    } finally {
      this.isMappingLoading = false;
      this.notify?.();
    }
  }

  /**
   * Simulate clearing all mappings
   */
  async clearAll(): Promise<void> {
    this.isMappingLoading = true;
    this.notify?.();

    await this.simulateDelay(150);

    try {
      this.mappings.clear();
      saveProfile(this.id, this.mappings);
    } finally {
      this.isMappingLoading = false;
      this.notify?.();
    }
  }

  /**
   * Simulate resetting all mappings to default
   */
  async resetAllMappings(): Promise<void> {
    return this.clearAll();
  }

  /**
   * Get mapping for a key index
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
   * Simulate updating lighting settings (no hardware write)
   */
  async setLighting(settings: StandardLightingSettings): Promise<void> {
    await this.simulateDelay(80);

    // Update local state
    this.lightingSettings = settings;
    // Save lighting to localStorage
    saveProfile(this.id, undefined, settings);
  }

  /**
   * Simulate updating per-key colors (no hardware write)
   */
  async setPerKeyColors(colors: PerKeyColors): Promise<void> {
    await this.simulateDelay(100);
    this.perKeyColors = colors;
  }

  /**
   * Simulate setting color for a single key
   */
  async setKeyColor(bIndex: number, r: number, g: number, b: number): Promise<void> {
    const newColors = {
      ...this.perKeyColors,
      [bIndex]: { r, g, b },
    };
    await this.setPerKeyColors(newColors);
  }

  /**
   * Simulate clearing color for a single key
   */
  async clearKeyColor(bIndex: number): Promise<void> {
    const newColors = { ...this.perKeyColors };
    delete newColors[bIndex];
    await this.setPerKeyColors(newColors);
  }

  /**
   * Helper to simulate async delay for realistic feel
   */
  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
