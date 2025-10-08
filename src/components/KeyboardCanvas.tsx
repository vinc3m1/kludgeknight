import { useState, useEffect } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import type { Key } from '../types/keyboard';

interface KeyboardCanvasProps {
  onKeyClick?: (keyIndex: number) => void;
  selectedKeyIndex?: number;
}

export function KeyboardCanvas({ onKeyClick, selectedKeyIndex }: KeyboardCanvasProps) {
  const device = useSelectedDevice();
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [keyBackgrounds, setKeyBackgrounds] = useState<Map<number, string>>(new Map());

  // Load image to get dimensions and detect per-key luminance
  useEffect(() => {
    if (!device) return;

    const img = new Image();
    img.onload = () => {
      setImgWidth(img.width);
      setImgHeight(img.height);

      // Analyze luminance for each key region
      const startTime = performance.now();
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;

        const backgrounds = new Map<number, string>();

        // Analyze each key region
        device.config.keys.forEach((key) => {
          const [left, top, right, bottom] = key.rect;
          let totalLuminance = 0;
          let opaquePixelCount = 0;

          // Sample pixels within this key's bounds
          for (let y = Math.floor(top); y < Math.ceil(bottom); y++) {
            for (let x = Math.floor(left); x < Math.ceil(right); x++) {
              if (x >= 0 && x < img.width && y >= 0 && y < img.height) {
                const idx = (y * img.width + x) * 4;
                const alpha = pixels[idx + 3];
                if (alpha > 25) { // Skip mostly transparent pixels
                  const r = pixels[idx];
                  const g = pixels[idx + 1];
                  const b = pixels[idx + 2];
                  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                  totalLuminance += luminance;
                  opaquePixelCount++;
                }
              }
            }
          }

          if (opaquePixelCount > 0) {
            const avgLuminance = totalLuminance / opaquePixelCount;
            // Light keys get dark background, dark keys get light background
            backgrounds.set(key.bIndex, avgLuminance > 128 ? '#1f2937' : '#ffffff');
          }
        });

        setKeyBackgrounds(backgrounds);

        const elapsed = performance.now() - startTime;
        console.log(`Per-key luminance analysis: ${elapsed.toFixed(2)}ms (${backgrounds.size} keys)`);
      }
    };
    img.src = device.config.imageUrl;
  }, [device]);

  if (!device) {
    return (
      <div className="flex items-center justify-center h-64 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">No keyboard connected</p>
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
    return <div className="flex items-center justify-center h-64 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
      <p className="text-gray-500 dark:text-gray-400">Loading keyboard...</p>
    </div>;
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded p-4 bg-white dark:bg-gray-800">
      <style>{`
        .key-default {
          fill: rgba(243, 244, 246, 0.3);
          stroke: #9ca3af;
          stroke-width: 1;
        }
        .key-remapped {
          fill: rgba(187, 247, 208, 0.5);
          stroke: #9ca3af;
          stroke-width: 1;
        }
        .key-selected {
          fill: rgba(59, 130, 246, 0.5);
          stroke: #2563eb;
          stroke-width: 1;
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

      <div className="mt-4 flex gap-4 text-sm text-gray-900 dark:text-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 dark:bg-gray-600 border border-gray-400 dark:border-gray-500"></div>
          <span>Default</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 border border-gray-400"></div>
          <span>Remapped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 border border-blue-600 dark:border-blue-500"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
