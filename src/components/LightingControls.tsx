import { useState, useEffect } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import type { LightingMode } from '../types/keyboard';

const SPEED_LABELS = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
const SLEEP_LABELS = ['5 min', '10 min', '20 min', '30 min', 'Off'];

export function LightingControls() {
  const device = useSelectedDevice();
  const [selectedModeIndex, setSelectedModeIndex] = useState(device?.lightingSettings?.modeIndex ?? 0);
  const [speed, setSpeed] = useState(device?.lightingSettings?.speed ?? 3);
  const [brightness, setBrightness] = useState(device?.lightingSettings?.brightness ?? 5);
  const [color, setColor] = useState(device?.lightingSettings?.color ?? { r: 255, g: 255, b: 255 });
  const [randomColor, setRandomColor] = useState(device?.lightingSettings?.randomColor ?? false);
  const [sleep, setSleep] = useState(device?.lightingSettings?.sleep ?? 2);

  // Update device when settings change
  useEffect(() => {
    if (!device || !device.config.lightEnabled || !device.lightingSettings) return;

    const timeout = setTimeout(() => {
      device.setLighting({
        modeIndex: selectedModeIndex,
        speed,
        brightness,
        color,
        randomColor,
        sleep,
      }).catch(error => {
        console.error('Failed to update lighting:', error);
      });
    }, 300); // Debounce

    return () => clearTimeout(timeout);
  }, [device, selectedModeIndex, speed, brightness, color, randomColor, sleep]);

  if (!device || !device.config.lightEnabled || !device.lightingSettings) {
    return null;
  }

  const currentMode = device.config.lightingModes.find(m => m.index === selectedModeIndex);
  const flags = currentMode?.flags;
  const isOffMode = currentMode?.name.toLowerCase().includes('off') || false;

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    setColor({ r, g, b });
  };

  const colorHex = `#${color.r.toString(16).padStart(2, '0')}${color.g.toString(16).padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Lighting Mode</h3>

        {/* Info about current keyboard type */}
        <div className="text-xs text-gray-500 mb-6">
          <p>
            Keyboard type: {device.config.rgb ? 'RGB' : 'Single-color backlit'}
          </p>
          <p className="mt-1">
            {device.config.lightingModes.length} lighting mode{device.config.lightingModes.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Mode selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mode
          </label>
          <select
            value={selectedModeIndex}
            onChange={(e) => setSelectedModeIndex(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {device.config.lightingModes.map((mode: LightingMode) => (
              <option key={mode.index} value={mode.index}>
                {mode.name}
              </option>
            ))}
          </select>
        </div>

        {/* Speed slider */}
        {flags?.speed && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speed: {SPEED_LABELS[speed - 1]}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Very Slow</span>
              <span>Very Fast</span>
            </div>
          </div>
        )}

        {/* Brightness slider */}
        {flags?.brightness && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brightness: {brightness === 0 ? 'Off' : brightness}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Off</span>
              <span>Bright</span>
            </div>
          </div>
        )}

        {/* Color picker */}
        {flags?.colorPicker && !randomColor && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={handleColorChange}
                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
              />
              <span className="text-sm text-gray-600">{colorHex.toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* Random color toggle */}
        {flags?.random && (
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={randomColor}
                onChange={(e) => setRandomColor(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Random Colors</span>
            </label>
          </div>
        )}

        {/* Sleep timer - don't show for OFF mode */}
        {!isOffMode && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep Timer: {SLEEP_LABELS[sleep - 1]}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={sleep}
              onChange={(e) => setSleep(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 min</span>
              <span>Off</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
