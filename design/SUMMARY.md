# Design Summary

## What We Built

A **radically simple** web app for Royal Kludge keyboard key remapping.

## Key Decisions

### 1. Key Remapping Only (For Now)
- ❌ No lighting control (added later in Phase 2)
- ❌ No per-key RGB
- ✅ Just key remapping with profiles

**Why**: Simpler to implement, test, and maintain. Add complexity only when needed.

### 2. Keyboard IS the Database
- No IndexedDB
- No localStorage for state
- Profiles are JSON files (download/upload)

**Why**: Keyboard already stores active mappings. Why duplicate?

### 3. Profile as a Model
- Not a plain object
- Has methods to update individual keys
- Each update syncs to hardware immediately

```typescript
const profile = device.getActiveProfile();
await profile.setMapping(5, KeyCode.A);  // Just one key
```

**Why**: Users click one key at a time. Update one key at a time.

### 4. Pure Data Models
- Not "controllers" or "services"
- Just data + methods
- Direct method calls (no actions/reducers)

```typescript
class KeyboardDevice {
  profiles: Profile[] = [];

  addProfile(name: string): Profile { /* ... */ }
}
```

**Why**: Simpler to understand. No unnecessary abstraction.

### 5. React Context Only
- No Zustand
- No Redux
- Just Context + callback pattern

```typescript
device.notify = forceUpdate;  // That's it
```

**Why**: Keyboard is the state. Context just distributes it.

### 6. Bun for Everything
- `bun install`
- `bun run dev`
- `bun run build`

**Why**: Faster than npm. Modern. Simple.

## Architecture

```
User clicks key
  ↓
profile.setMapping(keyIndex, keyCode)
  ↓
Model updates + syncs to keyboard
  ↓
Model calls notify()
  ↓
React re-renders
```

**5 steps. No middleware. No store. No reducers.**

## File Count

```
models/      5 files (~400 lines total)
context/     1 file  (~50 lines)
components/  ~10 files (regular React)
```

**Total model code: ~450 lines**

Compare to typical state management:
- Actions: ~100 lines
- Reducers: ~150 lines
- Selectors: ~100 lines
- Store setup: ~50 lines
- Middleware: ~100 lines
- **Total: ~500 lines** just for state management

## What We Avoided

- ❌ Complex state synchronization
- ❌ Action creators and reducers
- ❌ Store selectors
- ❌ Database migrations
- ❌ Sync logic between keyboard/DB
- ❌ Overly abstracted "controllers"
- ❌ Unnecessary lighting complexity (for now)

## What We Got

- ✅ Type-safe models
- ✅ Direct method calls
- ✅ Automatic re-renders
- ✅ No sync issues
- ✅ Easy to test
- ✅ Easy to extend

## Documentation Structure

```
design/
├── DESIGN.md          # Complete technical design
├── ARCHITECTURE.md    # High-level overview
├── API_REFERENCE.md   # API with examples
└── SUMMARY.md         # This file
```

## Next Steps

1. Port BufferCodec logic from Rangoli
2. Implement React components
3. Test with actual RK keyboard
4. Deploy to GitHub Pages

**Phase 2**: Add lighting control (brightness, RGB, modes)
