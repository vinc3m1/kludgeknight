import { useState, useEffect } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import type { Key } from '../types/keyboard';

interface KeyboardCanvasProps {
  onKeyClick?: (keyIndex: number) => void;
  selectedKeyIndex?: number;
}

export function KeyboardCanvas({ onKeyClick, selectedKeyIndex }: KeyboardCanvasProps) {
  const device = useSelectedDevice();

  if (!device) {
    return (
      <div className="flex items-center justify-center h-64 border border-gray-300 rounded bg-gray-50">
        <p className="text-gray-500">No keyboard connected</p>
      </div>
    );
  }

  const { config } = device;
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);

  // Load image to get dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgWidth(img.width);
      setImgHeight(img.height);
    };
    img.src = config.imageUrl;
  }, [config.imageUrl]);

  const renderKey = (key: Key, index: number) => {
    const hasMapping = device.hasMapping(key.bIndex);
    const isSelected = selectedKeyIndex === key.bIndex;

    const [left, top, right, bottom] = key.rect;

    let fill = 'rgba(243, 244, 246, 0.3)'; // gray-100 with transparency
    let stroke = '#9ca3af'; // gray-400

    if (isSelected) {
      fill = 'rgba(59, 130, 246, 0.5)'; // blue-500 with transparency
      stroke = '#2563eb'; // blue-600
    } else if (hasMapping) {
      fill = 'rgba(187, 247, 208, 0.5)'; // green-200 with transparency
      stroke = '#9ca3af';
    }

    return (
      <rect
        key={index}
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
        className="cursor-pointer transition-colors hover:opacity-80"
        onClick={() => onKeyClick?.(key.bIndex)}
      />
    );
  };

  if (!imgWidth || !imgHeight) {
    return <div className="flex items-center justify-center h-64 border border-gray-300 rounded bg-gray-50">
      <p className="text-gray-500">Loading keyboard...</p>
    </div>;
  }

  return (
    <div className="border border-gray-300 rounded p-4 bg-white">
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
        />
        {config.keys.map((key, index) => renderKey(key, index))}
      </svg>

      <div className="mt-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-400"></div>
          <span>Default</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 border border-gray-400"></div>
          <span>Remapped</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 border border-blue-600"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
}
