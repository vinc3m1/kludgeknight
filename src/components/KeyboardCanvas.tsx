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

  // Load image to get dimensions
  useEffect(() => {
    if (!device) return;

    const img = new Image();
    img.onload = () => {
      setImgWidth(img.width);
      setImgHeight(img.height);
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
        <image
          href={config.imageUrl}
          x="0"
          y="0"
          width={imgWidth}
          height={imgHeight}
          className="dark:opacity-80"
        />
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
