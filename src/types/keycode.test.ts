import { describe, expect, test } from 'bun:test';
import { parseVK } from './keycode';

describe('parseVK', () => {
  test('uses nonzero firmware fallback from KB.ini placeholder keys', () => {
    const keyInfo = parseVK('0x01', '0x06000100');

    expect(keyInfo).toBeDefined();
    expect(keyInfo?.fw).toBe(0x06000100);
  });

  test('still skips placeholder keys when no firmware fallback exists', () => {
    expect(parseVK('0x01', '0x00')).toBeUndefined();
  });
});
