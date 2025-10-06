import type { KeyboardConfig } from '../types/keyboard';
import { BufferCodec } from './BufferCodec';
import { LightingCodec, type StandardLightingSettings, type PerKeyColors } from './LightingCodec';
import type { FirmwareCode } from '../types/keycode';

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
   * @param mappings - Map of key index to RK firmware code
   */
  async sendProfile(mappings: Map<number, FirmwareCode>): Promise<void> {
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
