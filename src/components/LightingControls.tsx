import { useState, useEffect, useRef } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import { useToast } from '../hooks/useToast';
import type { LightingMode } from '../types/keyboard';
import { Spinner } from './Spinner';

const SPEED_LABELS = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
const SLEEP_LABELS = ['5 min', '10 min', '20 min', '30 min', 'Off'];

export function LightingControls() {
  const device = useSelectedDevice();
  const toast = useToast();
  const [selectedModeIndex, setSelectedModeIndex] = useState(device?.lightingSettings?.modeIndex ?? 0);
  const [speed, setSpeed] = useState(device?.lightingSettings?.speed ?? 3);
  const [brightness, setBrightness] = useState(device?.lightingSettings?.brightness ?? 5);
  const [color, setColor] = useState(device?.lightingSettings?.color ?? { r: 255, g: 255, b: 255 });
  const [randomColor, setRandomColor] = useState(device?.lightingSettings?.randomColor ?? false);
  const [sleep, setSleep] = useState(device?.lightingSettings?.sleep ?? 2);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        toast.showError('Failed to update lighting settings. Please try again.');
      });
    }, 300); // Debounce

    return () => clearTimeout(timeout);
  }, [device, selectedModeIndex, speed, brightness, color, randomColor, sleep, toast]);

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
  const isLoading = device.isLightingLoading;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lighting Mode</h3>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Spinner size="sm" />
              <span>Syncing...</span>
            </div>
          )}
        </div>

        {/* Info about current keyboard type */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-6">
          <p>
            Keyboard type: {device.config.rgb ? 'RGB' : 'Single-color backlit'}
          </p>
          <p className="mt-1">
            {device.config.lightingModes.length} lighting mode{device.config.lightingModes.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Mode selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mode
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              disabled={isLoading}
              className="w-full px-3 py-1.5 text-sm text-left border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{currentMode?.name || 'Select Mode'}</span>
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {device.config.lightingModes.map((mode: LightingMode) => (
                  <button
                    key={mode.index}
                    onClick={() => {
                      setSelectedModeIndex(mode.index);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${
                      mode.index === selectedModeIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {mode.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Speed slider */}
        {flags?.speed && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Speed: {SPEED_LABELS[speed - 1]}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Very Slow</span>
              <span>Very Fast</span>
            </div>
          </div>
        )}

        {/* Brightness slider */}
        {flags?.brightness && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Brightness: {brightness === 0 ? 'Off' : brightness}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={brightness}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Off</span>
              <span>Bright</span>
            </div>
          </div>
        )}

        {/* Color picker */}
        {flags?.colorPicker && !randomColor && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={handleColorChange}
                disabled={isLoading}
                className="h-10 w-20 rounded border border-gray-300 dark:border-gray-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">{colorHex.toUpperCase()}</span>
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
                disabled={isLoading}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Random Colors</span>
            </label>
          </div>
        )}

        {/* Sleep timer - don't show for OFF mode */}
        {!isOffMode && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sleep Timer: {SLEEP_LABELS[sleep - 1]}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={sleep}
              onChange={(e) => setSleep(parseInt(e.target.value))}
              disabled={isLoading}
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>5 min</span>
              <span>Off</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
