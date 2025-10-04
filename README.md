# KludgeKnight

**Unofficial web-based key remapper for Royal Kludge keyboards**

Remap any key on your Royal Kludge keyboard directly in your browser. No installation required.

> ⚠️ **Disclaimer**: This is unofficial software and is not affiliated with, endorsed by, or connected to Royal Kludge in any way. Use at your own risk.

> **Note**: This software has only been tested on the Royal Kludge F68 keyboard. While the key mappings are sourced from the official RK software and should work with other RK keyboards, functionality on other models has not been verified.

## ✨ Features

- 🌐 **Runs in your browser** - No downloads or installation
- 🎹 **Visual keyboard layout** - See your keyboard and click to remap
- 🔄 **Live updates** - Changes apply immediately to your hardware
- 🔒 **Privacy first** - Everything happens locally, no data sent anywhere
- 🗺️ **Key mappings from official RK software** - Keyboard layouts and configurations pulled from the official Royal Kludge app

### ⚠️ Important Limitation

**The app cannot read your existing key mappings from the keyboard.** Due to firmware limitations, we can only write new mappings, not read what's currently set.

This means:
- If you've already remapped keys using RK software, those mappings won't be visible here
- The app always starts with the default keyboard layout
- Any remapping you do will overwrite what's currently on the keyboard

## 🚀 Getting Started

### Requirements

- **Browser**: Chrome, Edge, or Opera (WebHID support required)
- **Keyboard**: Royal Kludge keyboard with USB cable

### How to Use

1. **Visit the app** at [your-deployment-url]
2. **Click "Connect Keyboard"** and select your keyboard from the list
3. **Click any key** on the keyboard diagram
4. **Select a new key** to remap it to
5. **Done!** The change is saved to your keyboard immediately

### Resetting Keys

- **Single key**: Click any key and select "Set to Default" to reset it to its original function
- **All keys**: Click "Reset All Keys to Default" button

## ❓ FAQ

### Which browsers work?

- ✅ **Chrome** (version 89+)
- ✅ **Edge** (version 89+)
- ✅ **Opera** (version 75+)
- ❌ **Firefox** - Not supported (no WebHID)
- ❌ **Safari** - Not supported (no WebHID)

### Which keyboards are supported?

Any Royal Kludge keyboard that works with the official RK software should be supported, as the keyboard configurations are pulled directly from the official RK app.

### Is my data safe?

Yes! Everything happens locally in your browser. No data is sent to any server. Your keyboard mappings are saved directly to your keyboard's hardware.

### Can I use this on multiple computers?

Yes! Once you remap your keys, the settings are stored in your keyboard's memory. They'll work on any computer, even without this app.

### Does it work on Mac/Linux?

Yes, as long as you're using a supported browser (Chrome, Edge, or Opera).

## 🐛 Troubleshooting

**Keyboard not detected?**
- Make sure you're using Chrome, Edge, or Opera
- Try a different USB port or cable
- Check that your keyboard is in wired mode (not Bluetooth)

**Changes not applying?**
- Disconnect and reconnect your keyboard
- Try clicking "Reset All Keys to Default" and remapping again

## 📄 License

GPL v3 - See LICENSE file for details

## 🙏 Acknowledgments

This project was inspired by [Rangoli](https://github.com/rnayabed/rangoli) by Debayan Sutradhar. The protocol understanding and WebHID connection parameters came from studying that project.

**Derivative work:** `src/models/BufferCodec.ts` contains code ported from Rangoli's `keyboardconfiguratorcontroller.cpp`. All other code was written independently for this project.

---

## 👨‍💻 For Developers

Want to run this locally or contribute?

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build
```

See the source code for technical details.
