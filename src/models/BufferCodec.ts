/*
 * Copyright (C) 2024 KludgeKnight Contributors
 * Copyright (C) 2023 Debayan Sutradhar (rnayabed) (debayansutradhar3@gmail.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

import type { KeyboardConfig } from '../types/keyboard';
import type { HIDCode } from '../types/keycode';

/**
 * Encodes/decodes the 9-buffer protocol for RK keyboards
 *
 * Based on Rangoli's keyboardconfiguratorcontroller.cpp
 * (https://github.com/rnayabed/rangoli)
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
   * @param mappings - Map of key buffer index to HID scan code
   * @param config - Keyboard configuration with default keys
   * @returns Array of 9 buffers (65 bytes each)
   */
  static encode(
    mappings: Map<number, HIDCode>,
    config: KeyboardConfig
  ): Uint8Array[] {
    // Create full mapping buffer (9 * 65 = 585 bytes)
    const fullBuffer = new Uint8Array(this.NUM_BUFFERS * this.BUFFER_SIZE);

    // Fill with default key codes from config
    for (const key of config.keys) {
      // Get custom mapping or default HID code from key's VK code
      const defaultHid = key.keyInfo.hid;
      const customKeyCode = mappings.get(key.bIndex);
      const hidCode = customKeyCode !== undefined ? customKeyCode : defaultHid;

      this.setBufferKey(fullBuffer, key.bIndex * this.BYTES_PER_KEY, hidCode);
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

}
