import { KeyCode } from '../types/keycode';
import { KeyboardConfig } from '../types/keyboard';

/**
 * Encodes/decodes the 9-buffer protocol for RK keyboards
 *
 * Buffer format (65 bytes each):
 * [0]:    0x00      Report ID
 * [1]:    0x0B      Command (Key mapping)
 * [2]:    0-8       Buffer index
 * [3-64]: Mapping data (varies by keyboard)
 *
 * TODO: Port encoding logic from Rangoli's keyboardconfiguratorcontroller.cpp
 */
export class BufferCodec {
  private static readonly REPORT_ID = 0x00;
  private static readonly COMMAND_KEY_MAPPING = 0x0b;
  private static readonly BUFFER_SIZE = 65;
  private static readonly NUM_BUFFERS = 9;

  /**
   * Encode key mappings into 9 HID buffers
   *
   * @param mappings - Map of key index to key code
   * @param config - Keyboard configuration
   * @returns Array of 9 buffers (65 bytes each)
   */
  static encode(
    mappings: Map<number, KeyCode>,
    config: KeyboardConfig
  ): Uint8Array[] {
    const buffers: Uint8Array[] = [];

    for (let i = 0; i < this.NUM_BUFFERS; i++) {
      const buffer = new Uint8Array(this.BUFFER_SIZE);
      buffer[0] = this.REPORT_ID;
      buffer[1] = this.COMMAND_KEY_MAPPING;
      buffer[2] = i; // Buffer index

      // TODO: Port the actual encoding logic from Rangoli
      // For now, this is a stub implementation
      // The actual logic needs to:
      // 1. Map key indices to buffer positions based on config.keys
      // 2. Fill in the key codes for each position
      // 3. Handle default mappings from config
      this.encodeBuffer(buffer, i, mappings, config);

      buffers.push(buffer);
    }

    return buffers;
  }

  /**
   * Decode 9 HID buffers back into key mappings
   *
   * @param buffers - Array of 9 buffers from keyboard
   * @returns Map of key index to key code
   */
  static decode(buffers: Uint8Array[]): Map<number, KeyCode> {
    const mappings = new Map<number, KeyCode>();

    // TODO: Port the actual decoding logic from Rangoli
    // This will be needed to read current state from keyboard

    return mappings;
  }

  /**
   * Encode a single buffer
   * TODO: Implement actual encoding based on Rangoli protocol
   */
  private static encodeBuffer(
    buffer: Uint8Array,
    bufferIndex: number,
    mappings: Map<number, KeyCode>,
    config: KeyboardConfig
  ): void {
    // Stub implementation
    // The actual implementation needs to:
    // 1. Find all keys that belong to this buffer (based on key.bufferIndex)
    // 2. For each key position in this buffer, write the mapped keycode
    // 3. Use default keycode from config if no mapping exists

    config.keys
      .filter(key => Math.floor(key.bufferIndex / 7) === bufferIndex)
      .forEach(key => {
        const mappedCode = mappings.get(key.bufferIndex) ?? key.keyCode;
        const positionInBuffer = 3 + (key.bufferIndex % 7);
        buffer[positionInBuffer] = mappedCode;
      });
  }
}
