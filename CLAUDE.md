# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KludgeKnight is a web-based key remapper for Royal Kludge keyboards that runs entirely in the browser using the WebHID API. It allows users to remap keys on their RK keyboards without installing software. The key mappings and keyboard configurations are sourced from the official Royal Kludge Windows software.

**Important**: This project can only write key mappings to keyboards, not read existing mappings due to firmware limitations.

## Development Commands

```bash
# Install dependencies
bun install

# Start development server (runs on localhost:5173 with network access)
bun run dev

# Lint code
bun run lint

# Build for production
bun run build

# Preview production build
bun run preview
```

Note: Development uses Bun as the package manager and runtime. The dev server supports network access by default and can optionally use HTTPS for testing on other devices.

## Architecture

### Core Architecture Flow

1. **Device Connection**: User clicks "Connect Keyboard" → WebHID API shows browser picker → HIDDeviceManager opens the device and loads its configuration from public/rk/Dev/{PID} files
2. **Key Configuration Loading**: Keyboard configs are lazily loaded on-demand from INI files when a device connects, parsed by kbIniParser
3. **Key Mapping**: User clicks a key on visual keyboard → selects new mapping → KeyboardDevice updates internal state and syncs to hardware via BufferCodec + ProtocolTranslator
4. **Hardware Sync**: Mappings are encoded into 9 HID buffers (65 bytes each) and sent sequentially via feature reports

### Key Components

**HIDDeviceManager** (src/models/HIDDeviceManager.ts)
- Singleton that manages device lifecycle
- Requests devices with vendor ID 0x258a (Royal Kludge) and specific HID usage page/usage for configuration interface
- Lazily loads keyboard configs on-demand (no preloading)
- Scans for previously authorized devices on page load

**KeyboardDevice** (src/models/KeyboardDevice.ts)
- Represents a connected keyboard
- Maintains current key mappings in memory (mappings: Map<number, KeyCode>)
- Uses OperationQueue to serialize all write operations and prevent concurrent hardware access
- Implements rollback on failure for all mapping operations

**BufferCodec** (src/models/BufferCodec.ts)
- Ported from Rangoli's keyboardconfiguratorcontroller.cpp (GPL-licensed derivative work)
- Encodes/decodes the 9-buffer protocol used by RK keyboards
- Each key is 4 bytes (little-endian) in a 585-byte space across 9 buffers
- First buffer has special header bytes (0x01, 0xf8) at positions 3-4

**ProtocolTranslator** (src/models/ProtocolTranslator.ts)
- Sends encoded buffers to keyboard via WebHID sendFeatureReport()
- Report ID is 0x0a (extracted from buffer[0])
- Reading profiles from keyboard is not implemented (and likely impossible due to firmware)

**DeviceContext** (src/context/DeviceContext.tsx)
- React context providing device state to components
- Uses forceUpdate mechanism to trigger re-renders when mappings change
- Each device has a notify callback that forces re-render

### Data Flow

- Keyboard configurations are in `public/rk/` directory:
  - `Cfg.ini`: Maps PIDs to device names (UTF-16 LE encoded)
  - `Dev/{PID}/KB.ini`: Key positions and mappings for each keyboard model
- Key mappings use KeyCode type (HID scan codes) defined in src/types/keycode.ts
- VK codes from official RK software are translated to HID codes via vkToHid map

### WebHID Specifics

- Only works in Chrome, Edge, Opera (WebHID support required)
- Connection filters target usagePage: 0x0001 (Generic Desktop), usage: 0x0080 (System Control)
- Feature reports are used to write key mappings (not input/output reports)
- Devices must be connected via USB (Bluetooth mode not supported)

## Important Notes

- **No reading from keyboard**: The app cannot read existing mappings from the keyboard, only write new ones. Always assumes default layout at startup.
- **Derivative work**: BufferCodec.ts contains code ported from Rangoli project - maintain GPL license and attribution.
- **Tested hardware**: Only tested on RK F68, though configs exist for 250+ RK keyboard models.
- **Browser compatibility**: Requires WebHID API - Chrome/Edge/Opera only, no Firefox/Safari support.
