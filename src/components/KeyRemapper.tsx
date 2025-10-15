import { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { KEY_MAP, type FirmwareCode } from '../types/keycode';
import { KeyboardCanvas } from './KeyboardCanvas';
import { Spinner } from './Spinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { KeyboardDevice } from '../models/KeyboardDevice';
import type { DemoKeyboardDevice } from '../models/DemoKeyboardDevice';
import type { ImageManifest } from '../utils/buildImageManifest';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import {
  KEYBOARD_LAYOUT,
  NAVIGATION_CLUSTER,
  NUMPAD_CLUSTER,
  ADDITIONAL_KEYS_LAYOUT,
  type KeyLayoutItem,
  type KeyboardRow,
} from '../utils/keyboardLayout';
import {
  Volume2,
  Volume1,
  VolumeX,
  SkipBack,
  Play,
  SkipForward,
  Square,
  SunMedium,
  SunDim,
} from 'lucide-react';

// Helper to get friendly key name
function getKeyName(fwCode: FirmwareCode | undefined): string {
  if (fwCode === undefined) return 'Unknown';

  // Try to find the key in KEY_MAP by firmware code
  const keyInfo = Object.values(KEY_MAP).find(k => k.fw === fwCode);
  if (keyInfo) {
    return keyInfo.label;
  }

  // Fallback to hex representation
  return `0x${fwCode.toString(16)}`;
}

// Map of icon names to components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  Volume2,
  Volume1,
  VolumeX,
  SkipBack,
  Play,
  SkipForward,
  Square,
  SunMedium,
  SunDim,
};

// Helper to render a Lucide icon
function renderIcon(iconName: string, className?: string) {
  const Icon = ICON_MAP[iconName];
  if (!Icon) return null;
  return <Icon className={className} size={16} />;
}

export function KeyRemapperActionButton({ device }: { device: KeyboardDevice | DemoKeyboardDevice }) {
  const toast = useToast();
  const isDemo = 'isDemo' in device && device.isDemo;

  const handleResetAll = async () => {
    try {
      await device.resetAllMappings();
      const message = isDemo ? 'All keys reset to default (Simulated)' : 'All keys reset to default';
      toast.showSuccess(message);
    } catch (err) {
      toast.showError(ERROR_MESSAGES.RESET_ALL_FAILED);
      console.error(err);
    }
  };

  const isLoading = device.isMappingLoading;

  return (
    <Button
      onClick={handleResetAll}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isDemo && <span className="text-primary mr-1">[DEMO]</span>}
      Reset All Keys to Default
    </Button>
  );
}

interface KeyRemapperProps {
  device: KeyboardDevice | DemoKeyboardDevice;
  imageManifest?: ImageManifest;
}

export function KeyRemapper({ device, imageManifest }: KeyRemapperProps) {
  const toast = useToast();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [selectedTargetKey, setSelectedTargetKey] = useState<FirmwareCode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDemo = 'isDemo' in device && device.isDemo;

  const handleConfirmRemap = async () => {
    if (selectedKeyIndex === null || selectedTargetKey === null) return;

    setError(null);
    try {
      await device.setMapping(selectedKeyIndex, selectedTargetKey);
      setSelectedTargetKey(null);
      const message = isDemo ? 'Key mapping updated successfully (Simulated)' : 'Key mapping updated successfully';
      toast.showSuccess(message);
    } catch (err) {
      setError(ERROR_MESSAGES.REMAP_FAILED);
      toast.showError(ERROR_MESSAGES.REMAP_FAILED);
      console.error('Remap error:', err);
    }
  };

  const handleSetToDefault = async () => {
    if (selectedKeyIndex === null) return;

    setError(null);
    try {
      await device.clearMapping(selectedKeyIndex);
      setSelectedTargetKey(null);
      const message = isDemo ? 'Key reset to default (Simulated)' : 'Key reset to default';
      toast.showSuccess(message);
    } catch (err) {
      setError(ERROR_MESSAGES.RESET_KEY_FAILED);
      toast.showError(ERROR_MESSAGES.RESET_KEY_FAILED);
      console.error(err);
    }
  };

  const handleClearSelection = () => {
    setSelectedKeyIndex(null);
    setSelectedTargetKey(null);
    setError(null);
  };

  const handleKeyClick = (keyIndex: number) => {
    setSelectedKeyIndex(keyIndex);
    setSelectedTargetKey(null);
    setError(null);
  };

  const currentMapping = selectedKeyIndex !== null ? device.getMapping(selectedKeyIndex) : undefined;
  const defaultKeyInfo = selectedKeyIndex !== null
    ? device.config.keys.find(k => k.bIndex === selectedKeyIndex)?.keyInfo
    : undefined;
  const defaultKeyLabel = defaultKeyInfo?.label;

  const isLoading = device.isMappingLoading;

  // Render a keyboard row
  const renderKeyboardRow = (row: KeyboardRow, rowIndex: number | string) => {
    return (
      <div key={rowIndex} className={`flex gap-1 ${row.rowClass || ''}`}>
        {row.keys.map((item, keyIndex) => {
          if (item.isPlaceholder) {
            // Render a spacer
            return (
              <div
                key={`spacer-${keyIndex}`}
                style={{ width: `${(item.width || 1) * 2.5}rem` }}
              />
            );
          }

          if (!item.keyInfo) return null;

          const keyInfo = item.keyInfo;
          const isSelected = selectedTargetKey === keyInfo.fw;
          const isCurrent = currentMapping === keyInfo.fw;
          const displayLabel = item.displayLabel || keyInfo.label;

          // Width: 0 means auto-width (fit content), otherwise use fixed width
          // Height: Match numpad grid height
          const style: React.CSSProperties = {};

          if (item.width === 0) {
            // Auto-width: no width constraint
          } else {
            style.width = `${(item.width || 1) * 2.5}rem`;
          }

          // Set fixed height to match numpad grid rows
          if (item.rowSpan && item.rowSpan > 1) {
            // Height = (rowSpan * 2rem) + ((rowSpan - 1) * 0.25rem gap)
            style.height = `calc(${item.rowSpan} * 2rem + ${item.rowSpan - 1} * 0.25rem)`;
          } else {
            // Standard key height matches numpad grid row height
            style.height = '2rem';
          }

          return (
            <button
              key={keyInfo.vk}
              onClick={() => setSelectedTargetKey(keyInfo.fw)}
              disabled={selectedKeyIndex === null}
              className={`px-2 py-1 text-xs border rounded transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : isCurrent
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-background border-border hover:bg-accent text-foreground'
              }`}
              style={style}
              title={keyInfo.label}
            >
              {item.iconName && renderIcon(item.iconName)}
              <span className={item.width === 0 ? '' : 'truncate'}>{displayLabel}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // Render numpad with CSS Grid to support rowspan
  const renderNumpadGrid = () => {
    // Manually define grid positions for numpad keys
    // Grid is 4 columns x 5 rows
    const gridKeys: Array<{
      item: KeyLayoutItem;
      row: number;
      col: number;
      colSpan: number;
      rowSpan: number;
    }> = [];

    // Row 1: Lock, /, *, -
    NUMPAD_CLUSTER[0].keys.forEach((item, idx) => {
      gridKeys.push({ item, row: 0, col: idx, colSpan: 1, rowSpan: 1 });
    });

    // Row 2: 7, 8, 9, + (+ spans 2 rows)
    NUMPAD_CLUSTER[1].keys.forEach((item, idx) => {
      gridKeys.push({
        item,
        row: 1,
        col: idx,
        colSpan: 1,
        rowSpan: item.rowSpan || 1,
      });
    });

    // Row 3: 4, 5, 6 (column 3 is occupied by +)
    NUMPAD_CLUSTER[2].keys.forEach((item, idx) => {
      gridKeys.push({ item, row: 2, col: idx, colSpan: 1, rowSpan: 1 });
    });

    // Row 4: 1, 2, 3, Enter (Enter spans 2 rows)
    NUMPAD_CLUSTER[3].keys.forEach((item, idx) => {
      gridKeys.push({
        item,
        row: 3,
        col: idx,
        colSpan: 1,
        rowSpan: item.rowSpan || 1,
      });
    });

    // Row 5: 0 (spans 2 cols), . (column 3 is occupied by Enter)
    // 0 is double width (spans columns 0-1), . is in column 2
    gridKeys.push({ item: NUMPAD_CLUSTER[4].keys[0], row: 4, col: 0, colSpan: 2, rowSpan: 1 });
    gridKeys.push({ item: NUMPAD_CLUSTER[4].keys[1], row: 4, col: 2, colSpan: 1, rowSpan: 1 });

    return (
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: 'repeat(4, 3.125rem)', // 4 columns, each 1.25 * 2.5rem
          gridTemplateRows: 'repeat(5, 2rem)', // 5 rows, reduced height to match nav keys
        }}
      >
        {gridKeys.map(({ item, row, col, colSpan, rowSpan }) => {
          if (!item.keyInfo) return null;

          const keyInfo = item.keyInfo;
          const isSelected = selectedTargetKey === keyInfo.fw;
          const isCurrent = currentMapping === keyInfo.fw;
          const displayLabel = item.displayLabel || keyInfo.label;

          return (
            <button
              key={keyInfo.vk}
              onClick={() => setSelectedTargetKey(keyInfo.fw)}
              disabled={selectedKeyIndex === null}
              className={`px-2 py-1 text-xs border rounded transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : isCurrent
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-background border-border hover:bg-accent text-foreground'
              }`}
              style={{
                gridColumn: `${col + 1} / span ${colSpan}`,
                gridRow: `${row + 1} / span ${rowSpan}`,
              }}
              title={keyInfo.label}
            >
              {item.iconName && renderIcon(item.iconName)}
              <span>{displayLabel}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <KeyboardCanvas
        device={device}
        onKeyClick={handleKeyClick}
        selectedKeyIndex={selectedKeyIndex ?? undefined}
        imageManifest={imageManifest}
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-card-foreground">Selected Key:</h3>
                {selectedKeyIndex !== null ? (
                  <>
                    <Badge variant="outline" className="font-mono text-base px-3 py-1">
                      {defaultKeyLabel || 'Unknown'}
                    </Badge>
                    {(currentMapping !== undefined || selectedTargetKey !== null) && (
                      <>
                        <span className="text-lg text-muted-foreground">→</span>
                        <Badge
                          variant={selectedTargetKey !== null ? "default" : "outline"}
                          className="font-mono text-base px-3 py-1"
                        >
                          {getKeyName(selectedTargetKey !== null ? selectedTargetKey : currentMapping!)}
                        </Badge>
                      </>
                    )}
                  </>
                ) : (
                  <Badge variant="outline" className="font-mono text-base px-3 py-1 text-muted-foreground">
                    None
                  </Badge>
                )}
              </div>
            </div>
          <div className="flex gap-2">
            <Button
              onClick={handleConfirmRemap}
              disabled={selectedKeyIndex === null || selectedTargetKey === null || isLoading}
              size="sm"
            >
              {isLoading && <Spinner size="sm" className="text-primary-foreground" />}
              {isDemo && <span className="mr-1">[DEMO]</span>}
              Apply
            </Button>
            <Button
              onClick={handleSetToDefault}
              disabled={selectedKeyIndex === null || isLoading}
              variant="secondary"
              size="sm"
              title={selectedKeyIndex !== null ? `Reset to default: ${defaultKeyLabel || 'Unknown'}` : 'Select a key first'}
            >
              Set to Default
            </Button>
            <Button
              onClick={handleClearSelection}
              disabled={selectedKeyIndex === null || isLoading}
              variant="ghost"
              size="sm"
            >
              Clear Selection
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-mono">
          {selectedKeyIndex !== null ? (
            <>
              Index: {selectedKeyIndex}
              {defaultKeyInfo && (
                <> | Default: KC=0x{defaultKeyInfo.vk.toString(16).toUpperCase()} FW=0x{defaultKeyInfo.fw.toString(16).toUpperCase()}</>
              )}
              {currentMapping !== undefined && (
                <> | Current: FW=0x{currentMapping.toString(16).toUpperCase()}</>
              )}
              {selectedTargetKey !== null && (
                <> | Target: FW=0x{selectedTargetKey.toString(16).toUpperCase()}</>
              )}
            </>
          ) : (
            'No key selected'
          )}
        </p>

          <div className="space-y-4 overflow-x-auto">
            {/* Main Keyboard Layout */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-card-foreground">Standard Layout</h4>
              <div className="space-y-1 w-fit">
                {KEYBOARD_LAYOUT.map((row, idx) => renderKeyboardRow(row, idx))}
              </div>
            </div>

            {/* Navigation & Numpad side by side */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-card-foreground">Navigation, Arrows & Numpad</h4>
              <div className="flex gap-4 w-fit">
                {/* Navigation Cluster */}
                <div className="space-y-1">
                  {NAVIGATION_CLUSTER.map((row, idx) => renderKeyboardRow(row, `nav-${idx}`))}
                </div>

                {/* Numpad */}
                <div>
                  {renderNumpadGrid()}
                </div>
              </div>
            </div>

            {/* Media and Special Keys */}
            <div>
              <h4 className="text-sm font-semibold mb-3 text-card-foreground">Media & Special Functions</h4>
              <div className="space-y-1 w-fit">
                {ADDITIONAL_KEYS_LAYOUT.map((row, idx) => renderKeyboardRow(row, `special-${idx}`))}
              </div>
            </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
