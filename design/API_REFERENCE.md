# API Reference

Quick reference for RK-Web models and hooks.

## KeyboardDevice

```typescript
class KeyboardDevice {
  // Properties
  id: string
  config: KeyboardConfig
  connected: boolean
  profiles: Profile[]
  activeProfileIndex: number

  // Profile management
  addProfile(name: string, mappings?: Map<number, KeyCode>): Profile
  deleteProfile(index: number): void
  async activateProfile(index: number): Promise<void>
  getActiveProfile(): Profile | null

  // Export/Import
  exportSnapshot(name: string): string
  async importSnapshot(json: string): Promise<void>
}
```

## Profile

```typescript
class Profile {
  // Properties
  name: string
  mappings: Map<number, KeyCode>

  // Key mapping methods
  async setMapping(keyIndex: number, keyCode: KeyCode): Promise<void>
  async clearMapping(keyIndex: number): Promise<void>
  getMapping(keyIndex: number): KeyCode | undefined
  hasMapping(keyIndex: number): boolean
  async clearAll(): Promise<void>
}
```

## React Hooks

```typescript
// Get all devices and management functions
const { devices, selectedDevice, selectDevice, requestDevice } = useDevices();

// Get selected device only
const device = useSelectedDevice();
```

## Usage Examples

### Connect Keyboard

```tsx
const { requestDevice } = useDevices();
<Button onClick={requestDevice}>Connect</Button>
```

### Remap Key

```tsx
const profile = useSelectedDevice()?.getActiveProfile();

<KeyCodeSelector
  value={profile.getMapping(keyIndex)}
  onChange={(code) => profile.setMapping(keyIndex, code)}
/>
```

### Switch Profiles

```tsx
const device = useSelectedDevice();

{device.profiles.map((profile, i) => (
  <Button onClick={() => device.activateProfile(i)}>
    {profile.name}
  </Button>
))}
```

### Export/Import

```tsx
// Export
const json = device.exportSnapshot('My Setup');
downloadFile('keyboard.json', json);

// Import
const json = await file.text();
await device.importSnapshot(json);
```

## Types

```typescript
interface KeyboardConfig {
  pid: string;
  name: string;
  enabled: boolean;
  keyMapEnabled: boolean;
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
  // ... (from Rangoli)
}
```
