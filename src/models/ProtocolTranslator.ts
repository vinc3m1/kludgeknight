import { KeyCode } from '../types/keycode';
import type { KeyboardConfig } from '../types/keyboard';
import { BufferCodec } from './BufferCodec';

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
   * Encodes mappings into 9 HID buffers and sends sequentially
   */
  async sendProfile(mappings: Map<number, KeyCode>): Promise<void> {
    const buffers = BufferCodec.encode(mappings, this.config);

    // Send all 9 buffers sequentially
    for (let i = 0; i < 9; i++) {
      await this.device.sendReport(0, buffers[i]);
    }
  }
}
