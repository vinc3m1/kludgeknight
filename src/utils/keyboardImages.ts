/**
 * Shared utilities for keyboard image path resolution
 * Used by both browser code and Node.js scripts
 */

import ini from 'ini';

export interface KeyboardImageInfo {
  dirCase: string;
  useRgbDefault: boolean;
  hasKbImgUse: boolean;
  kbImgUseRef?: string;
}

/**
 * Decode KB.ini content, handling both UTF-8 and UTF-16 LE encodings
 */
export function decodeKBIni(buffer: ArrayBuffer | Buffer): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;

  // Check if it's UTF-16 LE (starts with FF FE BOM or has null bytes in typical ASCII positions)
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
    // Has UTF-16 LE BOM
    const decoder = new TextDecoder('utf-16le');
    return decoder.decode(buffer);
  } else if (bytes[1] === 0x00 || bytes[3] === 0x00) {
    // Likely UTF-16 LE without BOM (every other byte is null for ASCII)
    const decoder = new TextDecoder('utf-16le');
    return decoder.decode(buffer);
  } else {
    // Assume UTF-8
    if (buffer instanceof ArrayBuffer) {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    } else {
      return buffer.toString('utf-8');
    }
  }
}

/**
 * Parse KB.ini and extract image configuration
 */
export function parseKBIniForImages(kbIniText: string): {
  useRgbDefault: boolean;
  kbImgUse?: string;
} {
  const parsed = ini.parse(kbIniText);
  const kbImgUse = parsed.OPT?.KbImgUse;
  const useLEDImg = parsed.OPT?.KeyUseLEDImg === '1';

  return {
    useRgbDefault: useLEDImg,
    kbImgUse: kbImgUse ? kbImgUse.replace('0x', '').toLowerCase() : undefined
  };
}

/**
 * Get the directory case for a PID (tries both uppercase and lowercase)
 * This is an async function that needs to be implemented differently in browser vs Node
 */
export type GetDirCaseFn = (pid: string) => Promise<string | null>;

/**
 * Get keyboard image information by resolving KB.ini references
 *
 * @param pid - The keyboard PID
 * @param fetchKBIni - Function to fetch KB.ini content for a given PID
 * @returns Image configuration info
 */
export async function getKeyboardImageInfo(
  pid: string,
  fetchKBIni: (pid: string) => Promise<{ text: string; dirCase: string } | null>
): Promise<KeyboardImageInfo | null> {
  try {
    // Try to fetch KB.ini
    const kbIni = await fetchKBIni(pid);
    let dirCase: string;
    let useRgbDefault = false;
    let kbImgUseRef: string | undefined;

    if (kbIni) {
      const { useRgbDefault: useLed, kbImgUse } = parseKBIniForImages(kbIni.text);
      useRgbDefault = useLed;
      kbImgUseRef = kbImgUse;

      if (kbImgUse) {
        // Use the referenced keyboard's image
        const refKbIni = await fetchKBIni(kbImgUse);
        dirCase = refKbIni?.dirCase || kbImgUse.toUpperCase();
      } else {
        // Use this keyboard's own image
        dirCase = kbIni.dirCase;
      }
    } else {
      // No KB.ini, try uppercase as fallback
      dirCase = pid.toUpperCase();
    }

    return {
      dirCase,
      useRgbDefault,
      hasKbImgUse: !!kbImgUseRef,
      kbImgUseRef
    };
  } catch (error) {
    console.error(`Failed to get keyboard image info for ${pid}:`, error);
    return null;
  }
}

