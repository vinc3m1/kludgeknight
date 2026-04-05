// ==UserScript==
// @name         RK SPLIT70 WebHID Bridge
// @namespace    https://github.com/copilot-workspace/rk-split70
// @version      1.0
// @description  Patches WebHID API to proxy through a local bridge server, enabling KludgeKnight and RK Web App on macOS for the SPLIT70 keyboard
// @author       Copilot
// @match        https://www.kludgeknight.com/*
// @match        https://kludgeknight.com/*
// @match        https://drive.rkgaming.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  const BRIDGE_URL = "ws://127.0.0.1:9876";
  const VID = 0x258a;
  const PID = 0x00d7;

  // HID collections matching the SPLIT70 Interface 1 descriptor
  const COLLECTIONS = [
    {
      usagePage: 0x0001, usage: 0x0080, type: 1, children: [],
      featureReports: [], inputReports: [{ reportId: 0 }], outputReports: [],
    },
    {
      usagePage: 0x000c, usage: 0x0001, type: 1, children: [],
      featureReports: [], inputReports: [{ reportId: 0 }], outputReports: [],
    },
    {
      usagePage: 0xff00, usage: 0x0001, type: 1, children: [],
      featureReports: [{ reportId: 5 }], inputReports: [], outputReports: [],
    },
    {
      usagePage: 0x0001, usage: 0x0006, type: 1, children: [],
      featureReports: [], inputReports: [{ reportId: 6 }], outputReports: [],
    },
    {
      usagePage: 0xff00, usage: 0x0001, type: 1, children: [],
      featureReports: [{ reportId: 10 }], inputReports: [{ reportId: 10 }], outputReports: [],
    },
  ];

  let ws = null;
  let reqCounter = 0;
  const pendingRequests = new Map();

  function connectBridge() {
    return new Promise((resolve, reject) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        resolve(ws);
        return;
      }
      const socket = new WebSocket(BRIDGE_URL);
      socket.onopen = () => {
        console.log("[RK Bridge] Connected to bridge server");
        ws = socket;
        resolve(socket);
      };
      socket.onerror = (e) => {
        console.error("[RK Bridge] Connection failed — is rk_bridge.py running with sudo?");
        reject(new DOMException("Bridge server not running. Start it with: sudo /tmp/rk_venv/bin/python3 rk_bridge.py", "NetworkError"));
      };
      socket.onclose = () => {
        console.log("[RK Bridge] Disconnected from bridge server");
        ws = null;
      };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const pending = pendingRequests.get(msg.id);
          if (pending) {
            pendingRequests.delete(msg.id);
            if (msg.ok) {
              pending.resolve(msg);
            } else {
              pending.reject(new DOMException(msg.error || "Bridge error", "NotAllowedError"));
            }
          }
        } catch (e) {
          console.error("[RK Bridge] Bad message:", e);
        }
      };
    });
  }

  function sendCommand(cmd, params = {}) {
    return new Promise((resolve, reject) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new DOMException("Bridge not connected", "NetworkError"));
        return;
      }
      const id = ++reqCounter;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, cmd, ...params }));
      // Timeout after 10 seconds
      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          reject(new DOMException("Bridge timeout", "TimeoutError"));
        }
      }, 10000);
    });
  }

  // Base64 encode/decode helpers
  function uint8ToBase64(uint8) {
    let binary = "";
    for (let i = 0; i < uint8.length; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return btoa(binary);
  }

  function base64ToArrayBuffer(b64) {
    const binary = atob(b64);
    const buf = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < binary.length; i++) {
      view[i] = binary.charCodeAt(i);
    }
    return buf;
  }

  // Create a fake HIDDevice that proxies through the bridge
  function createBridgedDevice() {
    const listeners = {};

    const device = {
      vendorId: VID,
      productId: PID,
      productName: "Bluetooth Keyboard",
      serialNumber: "",
      opened: false,
      collections: COLLECTIONS,

      addEventListener(type, fn) {
        if (!listeners[type]) listeners[type] = [];
        listeners[type].push(fn);
      },

      removeEventListener(type, fn) {
        if (listeners[type]) {
          listeners[type] = listeners[type].filter((f) => f !== fn);
        }
      },

      dispatchEvent(event) {
        const fns = listeners[event.type] || [];
        for (const fn of fns) fn(event);
      },

      async open() {
        console.log("[RK Bridge] Opening device via bridge...");
        await connectBridge();
        await sendCommand("open");
        device.opened = true;
        console.log("[RK Bridge] Device opened successfully");
      },

      async close() {
        console.log("[RK Bridge] Closing device via bridge...");
        try {
          await sendCommand("close");
        } catch (e) {
          // Ignore close errors
        }
        device.opened = false;
      },

      async sendFeatureReport(reportId, data) {
        if (!device.opened) {
          throw new DOMException("Device not opened", "InvalidStateError");
        }
        const uint8 = new Uint8Array(
          data instanceof ArrayBuffer ? data : data.buffer || data
        );
        await sendCommand("sendFeatureReport", {
          reportId,
          data: uint8ToBase64(uint8),
        });
      },

      async sendReport(reportId, data) {
        // Some apps might use sendReport instead of sendFeatureReport
        return device.sendFeatureReport(reportId, data);
      },

      async receiveFeatureReport(reportId) {
        if (!device.opened) {
          throw new DOMException("Device not opened", "InvalidStateError");
        }
        const resp = await sendCommand("getFeatureReport", {
          reportId,
          length: 65,
        });
        const buf = base64ToArrayBuffer(resp.data);
        const view = new DataView(buf);
        view.reportId = reportId;
        return view;
      },
    };

    return device;
  }

  // ── Patch navigator.hid ──
  // Two-pronged approach: patch the real object's methods AND override the property.
  // This ensures it works even if the SPA caches a reference to navigator.hid early.

  const realHID = navigator.hid;
  let authorizedDevice = null;

  async function bridgedRequestDevice(options) {
    console.log("[RK Bridge] requestDevice called, connecting to bridge...");
    try {
      await connectBridge();
      const info = await sendCommand("getDeviceInfo");

      if (!info.present) {
        throw new DOMException(
          "RK SPLIT70 not found on USB. Make sure it's plugged in.",
          "NotFoundError"
        );
      }

      console.log("[RK Bridge] Device found via bridge, creating virtual HIDDevice");
      authorizedDevice = createBridgedDevice();
      return [authorizedDevice];
    } catch (e) {
      if (e instanceof DOMException) throw e;
      throw new DOMException(
        `Bridge connection failed: ${e.message}. Is rk_bridge.py running?`,
        "NotFoundError"
      );
    }
  }

  // Save originals before patching
  const origGetDevices = realHID ? realHID.getDevices.bind(realHID) : null;

  async function bridgedGetDevices() {
    if (authorizedDevice) {
      try {
        await connectBridge();
        const info = await sendCommand("ping");
        if (info.devicePresent) {
          return [authorizedDevice];
        }
      } catch (e) {
        // Bridge not running, fall through
      }
    }
    if (origGetDevices) {
      try {
        return await origGetDevices();
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  // ── Triple-patch approach to intercept all possible access patterns ──

  // Approach 1: Patch HID.prototype (catches ALL instances)
  try {
    const HIDProto = Object.getPrototypeOf(realHID);
    if (HIDProto) {
      HIDProto.requestDevice = bridgedRequestDevice;
      HIDProto.getDevices = bridgedGetDevices;
      console.log("[RK Bridge] Patched HID.prototype methods");
    }
  } catch (e) {
    console.log("[RK Bridge] Could not patch HID.prototype:", e);
  }

  // Approach 2: Patch the instance directly (backup)
  if (realHID) {
    try {
      realHID.requestDevice = bridgedRequestDevice;
      realHID.getDevices = bridgedGetDevices;
      console.log("[RK Bridge] Patched navigator.hid instance methods");
    } catch (e) {
      console.log("[RK Bridge] Could not patch instance:", e);
    }
  }

  // Approach 3: Override the navigator.hid property (catches fresh lookups)
  const patchedHID = realHID || {};
  // Ensure our methods are on whatever object is returned
  patchedHID.requestDevice = bridgedRequestDevice;
  patchedHID.getDevices = bridgedGetDevices;

  try {
    Object.defineProperty(navigator, "hid", {
      get() { return patchedHID; },
      configurable: true,
    });
    console.log("[RK Bridge] Overrode navigator.hid property");
  } catch (e) {
    console.log("[RK Bridge] Could not override navigator.hid property:", e);
  }

  // Show a banner so the user knows the bridge is active
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showBanner);
  } else {
    showBanner();
  }

  function showBanner() {
    const banner = document.createElement("div");
    banner.id = "rk-bridge-banner";
    banner.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
        background: linear-gradient(135deg, #1a5276, #2e86c1);
        color: white; padding: 8px 16px; font-family: system-ui, sans-serif;
        font-size: 13px; display: flex; align-items: center; gap: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <span style="font-size: 16px;">🔌</span>
        <span><strong>RK Bridge Active</strong> — WebHID calls will proxy through the local bridge server (localhost:9876)</span>
        <span id="rk-bridge-status" style="margin-left: auto; opacity: 0.8;">Checking...</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none; border: 1px solid rgba(255,255,255,0.4);
          color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer;
          font-size: 12px; margin-left: 8px;
        ">×</button>
      </div>
    `;
    document.body.prepend(banner);

    // Check bridge status
    connectBridge()
      .then(() => sendCommand("ping"))
      .then((r) => {
        const el = document.getElementById("rk-bridge-status");
        if (el) {
          el.textContent = r.devicePresent
            ? "✓ Bridge connected, keyboard detected"
            : "✓ Bridge connected, keyboard not found on USB";
          el.style.color = r.devicePresent ? "#82e0aa" : "#f9e79f";
        }
      })
      .catch(() => {
        const el = document.getElementById("rk-bridge-status");
        if (el) {
          el.textContent = "✗ Bridge not running — start rk_bridge.py with sudo";
          el.style.color = "#f1948a";
        }
      });
  }

  console.log("[RK Bridge] WebHID bridge userscript loaded. navigator.hid patched.");
})();
