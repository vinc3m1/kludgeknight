# Architecture Overview

## Core Principle

**The keyboard hardware is the only source of truth for key mappings.**

```
Keyboard Hardware (truth)
    ↓
KeyboardDevice Model (reactive data)
    ↓
React Context (distribution)
    ↓
UI Components (presentation)
```

## Why This is Simple

### No Complex State Management
- ❌ No Zustand
- ❌ No Redux
- ❌ No IndexedDB
- ✅ Just React Context + callback pattern

### Keyboard IS the Database
- Active key mappings live on the keyboard
- Profiles are just JSON snapshots (export/import via files)
- No sync issues - keyboard is always truth
- Refresh page? State is still on the keyboard

### Pure Data Models
- Not "controllers" or "services"
- Just data + methods that operate on it
- Direct method calls (no actions/reducers)

## Data Flow

```
User clicks key
  ↓
profile.setMapping(keyIndex, keyCode)
  ↓
Model updates data + sends to keyboard
  ↓
Model calls notify()
  ↓
React re-renders automatically
```

**That's it.** No stores, no reducers, no middleware.

## Models

### KeyboardDevice
- Represents a connected keyboard
- Contains profiles array
- Manages active profile
- Export/import snapshots

### Profile
- Contains key mappings (Map<number, KeyCode>)
- Methods to update individual keys
- Each update syncs to keyboard immediately

## Components Just Read Data

```tsx
const device = useSelectedDevice();

// Direct access
device.profiles[0].name
device.activeProfileIndex

// Direct method calls
device.addProfile('Gaming')
profile.setMapping(5, KeyCode.A)
```

No selectors, no dispatch, no actions.

## Benefits

1. **Radically Simple** - ~400 lines of model code
2. **Type-Safe** - Full TypeScript, IDE autocomplete works
3. **No Learning Curve** - Just React basics
4. **No Sync Issues** - Single source of truth
5. **User Owns Data** - Profiles are files they can backup/share

## File Structure

```
src/
├── models/              # Just 5 files
│   ├── HIDDeviceManager.ts
│   ├── KeyboardDevice.ts
│   ├── Profile.ts
│   ├── ProtocolTranslator.ts
│   └── BufferCodec.ts
├── context/
│   └── DeviceContext.tsx  # ~50 lines
└── components/          # Regular React components
```

## Deployment

- GitHub Pages (static hosting)
- HTTPS required for WebHID
- Bun for package management
- Vite for bundling

```bash
bun install
bun run dev    # localhost with HTTPS
bun run build  # Deploy to GitHub Pages
```
