# RK Bridge Server — macOS Workaround

A lightweight WebSocket server that proxies HID feature report commands to RK keyboards via raw USB control transfers (libusb). This lets KludgeKnight work on macOS for keyboards whose USB interface combines NKRO and config endpoints — which the kernel normally locks.

## Affected Keyboards

- **RK SPLIT70** (PID 0x00D7)
- **RK A70** (PID 0x020F)
- Any RK keyboard whose Interface 1 has Usage Page 0x01 / Usage 0x06 (NKRO Keyboard) alongside the vendor config collections

## How It Works

1. The bridge server runs locally with `sudo` and uses libusb to detach the macOS kernel driver
2. When KludgeKnight's `device.open()` fails, it automatically checks for the bridge at `ws://127.0.0.1:9876`
3. If the bridge is available, all HID communication is transparently proxied through WebSocket
4. The keyboard remains functional between config operations (claim-on-demand with 2s idle auto-release)

**No userscript or browser extension required** — the fallback is built into this fork of KludgeKnight.

## Setup

### 1. Create a Python venv with dependencies

```bash
python3 -m venv /tmp/rk_venv
/tmp/rk_venv/bin/pip install pyusb websockets
```

### 2. Start the bridge server (requires sudo for USB access)

```bash
sudo /tmp/rk_venv/bin/python3 bridge/rk_bridge.py
```

You should see:
```
╔══════════════════════════════════════════════════╗
║  RK SPLIT70 WebHID Bridge Server                ║
║  Listening on ws://127.0.0.1:9876               ║
╚══════════════════════════════════════════════════╝
[bridge] ✓ RK SPLIT70 detected on USB
```

### 3. Open KludgeKnight and connect

1. Go to the KludgeKnight site (or `localhost:5173` for local dev)
2. Click **Connect Keyboard**
3. Select your keyboard from the browser picker
4. KludgeKnight will detect the open failure and seamlessly use the bridge

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Bridge server not running" toast | Start `rk_bridge.py` with `sudo` |
| "RK SPLIT70 not found on USB" | Keyboard must be connected via USB (not Bluetooth) |
| "Failed to detach kernel driver" | Run with `sudo` — root is required to detach IOKit drivers |
| Bridge connects but operations fail | Try unplugging and re-plugging the keyboard, then restart the bridge |

## Files

- `rk_bridge.py` — The WebSocket server (~260 lines Python). Proxies `sendFeatureReport` / `receiveFeatureReport` via USB control transfers.
- `rk_bridge_userscript.js` — Standalone Tampermonkey userscript (for use with the **upstream** KludgeKnight, where the bridge fallback isn't built-in).
