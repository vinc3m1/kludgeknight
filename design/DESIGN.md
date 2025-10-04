# KludgeKnight Design Document

Web-based port of [Rangoli](https://github.com/rnayabed/rangoli) for Royal Kludge keyboard key remapping using WebHID API and React.

**Scope**: Key remapping with profiles. Lighting features deferred to Phase 2.

## Technology Stack

- **Vite** - Build tool with HTTPS dev server
- **React 18+** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Bun** - Package manager
- **WebHID API** - Direct HID communication (Chrome/Edge only)
- **GitHub Pages** - Static hosting

## Architecture Principle

**The keyboard hardware is the only source of truth.**

```
User Action
  ↓
Mutation API (returns Promise)
  ↓
Operation Queue (serializes HID writes)
  ↓
HID Send → Keyboard Hardware
  ↓
Promise resolves (or rejects with error)
  ↓
Model calls notify() → React re-renders
```

**Why this is simple:**
- No Zustand/Redux
- No IndexedDB
- Keyboard stores active mappings
- Profiles are JSON snapshots (export/import)
- All mutations queued to prevent race conditions

## Operation Queue System

All hardware mutations are queued and executed serially to prevent race conditions.

```typescript
class OperationQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;
      await operation();
    }
    this.processing = false;
  }
}
```

**Usage in models:**
```typescript
class Profile {
  private queue = new OperationQueue();

  async setMapping(keyIndex: number, keyCode: KeyCode): Promise<void> {
    return this.queue.enqueue(async () => {
      const oldValue = this.mappings.get(keyIndex);
      try {
        this.mappings.set(keyIndex, keyCode);
        await this.sendToKeyboard();
        this.notify();
      } catch (error) {
        // Rollback on failure
        if (oldValue !== undefined) {
          this.mappings.set(keyIndex, oldValue);
        } else {
          this.mappings.delete(keyIndex);
        }
        this.notify();
        throw error;
      }
    });
  }
}
```

## Core Models

### HIDDeviceManager

Singleton for device lifecycle management.

```typescript
class HIDDeviceManager {
  private static instance: HIDDeviceManager;
  private devices: Map<string, KeyboardDevice> = new Map();

  static getInstance(): HIDDeviceManager;

  async requestDevice(): Promise<KeyboardDevice | null>;
  async scanAuthorizedDevices(): Promise<KeyboardDevice[]>;

  getDevice(id: string): KeyboardDevice | undefined;
  getAllDevices(): KeyboardDevice[];
}
```

**Implementation notes:**
- Uses `navigator.hid.requestDevice()` with filter `{ vendorId: 0x258a }`
- `scanAuthorizedDevices()` uses `navigator.hid.getDevices()`
- Handles `connect`/`disconnect` events
- Loads keyboard configs from `/public/keyboards/` JSON

### KeyboardDevice

Represents a connected keyboard.

```typescript
class KeyboardDevice {
  readonly id: string;
  readonly hidDevice: HIDDevice;
  readonly config: KeyboardConfig;

  connected: boolean = true;
  profiles: Profile[] = [];
  activeProfileIndex: number = -1;
  notify?: () => void;

  // All methods return promises that resolve when queue completes
  async addProfile(name: string, mappings?: Map<number, KeyCode>): Promise<Profile>;
  async deleteProfile(index: number): Promise<void>;
  async activateProfile(index: number): Promise<void>;

  getActiveProfile(): Profile | null;

  exportSnapshot(name: string): string;
  async importSnapshot(json: string): Promise<void>;
}
```

**Key behaviors:**
- `addProfile()` creates new Profile and activates it
- `activateProfile()` sends all mappings to keyboard via queue
- `importSnapshot()` replaces all profiles and activates first one
- All mutations queued to prevent concurrent HID writes

### Profile

Manages key mappings with queued updates.

```typescript
class Profile {
  name: string;
  mappings: Map<number, KeyCode> = new Map();
  notify?: () => void;

  private queue: OperationQueue = new OperationQueue();
  private device: KeyboardDevice;

  // All return promises that resolve when HID write completes
  async setMapping(keyIndex: number, keyCode: KeyCode): Promise<void>;
  async clearMapping(keyIndex: number): Promise<void>;
  async clearAll(): Promise<void>;

  // Synchronous getters
  getMapping(keyIndex: number): KeyCode | undefined;
  hasMapping(keyIndex: number): boolean;

  toJSON(): object;
}
```

**Error handling:**
- All async methods rollback local state on HID failure
- Errors propagated to caller for UI handling
- `notify()` called after both success and rollback

### ProtocolTranslator

Translates profile mappings to 9 HID buffers (65 bytes each).

```typescript
class ProtocolTranslator {
  constructor(
    private device: HIDDevice,
    private config: KeyboardConfig
  ) {}

  async sendProfile(mappings: Map<number, KeyCode>): Promise<void> {
    const buffers = BufferCodec.encode(mappings, this.config);

    for (let i = 0; i < 9; i++) {
      await this.device.sendReport(0, buffers[i]);
    }
  }
}
```

### BufferCodec

Encodes/decodes the 9-buffer protocol from Rangoli.

```typescript
class BufferCodec {
  static encode(
    mappings: Map<number, KeyCode>,
    config: KeyboardConfig
  ): Uint8Array[] {
    // Port logic from Rangoli's keyboardconfiguratorcontroller.cpp
    // Returns 9 buffers of 65 bytes each:
    // [0]: 0x00  (Report ID)
    // [1]: 0x0B  (Command: Key mapping)
    // [2]: 0-8   (Buffer index)
    // [3-64]: Key mapping data
  }

  static decode(buffers: Uint8Array[]): Map<number, KeyCode> {
    // Parse received buffers back to mappings
  }
}
```

## React Integration

### DeviceContext

Simple context wrapper around HIDDeviceManager.

```typescript
interface DeviceContextValue {
  devices: KeyboardDevice[];
  selectedDevice: KeyboardDevice | null;
  selectDevice: (device: KeyboardDevice | null) => void;
  requestDevice: () => Promise<void>;
}

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Set notify callback on all devices
  useEffect(() => {
    const manager = HIDDeviceManager.getInstance();
    manager.getAllDevices().forEach(device => {
      device.notify = forceUpdate;
      device.profiles.forEach(profile => {
        profile.notify = forceUpdate;
      });
    });
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const manager = HIDDeviceManager.getInstance();
      manager.getAllDevices().forEach(device => {
        device.notify = undefined;
        device.profiles.forEach(p => p.notify = undefined);
      });
    };
  }, []);

  // ... context implementation
}

export function useDevices(): DeviceContextValue;
export function useSelectedDevice(): KeyboardDevice | null;
```

## Data Types

```typescript
interface KeyboardConfig {
  pid: string;
  name: string;
  enabled: boolean;
  keyMapEnabled: boolean;
  top: [number, number];
  bottom: [number, number];
  keys: Key[];
}

interface Key {
  bufferIndex: number;
  keyCode: KeyCode;
  topX: number;
  topY: number;
  bottomX: number;
  bottomY: number;
}

enum KeyCode {
  Key_Escape = 0x29,
  Key_A = 0x04,
  // ... (from Rangoli's keycode.h)
}
```

## Usage Examples

### Connect Keyboard
```tsx
const { requestDevice } = useDevices();

<Button onClick={requestDevice}>
  Connect Keyboard
</Button>
```

### Remap Key with Error Handling
```tsx
const profile = useSelectedDevice()?.getActiveProfile();
const [error, setError] = useState<string | null>(null);

const handleRemap = async (keyIndex: number, keyCode: KeyCode) => {
  try {
    await profile.setMapping(keyIndex, keyCode);
    setError(null);
  } catch (err) {
    setError('Failed to remap key. Please try again.');
  }
};

<KeyCodeSelector
  value={profile?.getMapping(keyIndex)}
  onChange={(code) => handleRemap(keyIndex, code)}
  error={error}
/>
```

### Switch Profiles
```tsx
const device = useSelectedDevice();
const [loading, setLoading] = useState(false);

const switchProfile = async (index: number) => {
  setLoading(true);
  try {
    await device.activateProfile(index);
  } catch (err) {
    console.error('Failed to switch profile');
  } finally {
    setLoading(false);
  }
};

{device?.profiles.map((profile, i) => (
  <Button
    key={i}
    onClick={() => switchProfile(i)}
    disabled={loading}
  >
    {profile.name}
  </Button>
))}
```

### Export/Import Profiles
```tsx
// Export to file
const handleExport = () => {
  const json = device.exportSnapshot('My Setup');
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'keyboard-config.json';
  a.click();
};

// Import from file
const handleImport = async (file: File) => {
  try {
    const json = await file.text();
    await device.importSnapshot(json);
  } catch (err) {
    console.error('Failed to import profile');
  }
};
```

## Project Structure

```
KludgeKnight/
├── design/
│   ├── DESIGN.md              # This file
│   ├── ARCHITECTURE.md        # Delete (merged here)
│   └── API_REFERENCE.md       # Delete (merged here)
├── public/
│   └── keyboards/             # Keyboard configs from Rangoli
├── src/
│   ├── models/
│   │   ├── OperationQueue.ts       (~40 lines)
│   │   ├── HIDDeviceManager.ts     (~150 lines)
│   │   ├── KeyboardDevice.ts       (~120 lines)
│   │   ├── Profile.ts              (~100 lines)
│   │   ├── ProtocolTranslator.ts   (~60 lines)
│   │   └── BufferCodec.ts          (~120 lines)
│   ├── context/
│   │   └── DeviceContext.tsx       (~80 lines)
│   ├── hooks/
│   │   └── useDevices.ts           (~20 lines)
│   ├── components/
│   │   ├── ConnectButton.tsx
│   │   ├── KeyboardCanvas.tsx
│   │   ├── ProfileList.tsx
│   │   ├── KeyRemapper.tsx
│   │   └── ExportImport.tsx
│   ├── types/
│   │   ├── keyboard.ts
│   │   └── keycode.ts
│   └── App.tsx
├── package.json
└── vite.config.ts
```

**Total model code: ~590 lines** (including queue)

## Commands

```bash
# Install dependencies
bun install

# Dev server (HTTPS for WebHID)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/KludgeKnight/',
  server: {
    https: true,
    host: true
  }
});
```

```json
// package.json
{
  "scripts": {
    "dev": "bunx --bun vite --host",
    "build": "bunx --bun vite build",
    "preview": "bunx --bun vite preview"
  }
}
```

## WebHID Protocol Details

### Buffer Format
```
Byte[0]:    0x00      Report ID
Byte[1]:    0x0B      Command (Key mapping)
Byte[2]:    0-8       Buffer index
Byte[3-64]: Mapping data (varies by keyboard)
```

### Sending Profile
```typescript
// 9 buffers × 65 bytes each
for (let i = 0; i < 9; i++) {
  await device.sendReport(0, buffer[i]);
}
```

### Browser Requirements
- Chrome 89+, Edge 89+, Opera 75+
- HTTPS required (localhost OK for dev)
- User permission required

## GitHub Pages Deployment

1. Push to main branch
2. GitHub Actions builds automatically
3. Deploys to `https://username.github.io/KludgeKnight`

See `.github/workflows/deploy.yml` for CI/CD configuration.

## Future Phases

- **Phase 2**: Lighting control (RGB, modes, brightness)
- **Phase 3**: PWA support, cloud sync, community profiles

## License

GPL v3 (same as Rangoli)

## Credits

Based on [Rangoli](https://github.com/rnayabed/rangoli) by Debayan Sutradhar.
