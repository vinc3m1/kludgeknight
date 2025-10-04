# KludgeKnight - Royal Kludge Keyboard Configuration

Web-based port of [Rangoli](https://github.com/rnayabed/rangoli) using WebHID API and React.

**Current scope**: Key remapping with profiles. Lighting features will be added later.

## Features

- ✅ **Direct hardware control** via WebHID (Chrome/Edge only)
- ✅ **No installation required** - runs in browser
- ✅ **No database** - keyboard hardware is the source of truth
- ✅ **Profile management** via JSON export/import
- ✅ **Key remapping** with multiple profiles
- ✅ **Ultra-simple architecture** - ~400 lines of model code

## Quick Start

```bash
bun install
bun run dev
```

Open `https://localhost:3000` (HTTPS required for WebHID)

## Documentation

- **[design/DESIGN.md](./design/DESIGN.md)** - Complete technical design and API reference

## Usage

### Connect to Keyboard

```tsx
const { requestDevice } = useDevices();
<Button onClick={requestDevice}>Connect Keyboard</Button>
```

### Remap Keys

```tsx
const profile = useSelectedDevice()?.getActiveProfile();

<KeyCodeSelector
  value={profile.getMapping(keyIndex)}
  onChange={(code) => profile.setMapping(keyIndex, code)}
/>
```

### Save/Load Profiles

```tsx
// Export to file
const json = device.exportSnapshot('My Setup');
downloadFile('keyboard.json', json);

// Import from file
const json = await file.text();
await device.importSnapshot(json);
```

## Architecture

Everything is just data + methods:

```typescript
// Get the connected keyboard
const device = useSelectedDevice();

// Direct access to data
device.profiles[0].name     // "Gaming"

// Direct method calls
const profile = device.getActiveProfile();
await profile.setMapping(5, KeyCode.A);  // Remap key 5 to 'A'
```

**No complex state management:**
- No Zustand
- No IndexedDB
- No controllers/services
- Just simple models with React Context

## Browser Support

**WebHID API** is required:
- ✅ Chrome 89+
- ✅ Edge 89+
- ✅ Opera 75+
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

**HTTPS** is required (localhost works during development)

## Development

```bash
# Install dependencies
bun install

# Dev server (with HTTPS for WebHID)
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

## Deployment

Configured for **GitHub Pages**:

1. Push to main branch
2. GitHub Actions builds automatically
3. Deploys to `https://username.github.io/KludgeKnight`

See [design/DESIGN.md#github-pages-deployment](./design/DESIGN.md#github-pages-deployment) for setup.

## Supported Keyboards

All keyboards supported by Rangoli with `keyMapEnabled: true`.

See [Rangoli keyboard list](../rangoli/keyboards-list.md).

## Future Roadmap

- **Phase 1** (Current): Key remapping with profiles ✅
- **Phase 2**: Lighting control (RGB, modes, brightness)
- **Phase 3**: PWA support, cloud sync, community profiles

## Contributing

This is a web port of Rangoli. See [Rangoli's contribution guidelines](https://github.com/rnayabed/rangoli#bugs-and-support).

## License

GPL v3 (same as Rangoli)

## Credits

- **Original Rangoli** by [Debayan Sutradhar (rnayabed)](https://github.com/rnayabed)
- **Web Port** architecture designed for radical simplicity
- All protocol work from the original Rangoli project
