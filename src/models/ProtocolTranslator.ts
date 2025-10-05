import { KeyCode } from '../types/keycode';
import type { KeyboardConfig } from '../types/keyboard';
import { BufferCodec } from './BufferCodec';
import { LightingCodec, type StandardLightingSettings, type PerKeyColors } from './LightingCodec';

/**
 * Translates profile mappings to HID buffers and sends to keyboard
 */
export class ProtocolTranslator {
  constructor(
    private device: HIDDevice,
    private config: KeyboardConfig
  ) {}

  /**
   * Send profile mappings to keyboard hardware
   * Encodes mappings into 9 HID buffers and sends sequentially via feature reports
   */
  async sendProfile(mappings: Map<number, KeyCode>): Promise<void> {
    const buffers = BufferCodec.encode(mappings, this.config);

    // Send all 9 buffers sequentially using feature reports
    // The report ID (0x0a) is in buffer[0], we need to extract it and pass the rest
    for (let i = 0; i < 9; i++) {
      const reportId = buffers[i][0];
      const data = buffers[i].slice(1); // Data without report ID
      await this.device.sendFeatureReport(reportId, data);
    }
  }

  /**
   * Read current profile mappings from keyboard hardware
   * Reads 9 HID buffers and decodes them
   */
  async readProfile(): Promise<Map<number, KeyCode>> {
    const buffers: Uint8Array[] = [];

    // Read all 9 buffers sequentially
    // Note: WebHID doesn't have a direct "read report" for output reports
    // This is a limitation - we may need to use input reports or feature reports
    // For now, this is a placeholder that would need the keyboard to support
    // reading back the configuration via input/feature reports

    // TODO: Implement actual reading from keyboard
    // This requires understanding how RK keyboards expose their current config
    // Likely via feature reports or input reports

    return new Map();
  }

  /**
   * Send standard lighting mode settings to keyboard
   * Encodes settings into 1 HID buffer and sends via feature report
   */
  async sendStandardLighting(settings: StandardLightingSettings): Promise<void> {
    const buffer = LightingCodec.encodeStandardLighting(settings);

    const reportId = buffer[0];
    const data = buffer.slice(1); // Data without report ID
    await this.device.sendFeatureReport(reportId, data);
  }

  /**
   * Send custom per-key RGB colors to keyboard
   * Encodes colors into 7 HID buffers and sends sequentially via feature reports
   */
  async sendCustomRGB(colors: PerKeyColors): Promise<void> {
    const buffers = LightingCodec.encodeCustomRGB(colors);

    // Send all 7 buffers sequentially using feature reports
    for (let i = 0; i < buffers.length; i++) {
      const reportId = buffers[i][0];
      const data = buffers[i].slice(1); // Data without report ID
      await this.device.sendFeatureReport(reportId, data);
    }
  }
}
