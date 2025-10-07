#!/usr/bin/env python3
"""
Decode RK keyboard USB capture buffers to extract firmware codes

Usage: python3 decode_capture.py <capture_file> [kb_ini_file]

The capture file should contain the 9 HID buffers (65 bytes each) starting with 0a09...
The optional KB.ini file provides key names and bIndex values for mapping.
"""

import sys
from pathlib import Path

def parse_buffers(capture_file):
    """Parse the 9 HID buffers from capture file"""
    with open(capture_file) as f:
        lines = [l.strip().replace(' ', '') for l in f if l.strip()]

    # Find lines starting with 0a09 (the 9 key mapping buffers)
    buffer_lines = [l for l in lines if l.startswith('0a09')]

    if len(buffer_lines) != 9:
        print(f"Warning: Expected 9 buffers, found {len(buffer_lines)}")

    buffers = [bytes.fromhex(line) for line in buffer_lines[:9]]
    return buffers

def reconstruct_data(buffers):
    """Reconstruct full 585-byte data buffer from 9 HID buffers"""
    full_data = bytearray()

    for i, buf in enumerate(buffers):
        if i == 0:
            # Buffer 0: header is 0a 09 01, then either 01 f8 or just f8
            # Check which format
            if buf[3] == 0x01 and buf[4] == 0xf8:
                # Format: 0a 09 01 01 f8 [data...]
                full_data.extend(buf[5:])
            elif buf[3] == 0xf8:
                # Format: 0a 09 01 f8 [data...]
                full_data.extend(buf[4:])
            else:
                print(f"Unknown buffer 0 format: {buf[:5].hex()}")
                full_data.extend(buf[3:])  # Best guess
        else:
            # Buffers 1-8: 0a 09 0X [data...]
            full_data.extend(buf[3:])

    return full_data

def get_firmware_code(data, bindex):
    """Extract 4-byte firmware code for a given bIndex"""
    offset = bindex * 4
    if offset + 4 > len(data):
        return None

    b = data[offset:offset+4]
    # Firmware code is stored as 4-byte little-endian... or is it big-endian?
    # Let's try both and see which makes sense
    return (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]

def parse_kb_ini(kb_ini_file):
    """Parse KB.ini to extract key names and bIndex values"""
    keys = []

    with open(kb_ini_file) as f:
        in_key_section = False
        for line in f:
            line = line.strip()
            if line == '[KEY]':
                in_key_section = True
                continue
            if line.startswith('['):
                in_key_section = False
            if not in_key_section or not line.startswith('K'):
                continue

            # Format: K1=left,top,right,bottom,flags,vkcode,unknown,bIndex
            if '=' not in line:
                continue

            key_name, value = line.split('=', 1)
            parts = value.split(',')
            if len(parts) >= 8:
                vk_code = parts[5].strip()
                bindex = int(parts[7].strip())
                keys.append((key_name, vk_code, bindex))

    return keys

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 decode_capture.py <capture_file> [kb_ini_file]")
        sys.exit(1)

    capture_file = sys.argv[1]
    kb_ini_file = sys.argv[2] if len(sys.argv) > 2 else None

    # Parse buffers
    buffers = parse_buffers(capture_file)
    print(f"Parsed {len(buffers)} buffers")

    # Reconstruct data
    data = reconstruct_data(buffers)
    print(f"Reconstructed {len(data)} bytes of key mapping data\n")

    # If KB.ini provided, map all keys
    if kb_ini_file:
        keys = parse_kb_ini(kb_ini_file)
        print(f"{'Key':<8} {'VK Code':<10} {'bIndex':<8} {'Offset':<8} {'Firmware Code':<12}")
        print("-" * 60)

        for key_name, vk_code, bindex in sorted(keys, key=lambda x: x[2]):
            fw_code = get_firmware_code(data, bindex)
            if fw_code is not None:
                print(f"{key_name:<8} {vk_code:<10} {bindex:<8} {bindex*4:<8} 0x{fw_code:08x}")
    else:
        # No KB.ini, just show some sample keys
        print("Sample firmware codes (use KB.ini file for full mapping):\n")
        for bindex in [0, 1, 2, 3, 4, 5, 10, 20, 50, 53]:
            fw_code = get_firmware_code(data, bindex)
            if fw_code is not None:
                print(f"bIndex {bindex:3} (offset {bindex*4:3}) → 0x{fw_code:08x}")

if __name__ == '__main__':
    main()
