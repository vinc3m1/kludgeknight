#!/usr/bin/env python3
"""
WebHID Bridge Server for RK SPLIT70 on macOS.

Runs a WebSocket server on localhost:9876 that proxies HID feature report
commands to the keyboard via raw USB control transfers (libusb). This lets
browser-based tools like KludgeKnight and drive.rkgaming.com work on macOS
where the native WebHID API is blocked by the HID Event System.

Requires sudo for USB kernel driver detachment.

Usage:
    sudo /tmp/rk_venv/bin/python3 rk_bridge.py
    # KludgeKnight (this fork) auto-detects the bridge — no userscript needed
"""

import asyncio
import json
import signal
import sys
import base64
import threading

try:
    import usb.core
    import usb.util
except ImportError:
    print("Error: pyusb not installed.")
    print("  /tmp/rk_venv/bin/pip install pyusb websockets")
    sys.exit(1)

try:
    import websockets
    from websockets.asyncio.server import serve
except ImportError:
    print("Error: websockets not installed.")
    print("  /tmp/rk_venv/bin/pip install websockets")
    sys.exit(1)

# ── Device constants ──
VID = 0x258A
PID = 0x00D7
INTF = 1
HOST = "127.0.0.1"
PORT = 9876

# ── HID collections descriptor for the SPLIT70 Interface 1 ──
# This is what Chrome would see if it could open the device.
# Faithfully represents the 5 collections on Interface 1.
COLLECTIONS = [
    {
        "usagePage": 0x0001, "usage": 0x0080,  # System Control
        "type": 1,  # Application
        "children": [],
        "featureReports": [],
        "inputReports": [{"reportId": 0}],
        "outputReports": [],
    },
    {
        "usagePage": 0x000C, "usage": 0x0001,  # Consumer Control
        "type": 1,
        "children": [],
        "featureReports": [],
        "inputReports": [{"reportId": 0}],
        "outputReports": [],
    },
    {
        "usagePage": 0xFF00, "usage": 0x0001,  # Vendor (Report ID 5)
        "type": 1,
        "children": [],
        "featureReports": [{"reportId": 5}],
        "inputReports": [],
        "outputReports": [],
    },
    {
        "usagePage": 0x0001, "usage": 0x0006,  # NKRO Keyboard (Report ID 6)
        "type": 1,
        "children": [],
        "featureReports": [],
        "inputReports": [{"reportId": 6}],
        "outputReports": [],
    },
    {
        "usagePage": 0xFF00, "usage": 0x0001,  # Vendor Config (Report ID 0x0A)
        "type": 1,
        "children": [],
        "featureReports": [{"reportId": 10}],
        "inputReports": [{"reportId": 10}],
        "outputReports": [],
    },
]


class USBBridge:
    """Manages the USB device with claim-on-demand and idle auto-release."""

    def __init__(self):
        self.dev = None
        self._claimed = False
        self._release_timer = None
        self._lock = threading.Lock()
        self.IDLE_RELEASE_SECS = 2.0

    def find_device(self):
        """Check if the device is present (no claim)."""
        dev = usb.core.find(idVendor=VID, idProduct=PID)
        return dev is not None

    def open(self):
        """Find the device. Interface is claimed on-demand."""
        self.dev = usb.core.find(idVendor=VID, idProduct=PID)
        if self.dev is None:
            raise RuntimeError("RK SPLIT70 (258A:00D7) not found")
        print("[bridge] USB device found (keyboard stays usable between operations)")
        return True

    def close(self):
        """Release interface if claimed."""
        with self._lock:
            self._cancel_release_timer()
            self._do_release()
        self.dev = None
        print("[bridge] USB device handle released")

    def _claim(self):
        """Detach kernel driver and claim interface."""
        if self._claimed:
            return
        if self.dev is None:
            raise RuntimeError("Device not open")
        try:
            if self.dev.is_kernel_driver_active(INTF):
                self.dev.detach_kernel_driver(INTF)
        except usb.core.USBError as e:
            raise RuntimeError(f"Failed to detach kernel driver (sudo?): {e}")
        try:
            usb.util.claim_interface(self.dev, INTF)
        except usb.core.USBError as e:
            try:
                self.dev.attach_kernel_driver(INTF)
            except Exception:
                pass
            raise RuntimeError(f"Failed to claim interface: {e}")
        self._claimed = True
        print("[bridge] Interface claimed (keyboard NKRO paused)")

    def _do_release(self):
        """Release interface and reattach kernel driver."""
        if not self._claimed or self.dev is None:
            self._claimed = False
            return
        try:
            usb.util.release_interface(self.dev, INTF)
        except Exception as e:
            print(f"[bridge] Warning: release_interface: {e}")
        try:
            self.dev.attach_kernel_driver(INTF)
        except Exception as e:
            print(f"[bridge] Warning: attach_kernel_driver: {e}")
        self._claimed = False
        print("[bridge] Interface released (keyboard restored)")

    def _recover_from_error(self):
        """Try to recover USB state after a pipe/transfer error."""
        print("[bridge] Attempting USB recovery...")
        # Force-release the claim flag
        self._claimed = False
        try:
            usb.util.release_interface(self.dev, INTF)
        except Exception:
            pass
        # Clear any halt/stall on the device
        try:
            self.dev.clear_halt(0x82)  # EP IN on interface 1
        except Exception:
            pass
        # Reattach kernel driver
        try:
            self.dev.attach_kernel_driver(INTF)
            print("[bridge] Recovery: kernel driver reattached")
        except Exception:
            # Last resort: reset the USB device
            try:
                self.dev.reset()
                print("[bridge] Recovery: USB device reset")
                import time; time.sleep(0.5)
                # Re-find the device after reset
                self.dev = usb.core.find(idVendor=VID, idProduct=PID)
                if self.dev:
                    print("[bridge] Recovery: device re-found after reset")
                else:
                    print("[bridge] Recovery: device lost after reset — replug needed")
            except Exception as e:
                print(f"[bridge] Recovery failed: {e} — replug keyboard")

    def _cancel_release_timer(self):
        if self._release_timer is not None:
            self._release_timer.cancel()
            self._release_timer = None

    def _schedule_release(self):
        """Schedule an auto-release after idle timeout."""
        self._cancel_release_timer()
        self._release_timer = threading.Timer(self.IDLE_RELEASE_SECS, self._idle_release)
        self._release_timer.daemon = True
        self._release_timer.start()

    def _idle_release(self):
        """Called by timer thread after idle period."""
        with self._lock:
            self._do_release()

    # Only allow Report ID 0x0A — the config endpoint.
    # Other report IDs (like 5, 6) cause USB pipe errors that can brick the connection.
    ALLOWED_REPORT_IDS = {0x0A}

    def send_feature_report(self, report_id: int, data: bytes):
        """Send HID SET_REPORT. Only Report ID 0x0A is allowed."""
        if report_id not in self.ALLOWED_REPORT_IDS:
            print(f"[bridge] Blocked SET_REPORT for report ID 0x{report_id:02X} (not 0x0A)")
            return  # Silently succeed — don't crash the web app
        if self.dev is None:
            raise RuntimeError("Device not open")
        with self._lock:
            self._cancel_release_timer()
            self._claim()
            try:
                payload = bytes([report_id]) + data
                self.dev.ctrl_transfer(0x21, 0x09, 0x0300 | report_id, INTF, payload)
            except usb.core.USBError as e:
                print(f"[bridge] USB error in SET_REPORT: {e}")
                self._recover_from_error()
                raise
            self._schedule_release()

    def get_feature_report(self, report_id: int, length: int) -> bytes:
        """Send HID GET_REPORT. Only Report ID 0x0A is allowed."""
        if report_id not in self.ALLOWED_REPORT_IDS:
            print(f"[bridge] Blocked GET_REPORT for report ID 0x{report_id:02X} (not 0x0A)")
            # Return a dummy response so the web app doesn't crash
            return bytes(length)
        if self.dev is None:
            raise RuntimeError("Device not open")
        with self._lock:
            self._cancel_release_timer()
            self._claim()
            try:
                data = self.dev.ctrl_transfer(0xA1, 0x01, 0x0300 | report_id, INTF, length)
            except usb.core.USBError as e:
                print(f"[bridge] USB error in GET_REPORT: {e}")
                self._recover_from_error()
                raise
            self._schedule_release()
            return bytes(data)


bridge = USBBridge()
active_connections = set()


async def handle_client(websocket):
    """Handle a single WebSocket client connection."""
    addr = websocket.remote_address
    print(f"[bridge] Client connected from {addr}")
    active_connections.add(websocket)

    try:
        async for message in websocket:
            try:
                msg = json.loads(message)
                cmd = msg.get("cmd")
                req_id = msg.get("id", 0)

                if cmd == "ping":
                    await websocket.send(json.dumps({
                        "id": req_id, "ok": True,
                        "devicePresent": bridge.find_device(),
                        "deviceOpened": bridge.dev is not None,
                    }))

                elif cmd == "getDeviceInfo":
                    present = bridge.find_device()
                    await websocket.send(json.dumps({
                        "id": req_id, "ok": True,
                        "vendorId": VID,
                        "productId": PID,
                        "productName": "Bluetooth Keyboard",
                        "collections": COLLECTIONS,
                        "present": present,
                        "opened": bridge.dev is not None,
                    }))

                elif cmd == "open":
                    bridge.open()
                    await websocket.send(json.dumps({
                        "id": req_id, "ok": True,
                    }))

                elif cmd == "close":
                    bridge.close()
                    await websocket.send(json.dumps({
                        "id": req_id, "ok": True,
                    }))

                elif cmd == "sendFeatureReport":
                    report_id = msg["reportId"]
                    # Data comes as base64-encoded
                    data = base64.b64decode(msg["data"])
                    bridge.send_feature_report(report_id, data)
                    await websocket.send(json.dumps({
                        "id": req_id, "ok": True,
                    }))

                elif cmd == "getFeatureReport":
                    report_id = msg["reportId"]
                    length = msg.get("length", 65)
                    data = bridge.get_feature_report(report_id, length)
                    await websocket.send(json.dumps({
                        "id": req_id, "ok": True,
                        "data": base64.b64encode(data).decode(),
                    }))

                else:
                    await websocket.send(json.dumps({
                        "id": req_id, "ok": False,
                        "error": f"Unknown command: {cmd}",
                    }))

            except Exception as e:
                error_msg = str(e)
                print(f"[bridge] Error handling message: {error_msg}")
                try:
                    await websocket.send(json.dumps({
                        "id": msg.get("id", 0) if isinstance(msg, dict) else 0,
                        "ok": False,
                        "error": error_msg,
                    }))
                except Exception:
                    pass

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        active_connections.discard(websocket)
        print(f"[bridge] Client disconnected from {addr}")


async def main():
    print(f"""
╔══════════════════════════════════════════════════╗
║  RK SPLIT70 WebHID Bridge Server                ║
║  Listening on ws://{HOST}:{PORT}                 ║
╠══════════════════════════════════════════════════╣
║  1. Open KludgeKnight (auto-detects the bridge) ║
║  2. Click "Connect Keyboard" and pick your       ║
║     keyboard — it will use the bridge            ║
╠══════════════════════════════════════════════════╣
║  Press Ctrl+C to stop                            ║
╚══════════════════════════════════════════════════╝
""")

    # Check device presence at startup
    if bridge.find_device():
        print("[bridge] ✓ RK SPLIT70 detected on USB")
    else:
        print("[bridge] ✗ RK SPLIT70 not found — plug it in via USB")

    stop = asyncio.get_event_loop().create_future()

    def on_signal():
        print("\n[bridge] Shutting down...")
        bridge.close()
        stop.set_result(None)

    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, on_signal)

    async with serve(handle_client, HOST, PORT):
        print(f"[bridge] Server running on ws://{HOST}:{PORT}")
        await stop


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        bridge.close()
