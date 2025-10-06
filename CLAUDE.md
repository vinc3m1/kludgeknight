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

# Build for production (includes SSR post-build step)
bun run build

# Preview production build
bun run preview
```

**IMPORTANT: This project uses Bun, not Node.js.** Always use `bun` commands (e.g., `bun install`, `bun run dev`) instead of `npm` or `node`. The dev server supports network access by default and can optionally use HTTPS for testing on other devices.

### Build Process

The build process has two steps:
1. `vite build` - Standard Vite build that bundles the React app
2. `bun scripts/inject-ssr.ts` - Post-build script that injects server-rendered HTML into index.html

**Why separate SSR from Vite config?** Initially SSR was implemented as a Vite plugin, but this caused Vite to track all source files as config dependencies, triggering full server restarts instead of HMR on every file change. Moving SSR to a post-build script fixed this performance issue while maintaining the same SSR output.

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
- Maintains current key mappings in memory (mappings: Map<number, FirmwareCode>)
- Uses OperationQueue to serialize all write operations and prevent concurrent hardware access
- Implements rollback on failure for all mapping operations
- Loads saved mappings from localStorage on construction
- Listens for HID disconnect events and triggers onDisconnect callback

**BufferCodec** (src/models/BufferCodec.ts)
- Ported from Rangoli's keyboardconfiguratorcontroller.cpp (GPL-licensed derivative work)
- Encodes/decodes the 9-buffer protocol used by RK keyboards
- Each key is 4 bytes (little-endian) in a 585-byte space across 9 buffers
- First buffer has special header bytes (0x01, 0xf8) at positions 3-4
- **Always writes ALL key mappings** - even a single key change sends all 9 buffers with full keymap

**ProtocolTranslator** (src/models/ProtocolTranslator.ts)
- Sends encoded buffers to keyboard via WebHID sendFeatureReport()
- Report ID is 0x0a (extracted from buffer[0])
- Sends all 9 key mapping buffers sequentially on every write operation
- Reading profiles from keyboard is not implemented (and likely impossible due to firmware)

**DeviceContext** (src/context/DeviceContext.tsx)
- React context providing device state to components
- Uses forceUpdate mechanism to trigger re-renders when mappings change
- Each device has a notify callback that forces re-render
- Scans for previously authorized devices on mount (maintains connection across page refreshes)
- Handles device disconnects by removing from manager and clearing selection

**profileStorage** (src/utils/profileStorage.ts)
- Saves/loads key mappings to browser localStorage per device
- Device ID includes serial number when available for device-specific profiles
- Mappings auto-save after each change and auto-load on device connect
- Storage key format: `kludgeknight_profile_{deviceId}`

**HomePage** (src/components/HomePage.tsx)
- Landing page that displays all supported keyboards in a searchable list
- Uses lifted state pattern with Set-based tracking for expanded keyboard items
- Fixed-height scrollable container (170px) with dynamic scroll shadows
- Shadows only appear when content is scrollable and based on scroll position
- Each keyboard item can expand to show images (keyimg.png, kbled.png if available)
- Lazily loads keyboard images when user expands an item (not when keyboard connects)
  - Parses KB.ini only to extract image configuration: `useRgbDefault`, `kbImgUse` (image reference)
  - Some keyboards reference another keyboard's images via `kbImgUse` field
  - This is separate from the full KB.ini parsing for key mapping (only happens when device connects)
- Handles case-insensitive directory lookups for keyboard PIDs

### Data Flow

- Keyboard configurations are in `public/rk/` directory:
  - `Cfg.ini`: Maps PIDs to device names (UTF-16 LE encoded)
  - `Dev/{PID}/KB.ini`: Key positions and mappings for each keyboard model (uses VK codes)
- Key mappings use FirmwareCode type (RK-specific firmware codes) defined in src/types/keycode.ts
- VK codes from INI files are translated to firmware codes via vkToFirmwareCode function
- Type aliases: VKCode (Windows Virtual Key codes) and FirmwareCode (RK firmware codes)
- **Firmware code encoding** (discovered via USB capture analysis):
  - Regular keys: USB HID code << 8 (e.g., A key: 0x04 → 0x0400)
  - Left modifiers: Bit flags (Ctrl: 0x010000, Shift: 0x020000, Alt: 0x040000, Win: 0x080000)
  - Right modifiers: Higher flags (Ctrl: 0x100000, Shift: 0x200000, Alt: 0x400000, Win: 0x800000)
  - Fn key: 0xb000
  - These preserve Mac/Windows mode switching behavior in firmware

### Server-Side Rendering (SSR)

The homepage is pre-rendered for SEO purposes:

**SSR Implementation** (scripts/generate-static-home.ts)
- Renders HomePage component to static HTML using React's `renderToString`
- Loads keyboard data from public/rk/Cfg.ini during build
- Generates complete HTML with all 250+ keyboards for search engine indexing

**SSR Injection** (scripts/inject-ssr.ts)
- Post-build script that runs after `vite build`
- Reads dist/index.html and injects pre-rendered HomePage into `<div id="root">`
- Replaces empty root div with full keyboard list HTML

**Client Hydration** (src/main.tsx)
- Uses `hydrateRoot()` when DOM has pre-rendered content (production)
- Falls back to `createRoot()` for dev mode (no SSR during development)
- React reuses existing DOM structure for fast initial render
- No need to pass keyboard data as props since it's already in the DOM

**Important SSR Notes:**
- SSR plugin must NOT be imported in vite.config.ts during development
- Importing SSR-related files in config causes Vite to track all source files as config dependencies
- This breaks HMR performance by triggering full server restarts on every file change
- Solution: Keep SSR generation separate as a post-build step only

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
- **SSR and HMR**: Never import SSR-related files in vite.config.ts to maintain fast HMR performance during development.
