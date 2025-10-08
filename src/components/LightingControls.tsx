import { useState, useEffect, useRef } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import { useToast } from '../hooks/useToast';
import type { LightingMode } from '../types/keyboard';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

const SPEED_LABELS = ['Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast'];
const SLEEP_LABELS = ['5 min', '10 min', '20 min', '30 min', 'Off'];

export function LightingControlsActionButton() {
  const device = useSelectedDevice();
  const toast = useToast();

  if (!device || !device.config.lightEnabled || !device.lightingSettings) {
    return null;
  }

  const isLoading = device.isLightingLoading;

  const handleApply = async () => {
    // Get current settings from device
    const settings = device.lightingSettings;
    if (!settings) return;

    try {
      await device.setLighting(settings);
      toast.showSuccess('Lighting settings applied successfully');
    } catch (error) {
      console.error('Failed to update lighting:', error);
      toast.showError('Failed to update lighting settings. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleApply}
      disabled={isLoading}
      variant="default"
      size="sm"
    >
      Apply Settings
    </Button>
  );
}

interface LightingControlsProps {
  isVisible?: boolean;
}

export function LightingControls({ isVisible }: LightingControlsProps = {}) {
  const device = useSelectedDevice();
  const [selectedModeIndex, setSelectedModeIndex] = useState(device?.lightingSettings?.modeIndex ?? 0);
  const [speed, setSpeed] = useState([device?.lightingSettings?.speed ?? 3]);
  const [brightness, setBrightness] = useState([device?.lightingSettings?.brightness ?? 5]);
  const [color, setColor] = useState(device?.lightingSettings?.color ?? { r: 255, g: 255, b: 255 });
  const [randomColor, setRandomColor] = useState(device?.lightingSettings?.randomColor ?? false);
  const [sleep, setSleep] = useState([device?.lightingSettings?.sleep ?? 2]);
  const selectedModeRef = useRef<HTMLButtonElement>(null);
  const modeListRef = useRef<HTMLDivElement>(null);

  // Scroll to selected mode when tab becomes visible (only within the list container)
  useEffect(() => {
    if (isVisible && selectedModeRef.current && modeListRef.current) {
      const button = selectedModeRef.current;
      const container = modeListRef.current;

      // Calculate position to center the button in the container
      const buttonTop = button.offsetTop;
      const buttonHeight = button.offsetHeight;
      const containerHeight = container.clientHeight;

      const scrollTo = buttonTop - (containerHeight / 2) + (buttonHeight / 2);

      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth'
      });
    }
  }, [isVisible]);

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
    <div className="grid grid-cols-[300px_1fr] gap-8">
      {/* Left column - Mode selector */}
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold text-foreground">Lighting Modes</h3>
          <span className="text-xs text-muted-foreground">
            {device.config.rgb ? 'RGB' : 'Single-color'}
          </span>
        </div>
        <div ref={modeListRef} className="border border-border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
          {device.config.lightingModes.map((mode: LightingMode) => (
            <button
              key={mode.index}
              ref={mode.index === selectedModeIndex ? selectedModeRef : null}
              onClick={() => setSelectedModeIndex(mode.index)}
              disabled={isLoading}
              className={`w-full px-4 py-3 text-left text-sm transition-colors border-b border-border last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                mode.index === selectedModeIndex
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-background text-foreground hover:bg-accent'
              }`}
            >
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Right column - Controls */}
      <div className="space-y-6">
        {/* Speed slider */}
        {flags?.speed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Speed</label>
              <span className="text-sm text-muted-foreground">{SPEED_LABELS[speed[0] - 1]}</span>
            </div>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={1}
              max={5}
              step={1}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Brightness slider */}
        {flags?.brightness && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Brightness</label>
              <span className="text-sm text-muted-foreground">{brightness[0] === 0 ? 'Off' : brightness[0]}/5</span>
            </div>
            <Slider
              value={brightness}
              onValueChange={setBrightness}
              min={0}
              max={5}
              step={1}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Color picker */}
        {flags?.colorPicker && !randomColor && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={colorHex}
                onChange={handleColorChange}
                disabled={isLoading}
                className="h-10 w-16 rounded-md border border-input cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-sm font-mono text-muted-foreground">{colorHex.toUpperCase()}</span>
            </div>
          </div>
        )}

        {/* Random color toggle */}
        {flags?.random && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Random Colors</label>
            <Switch
              checked={randomColor}
              onCheckedChange={setRandomColor}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Sleep timer */}
        {!isOffMode && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Sleep Timer</label>
              <span className="text-sm text-muted-foreground">{SLEEP_LABELS[sleep[0] - 1]}</span>
            </div>
            <Slider
              value={sleep}
              onValueChange={setSleep}
              min={1}
              max={5}
              step={1}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Empty state message if no controls */}
        {!flags?.speed && !flags?.brightness && !flags?.colorPicker && !flags?.random && isOffMode && (
          <div className="text-sm text-muted-foreground italic">
            No additional controls available for this mode.
          </div>
        )}
      </div>
    </div>
  );
}
