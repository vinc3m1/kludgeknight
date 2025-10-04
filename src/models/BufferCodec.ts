import { KeyCode } from '../types/keycode';
import { KeyboardConfig } from '../types/keyboard';

/**
 * Encodes/decodes the 9-buffer protocol for RK keyboards
 * Based on Rangoli's keyboardconfiguratorcontroller.cpp
 *
 * Protocol:
 * - 9 buffers of 65 bytes each
 * - Each key is encoded as 4 bytes (little-endian)
 * - Total mapping space: 9 * 65 = 585 bytes
 * - Data starts at byte 5 in first buffer, byte 3 in others
 */
export class BufferCodec {
  private static readonly COMMAND = 0x0a;
  private static readonly BUFFER_SIZE = 65;
  private static readonly NUM_BUFFERS = 9;
  private static readonly BYTES_PER_KEY = 4;

  /**
   * Encode key mappings into 9 HID buffers for sendReport()
   *
   * @param mappings - Map of key buffer index to key code
   * @param config - Keyboard configuration with default keys
   * @returns Array of 9 buffers (65 bytes each)
   */
  static encode(
    mappings: Map<number, KeyCode>,
    config: KeyboardConfig
  ): Uint8Array[] {
    // Create full mapping buffer (9 * 65 = 585 bytes)
    const fullBuffer = new Uint8Array(this.NUM_BUFFERS * this.BUFFER_SIZE);

    // Fill with default key codes from config
    for (const key of config.keys) {
      const keyCode = mappings.get(key.bufferIndex) ?? key.keyCode;
      this.setBufferKey(fullBuffer, key.bufferIndex * this.BYTES_PER_KEY, keyCode);
    }

    // Split into 9 HID buffers with headers
    const buffers: Uint8Array[] = [];
    let fullBufferIndex = 0;

    for (let i = 0; i < this.NUM_BUFFERS; i++) {
      const buffer = new Uint8Array(this.BUFFER_SIZE);

      // Set header
      buffer[0] = this.COMMAND;
      buffer[1] = this.NUM_BUFFERS;
      buffer[2] = i + 1; // 1-based buffer index

      // First buffer has extra header bytes
      if (i === 0) {
        buffer[3] = 0x01;
        buffer[4] = 0xf8;
      }

      // Copy data from full buffer
      const dataStart = i === 0 ? 5 : 3;
      for (let bufferPos = dataStart; bufferPos < this.BUFFER_SIZE; bufferPos++) {
        buffer[bufferPos] = fullBuffer[fullBufferIndex++];
      }

      buffers.push(buffer);
    }

    return buffers;
  }

  /**
   * Encode a single key code into 4 bytes (little-endian)
   * Based on Rangoli's setBufferKey method
   *
   * @param buffer - Target buffer
   * @param offset - Offset in buffer
   * @param keyCode - Key code to encode
   */
  private static setBufferKey(
    buffer: Uint8Array,
    offset: number,
    keyCode: number
  ): void {
    if (keyCode >= 0x01000000) {
      // 4-byte key code
      buffer[offset] = (keyCode >> 24) & 0xff;
      buffer[offset + 1] = (keyCode >> 16) & 0xff;
      buffer[offset + 2] = (keyCode >> 8) & 0xff;
      buffer[offset + 3] = keyCode & 0xff;
    } else if (keyCode >= 0x010000) {
      // 3-byte key code
      buffer[offset] = 0x00;
      buffer[offset + 1] = (keyCode >> 16) & 0xff;
      buffer[offset + 2] = (keyCode >> 8) & 0xff;
      buffer[offset + 3] = keyCode & 0xff;
    } else if (keyCode >= 0x0100) {
      // 2-byte key code
      buffer[offset] = 0x00;
      buffer[offset + 1] = 0x00;
      buffer[offset + 2] = (keyCode >> 8) & 0xff;
      buffer[offset + 3] = keyCode & 0xff;
    } else {
      // 1-byte key code
      buffer[offset] = 0x00;
      buffer[offset + 1] = 0x00;
      buffer[offset + 2] = 0x00;
      buffer[offset + 3] = keyCode & 0xff;
    }
  }

  /**
   * Decode 9 HID buffers back into key mappings
   * Used for reading current state from keyboard
   *
   * @param buffers - Array of 9 buffers from keyboard
   * @param config - Keyboard configuration
   * @returns Map of key buffer index to key code
   */
  static decode(buffers: Uint8Array[], config: KeyboardConfig): Map<number, KeyCode> {
    const mappings = new Map<number, KeyCode>();

    // Reconstruct full buffer from 9 HID buffers
    const fullBuffer = new Uint8Array(this.NUM_BUFFERS * this.BUFFER_SIZE);
    let fullBufferIndex = 0;

    for (let i = 0; i < buffers.length; i++) {
      const buffer = buffers[i];
      const dataStart = i === 0 ? 5 : 3;

      for (let bufferPos = dataStart; bufferPos < this.BUFFER_SIZE; bufferPos++) {
        fullBuffer[fullBufferIndex++] = buffer[bufferPos];
      }
    }

    // Extract key codes
    for (const key of config.keys) {
      const offset = key.bufferIndex * this.BYTES_PER_KEY;
      const keyCode = this.getBufferKey(fullBuffer, offset);

      // Only store if different from default
      if (keyCode !== key.keyCode) {
        mappings.set(key.bufferIndex, keyCode);
      }
    }

    return mappings;
  }

  /**
   * Decode a 4-byte key code from buffer (little-endian)
   *
   * @param buffer - Source buffer
   * @param offset - Offset in buffer
   * @returns Decoded key code
   */
  private static getBufferKey(buffer: Uint8Array, offset: number): KeyCode {
    return (
      (buffer[offset] << 24) |
      (buffer[offset + 1] << 16) |
      (buffer[offset + 2] << 8) |
      buffer[offset + 3]
    );
  }
}
