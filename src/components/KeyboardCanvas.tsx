import { useState, useEffect } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import type { Key } from '../types/keyboard';
import type { ImageManifest } from '../utils/buildImageManifest';
import { getKeyBackgrounds } from '../utils/luminance';

interface KeyboardCanvasProps {
  onKeyClick?: (keyIndex: number) => void;
  selectedKeyIndex?: number;
  imageManifest?: ImageManifest;
}

export function KeyboardCanvas({ onKeyClick, selectedKeyIndex, imageManifest }: KeyboardCanvasProps) {
  const device = useSelectedDevice();
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [keyBackgrounds, setKeyBackgrounds] = useState<Map<number, string>>(new Map());

  // Load image to get dimensions and use pre-calculated luminance data
  useEffect(() => {
    if (!device) return;

    // Get key backgrounds from pre-calculated luminance data
    const backgrounds = getKeyBackgrounds(device.config.pid, device.config.keys, imageManifest);
    setKeyBackgrounds(backgrounds);

    // Load image to get dimensions
    const img = new Image();
    img.onload = () => {
      setImgWidth(img.width);
      setImgHeight(img.height);
    };
    img.src = device.config.imageUrl;
  }, [device, imageManifest]);

  if (!device) {
    return (
      <div className="flex items-center justify-center h-64 border border-border rounded bg-muted">
        <p className="text-muted-foreground">No keyboard connected</p>
      </div>
    );
  }

  const { config } = device;

  const renderKeyBackground = (key: Key, index: number) => {
    const backgroundColor = keyBackgrounds.get(key.bIndex);
    if (!backgroundColor) return null;

    const [left, top, right, bottom] = key.rect;

    return (
      <rect
        key={`bg-${index}`}
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        fill={backgroundColor}
      />
    );
  };

  const renderKey = (key: Key, index: number) => {
    const hasMapping = device.hasMapping(key.bIndex);
    const isSelected = selectedKeyIndex === key.bIndex;

    const [left, top, right, bottom] = key.rect;

    // Use data attributes to style via CSS
    const keyClass = isSelected ? 'key-selected' : hasMapping ? 'key-remapped' : 'key-default';

    return (
      <rect
        key={index}
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        className={`${keyClass} cursor-pointer transition-colors hover:opacity-80`}
        onClick={() => onKeyClick?.(key.bIndex)}
      />
    );
  };

  if (!imgWidth || !imgHeight) {
    return <div className="flex items-center justify-center h-64 border border-border rounded bg-muted">
      <p className="text-muted-foreground">Loading keyboard...</p>
    </div>;
  }

  return (
    <div className="border border-border rounded p-4 bg-card keyboard-canvas">
      <style>{`
        .keyboard-canvas {
          --key-default-fill: rgba(243, 244, 246, 0.3);
          --key-default-stroke: #9ca3af;
          --key-remapped-fill: rgba(187, 247, 208, 0.5);
          --key-remapped-stroke: #4ade80;
          --key-selected-fill: rgba(59, 130, 246, 0.5);
          --key-selected-stroke: #2563eb;
        }
        .dark .keyboard-canvas {
          --key-default-fill: rgba(243, 244, 246, 0.3);
          --key-default-stroke: #9ca3af;
          --key-remapped-fill: rgba(74, 222, 128, 0.4);
          --key-remapped-stroke: #4ade80;
          --key-selected-fill: rgba(59, 130, 246, 0.5);
          --key-selected-stroke: #2563eb;
        }
        .key-default {
          fill: var(--key-default-fill);
          stroke: var(--key-default-stroke);
          stroke-width: 1;
        }
        .key-remapped {
          fill: var(--key-remapped-fill);
          stroke: var(--key-remapped-stroke);
          stroke-width: 1;
        }
        .key-selected {
          fill: var(--key-selected-fill);
          stroke: var(--key-selected-stroke);
          stroke-width: 1;
        }
        .legend-default {
          background-color: var(--key-default-fill);
          border-color: var(--key-default-stroke);
        }
        .legend-remapped {
          background-color: var(--key-remapped-fill);
          border-color: var(--key-remapped-stroke);
        }
        .legend-selected {
          background-color: var(--key-selected-fill);
          border-color: var(--key-selected-stroke);
        }
      `}</style>
      <svg
        viewBox={`0 0 ${imgWidth} ${imgHeight}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
        {/* Render background rectangles behind keyboard image */}
        {config.keys.map((key, index) => renderKeyBackground(key, index))}
        <image
          href={config.imageUrl}
          x="0"
          y="0"
          width={imgWidth}
          height={imgHeight}
          className="dark:opacity-80"
        />
        {/* Render key overlays on top */}
        {config.keys.map((key, index) => renderKey(key, index))}
      </svg>

      <div className="mt-4 flex gap-4 text-sm text-card-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border legend-default"></div>
          <span>Default</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border legend-remapped"></div>
          <span>Remapped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border legend-selected"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
