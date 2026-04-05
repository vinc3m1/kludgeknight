const BRIDGE_URL = 'ws://127.0.0.1:9876';
const COMMAND_TIMEOUT_MS = 10000;
const AVAILABILITY_CHECK_TIMEOUT_MS = 2000;

/**
 * A virtual HIDDevice backed by the rk_bridge.py WebSocket server.
 *
 * On macOS, keyboards whose USB interface packs NKRO alongside vendor
 * config collections (e.g. RK SPLIT70, A70) are seized by the kernel
 * HID Event System.  WebHID's device.open() returns kIOReturnNotReady.
 *
 * The bridge server detaches the kernel driver via libusb and proxies
 * HID SET_REPORT / GET_REPORT as WebSocket messages.  This adapter
 * presents the same interface as a native HIDDevice so the rest of
 * the codebase (KeyboardDevice, ProtocolTranslator) works unchanged.
 */
export class BridgeDeviceAdapter extends EventTarget {
  // -- HIDDevice-compatible properties --
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  readonly collections: HIDCollectionInfo[];
  readonly serialNumber: string;

  oninputreport: ((this: HIDDevice, ev: HIDInputReportEvent) => unknown) | null = null;

  private _opened = false;
  get opened(): boolean { return this._opened; }

  // -- internals --
  private ws: WebSocket | null = null;
  private reqCounter = 0;
  private pending = new Map<number, {
    resolve: (msg: Record<string, unknown>) => void;
    reject: (err: Error) => void;
  }>();
  private originalHidDevice: HIDDevice | null;

  constructor(hidDevice: HIDDevice) {
    super();
    this.originalHidDevice = hidDevice;
    this.vendorId = hidDevice.vendorId;
    this.productId = hidDevice.productId;
    this.productName = hidDevice.productName;
    this.collections = hidDevice.collections;
    // serialNumber is Chrome-specific, not in the W3C spec
    this.serialNumber = 'serialNumber' in hidDevice ? String(hidDevice.serialNumber) : '';
  }

  /** Check if the bridge server is reachable and responsive. */
  static async isAvailable(): Promise<boolean> {
    try {
      const ws = new WebSocket(BRIDGE_URL);
      return await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => { ws.close(); resolve(false); }, AVAILABILITY_CHECK_TIMEOUT_MS);
        ws.onopen = () => {
          clearTimeout(timeout);
          ws.send(JSON.stringify({ id: 0, cmd: 'ping' }));
          ws.onmessage = (event) => {
            try {
              const msg = JSON.parse(event.data);
              ws.close();
              resolve(msg.ok === true);
            } catch {
              ws.close();
              resolve(false);
            }
          };
        };
        ws.onerror = () => { clearTimeout(timeout); resolve(false); };
      });
    } catch {
      return false;
    }
  }

  // -- HIDDevice interface --

  async open(): Promise<void> {
    await this.connectWs();
    await this.sendCommand('open');
    this._opened = true;
    console.log('[Bridge] Device opened via bridge server');
  }

  async close(): Promise<void> {
    try { await this.sendCommand('close'); } catch { /* ignore */ }
    this._opened = false;
    this.ws?.close();
    this.ws = null;
  }

  async forget(): Promise<void> {
    await this.close();
    // Also revoke the original WebHID permission
    try { await this.originalHidDevice?.forget(); } catch { /* ignore */ }
  }

  async sendReport(reportId: number, data: BufferSource): Promise<void> {
    return this.sendFeatureReport(reportId, data);
  }

  async sendFeatureReport(reportId: number, data: BufferSource): Promise<void> {
    if (!this._opened) throw new DOMException('Device not opened', 'InvalidStateError');
    const bytes = toUint8Array(data);
    await this.sendCommand('sendFeatureReport', {
      reportId,
      data: uint8ToBase64(bytes),
    });
  }

  async receiveFeatureReport(reportId: number): Promise<DataView> {
    if (!this._opened) throw new DOMException('Device not opened', 'InvalidStateError');
    const resp = await this.sendCommand('getFeatureReport', { reportId, length: 65 });
    return new DataView(base64ToArrayBuffer(resp.data as string));
  }

  // -- WebSocket internals --

  private connectWs(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) { resolve(this.ws); return; }
      const socket = new WebSocket(BRIDGE_URL);
      socket.onopen = () => { this.ws = socket; resolve(socket); };
      socket.onerror = () => reject(new DOMException(
        'Bridge server not running. Start it with: sudo python3 bridge/rk_bridge.py',
        'NetworkError',
      ));
      socket.onclose = () => { this.ws = null; };
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const p = this.pending.get(msg.id);
          if (p) {
            this.pending.delete(msg.id);
            if (msg.ok) {
              p.resolve(msg);
            } else {
              p.reject(new DOMException(msg.error ?? 'Bridge error', 'NotAllowedError'));
            }
          }
        } catch { /* ignore malformed messages */ }
      };
    });
  }

  private sendCommand(cmd: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new DOMException('Bridge not connected', 'NetworkError'));
        return;
      }
      const id = ++this.reqCounter;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, cmd, ...params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new DOMException('Bridge timeout', 'TimeoutError'));
        }
      }, COMMAND_TIMEOUT_MS);
    });
  }
}

// -- helpers --

function toUint8Array(data: BufferSource): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return new Uint8Array(data as ArrayBuffer);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buf = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buf;
}
