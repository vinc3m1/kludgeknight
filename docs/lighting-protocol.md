# Royal Kludge Lighting Protocol

This document describes how the Royal Kludge keyboard lighting system works, based on analysis of the official RK software configuration files and the [Rangoli](https://github.com/rnayabed/rangoli) project.

## Overview

RK keyboards support two types of lighting:
- **Single-color backlit** (e.g., F68 with `RGBKb=0`) - White LEDs with brightness control only
- **RGB backlit** (e.g., RK100 with `RGBKb=1`) - Full RGB LEDs with per-key color control

The lighting system is **fully data-driven** - each keyboard defines its own available modes and capabilities through configuration files.

## Configuration Files

### KB.ini - Mode Definitions

Located at `/rk/Dev/{PID}/KB.ini`, the `[OPT]` section defines:

```ini
[OPT]
RGBKb=0              # 0 = single-color backlit, 1 = RGB
LayoutKeyNum=100
KbLayout=7

; Lighting mode definitions (up to 21 modes)
; Format: animation, speed, brightness, direction, random, colorpicker
LedOpt1=0,0,1,0,0,0  # Mode 1: brightness control only
LedOpt2=0,1,0,0,0,0  # Mode 2: speed control only
LedOpt3=0,0,0,0,0,0  # Mode 3: no controls (OFF)
```

#### LedOpt Flag Meanings

Each `LedOpt` entry has 6 flags that control which UI elements should be shown:

| Position | Flag | Meaning | UI Control |
|----------|------|---------|------------|
| 1 | animation | Unknown/Reserved | Always 0 in all observed configs |
| 2 | speed | Animation speed slider | 1-5 slider (Very Slow → Very Fast) |
| 3 | brightness | Light brightness slider | 1-5 slider |
| 4 | direction | Direction control | 0=none, 1=left/right only, 2=up/down only |
| 5 | random | Random color mode | Toggle checkbox |
| 6 | colorpicker | Color selection | RGB color picker |

**Notes:**
- **Speed values**: 1=Very Slow, 2=Slow, 3=Normal, 4=Fast, 5=Very Fast (default: 3)
- **Brightness values**: 1-5 (exact labels unknown, likely similar to speed) (default: 5)
- **Direction**: Controls which directions a lighting effect can animate (e.g., wave effects)
- **Sleep default**: 5 (Off/no sleep)

**Examples:**

```ini
# Single-color backlit keyboard (F68)
LedOpt1=0,0,1,0,0,0  → Steady: only brightness slider
LedOpt2=0,1,0,0,0,0  → Breathing: only speed slider
LedOpt3=0,0,0,0,0,0  → OFF: no controls

# RGB keyboard (RK100RGB)
LedOpt1=0,1,1,0,1,1  → Full controls: speed, brightness, random, color
LedOpt2=0,1,1,0,1,1  → Full controls
LedOpt3=0,1,1,0,0,0  → Speed and brightness only
```

### led.xml - Mode Names (Localization)

Located at:
1. `/rk/Dev/{PID}/en/led.xml` (per-device, if exists)
2. `/rk/Dev/en/led.xml` (global fallback)

Provides localized names for each mode:

```xml
<?xml version="1.0" encoding="utf-16"?>
<root>
  <config>
    <tc_led1>Steady</tc_led1>
    <tc_led2>Breathing</tc_led2>
    <tc_led3>OFF</tc_led3>
    <!-- ... up to tc_led21 -->
  </config>
</root>
```

**Important:** Files are UTF-16 encoded (little-endian with CRLF line terminators)

### Mode Resolution Flow

```
KB.ini: LedOpt1=0,0,1,0,0,0
   ↓
Look up tc_led1 in led.xml
   ↓
Display name: "Steady"
   ↓
Mode index: 1 → sent as mode bit in HID buffer
```

## HID Protocol

Based on analysis of [Rangoli's keyboardconfiguratorcontroller.cpp](https://github.com/rnayabed/rangoli/blob/master/src/keyboardconfiguratorcontroller.cpp):

### Standard Lighting Mode (1 buffer)

Sent via HID feature report to set global lighting parameters:

```
Buffer size: 65 bytes

Header:
[0] = 0x0a       # Command byte
[1] = 0x01       # Number of buffers
[2] = 0x01       # Buffer index (always 1 for lighting)
[3] = 0x02       # Sub-command
[4] = 0x29       # Sub-command parameter

Parameters:
[5] = mode_bit   # Mode index from LedOpt# (1-21)
[6] = 0x00       # Reserved
[7] = speed      # Animation speed (1-5: Very Slow → Very Fast)
[8] = brightness # Light brightness (1-5)
[9] = red        # Color red component (0-255) - if not random
[10] = green     # Color green component (0-255) - if not random
[11] = blue      # Color blue component (0-255) - if not random
[12] = random    # 0x01 = random colors, 0x00 = fixed color
[13] = sleep     # Sleep timer (0-5 mapping to time intervals)

[14-64] = 0x00   # Padding
```

**Sleep Timer Values:**
Confirmed from Rangoli source (KeyboardConfigurator.qml):
- **1 = 5 min**
- **2 = 10 min**
- **3 = 20 min**
- **4 = 30 min**
- **5 = Off (no sleep)**
- Note: Values are 1-5, not 0-4. Zero is not a valid sleep timer value.

### Custom Per-Key RGB (7 buffers)

For RGB keyboards with custom mode (`tc_led14` is typically "Customize"):

```
7 buffers of 65 bytes each
Total color data: ~420 bytes (7*65 - headers)

Buffer format:
[0] = 0x0a              # Command byte
[1] = 0x07              # Total number of buffers
[2] = buffer_index      # 1-7 (current buffer)
[3] = 0x03              # Sub-command (only in buffer 1)
[4] = 0x7e              # Sub-command parameter (only in buffer 1)
[5] = 0x01              # Unknown (only in buffer 1)
[6-64] = color_data     # RGB data (buffer 1 starts at [6], others at [3])

Color data layout:
Each key gets 3 consecutive bytes at position (key.bIndex * 3):
  [offset + 0] = red
  [offset + 1] = green
  [offset + 2] = blue
```

**Buffer Data Offsets:**
- Buffer 1: data starts at byte 6 (59 bytes of color data)
- Buffers 2-7: data starts at byte 3 (62 bytes of color data)

### Mode Bit Mapping

The `mode_bit` value sent in buffer[5] corresponds to the lighting mode index. From Rangoli's `modemodel.cpp`, we can see different modes for RGB vs non-RGB:

**RGB Modes** (when `RGBKb=1`):
- 0x00: Custom
- 0x01: Ambilight
- 0x02: Breathing
- 0x03: Diagonal Transformation
- 0x04: Flash Away
- ... (see Rangoli source for complete list)

**Non-RGB Modes** (when `RGBKb=0`):
- Different mode bit values, keyboard-specific

The actual mode bit values are determined by the keyboard's firmware and should be treated as opaque indices.

## Examples

### Example 1: F68 (Non-RGB)

**KB.ini:**
```ini
[OPT]
RGBKb=0
LedOpt1=0,0,1,0,0,0  # Steady
LedOpt2=0,1,0,0,0,0  # Breathing
LedOpt3=0,0,0,0,0,0  # OFF
```

**led.xml** (uses global `/rk/Dev/en/led.xml`):
```xml
<tc_led1>Steady</tc_led1>
<tc_led2>Breathing</tc_led2>
<tc_led3>OFF</tc_led3>
```

**UI Behavior:**
- Mode 1 "Steady": Shows brightness slider (0-5), sleep timer
- Mode 2 "Breathing": Shows animation speed slider (0-5), sleep timer
- Mode 3 "OFF": No controls shown

### Example 2: RK100RGB (RGB)

**KB.ini:**
```ini
[OPT]
RGBKb=1
LedOpt1=0,1,1,0,1,1  # First RGB mode
LedOpt2=0,1,1,0,1,1  # Second RGB mode
...
LedOpt14=1,1,1,0,0,0 # Custom mode (per-key RGB)
```

**led.xml:**
```xml
<tc_led1>Neon Stream</tc_led1>
<tc_led2>Ripples Shining</tc_led2>
...
<tc_led14>Customize</tc_led14>
```

**UI Behavior:**
- Most modes: Show speed, brightness, random toggle, color picker, sleep timer
- Custom mode: Show per-key color selection interface

## Implementation Notes

### Parsing led.xml

The XML files are UTF-16 LE encoded. In JavaScript/TypeScript:

```typescript
const response = await fetch('path/to/led.xml');
const arrayBuffer = await response.arrayBuffer();
const decoder = new TextDecoder('utf-16le');
const xmlText = decoder.decode(arrayBuffer);
// Parse XML (use DOMParser or xml2js)
```

### Mode Selection Flow

1. Parse KB.ini to get LedOpt entries
2. Parse led.xml to get mode names
3. For each LedOpt:
   - Extract flags to determine available controls
   - Look up corresponding tc_led{n} for display name
   - Create mode object: `{ index, name, flags, modeBit }`
4. Build UI dynamically based on flags
5. When mode changes, send standard lighting buffer with appropriate values

### Custom RGB Flow

1. Detect if current mode is "Custom" (usually index 14)
2. Allow user to click keys and select colors
3. Build RGB data array: `colorData[key.bIndex * 3] = [r, g, b]`
4. Encode into 7 HID buffers
5. Send all 7 buffers sequentially

## Future Research

- [x] ~~Verify exact sleep timer value mapping~~ - **DONE**: 1=5min, 2=10min, 3=20min, 4=30min, 5=Off
- [x] ~~Understand "animation" flag (position 1)~~ - **DONE**: Always 0, appears unused/reserved
- [x] ~~Understand "direction" flag behavior (position 4)~~ - **DONE**: 0=none, 1=left/right, 2=up/down
- [ ] Test with more keyboard models to verify mode bit values
- [x] ~~Investigate if keyboards can report current lighting state~~ - **DONE**: No read capability found in Rangoli; keyboards appear write-only for lighting
- [ ] Determine exact brightness level labels (1-5)
- [ ] Map mode bit values to lighting effects for different keyboard models

## References

- [Rangoli Project](https://github.com/rnayabed/rangoli) - C++/Qt desktop app with full RGB support
- RK Software configuration files in `/public/rk/Dev/`
- [WebHID API](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API)
