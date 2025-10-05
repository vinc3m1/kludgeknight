/**
 * Encodes lighting settings into HID buffers for RK keyboards
 * Based on protocol documented in docs/lighting-protocol.md
 */

export interface StandardLightingSettings {
  modeIndex: number;      // 1-21 (mode number from LedOpt#)
  speed: number;          // 1-5 (Very Slow → Very Fast)
  brightness: number;     // 1-5
  color: {                // RGB color (0-255 each)
    r: number;
    g: number;
    b: number;
  };
  randomColor: boolean;   // true = random colors, false = fixed color
  sleep: number;          // 1=5min, 2=10min, 3=20min, 4=30min, 5=off
}

export interface PerKeyColors {
  [bIndex: number]: {     // Key buffer index
    r: number;
    g: number;
    b: number;
  };
}

/**
 * Encodes/decodes lighting protocol for RK keyboards
 */
export class LightingCodec {
  private static readonly COMMAND = 0x0a;
  private static readonly BUFFER_SIZE = 65;

  /**
   * Encode standard lighting mode settings into 1 HID buffer
   */
  static encodeStandardLighting(settings: StandardLightingSettings): Uint8Array {
    const buffer = new Uint8Array(this.BUFFER_SIZE);

    // Header
    buffer[0] = this.COMMAND;
    buffer[1] = 0x01; // Number of buffers
    buffer[2] = 0x01; // Buffer index
    buffer[3] = 0x02; // Sub-command
    buffer[4] = 0x29; // Sub-command parameter

    // Parameters
    buffer[5] = settings.modeIndex; // Mode bit
    buffer[6] = 0x00; // Reserved
    buffer[7] = settings.speed;
    buffer[8] = settings.brightness;

    // Color (only if not random)
    if (!settings.randomColor) {
      buffer[9] = settings.color.r;
      buffer[10] = settings.color.g;
      buffer[11] = settings.color.b;
    }

    buffer[12] = settings.randomColor ? 0x01 : 0x00;
    buffer[13] = settings.sleep;

    // Remaining bytes stay 0x00

    return buffer;
  }

  /**
   * Encode custom per-key RGB colors into 7 HID buffers
   */
  static encodeCustomRGB(keyColors: PerKeyColors): Uint8Array[] {
    const NUM_BUFFERS = 7;
    const buffers: Uint8Array[] = [];

    // Create full color buffer (7 * 65 = 455 bytes total space)
    // Each key gets 3 bytes at position (bIndex * 3)
    const fullBuffer = new Uint8Array(NUM_BUFFERS * this.BUFFER_SIZE);

    // Fill with key colors
    for (const [bIndexStr, color] of Object.entries(keyColors)) {
      const bIndex = parseInt(bIndexStr);
      const offset = bIndex * 3;

      if (offset + 2 < fullBuffer.length) {
        fullBuffer[offset] = color.r;
        fullBuffer[offset + 1] = color.g;
        fullBuffer[offset + 2] = color.b;
      }
    }

    // Split into 7 HID buffers
    let fullBufferIndex = 0;

    for (let i = 0; i < NUM_BUFFERS; i++) {
      const buffer = new Uint8Array(this.BUFFER_SIZE);

      // Set header
      buffer[0] = this.COMMAND;
      buffer[1] = NUM_BUFFERS; // Total number of buffers
      buffer[2] = i + 1; // 1-based buffer index

      // First buffer has extra header bytes
      if (i === 0) {
        buffer[3] = 0x03;
        buffer[4] = 0x7e;
        buffer[5] = 0x01;
      }

      // Copy data from full buffer
      const dataStart = i === 0 ? 6 : 3;
      for (let bufferPos = dataStart; bufferPos < this.BUFFER_SIZE; bufferPos++) {
        buffer[bufferPos] = fullBuffer[fullBufferIndex++];
      }

      buffers.push(buffer);
    }

    return buffers;
  }
}
