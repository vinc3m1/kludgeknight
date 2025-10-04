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
  const profile = device.getActiveProfile();

  // Calculate canvas dimensions based on keyboard config
  const [topWidth, topHeight] = config.top;
  const [bottomWidth, bottomHeight] = config.bottom;
  const width = Math.max(topWidth, bottomWidth);
  const height = topHeight + bottomHeight;

  const renderKey = (key: Key, index: number) => {
    const hasMapping = profile?.hasMapping(key.bufferIndex);
    const isSelected = selectedKeyIndex === key.bufferIndex;

    return (
      <rect
        key={index}
        x={key.topX}
        y={key.topY}
        width={key.bottomX - key.topX}
        height={key.bottomY - key.topY}
        className={`cursor-pointer stroke-gray-400 transition-colors ${
          isSelected
            ? 'fill-blue-500 stroke-blue-600'
            : hasMapping
            ? 'fill-green-200 hover:fill-green-300'
            : 'fill-gray-100 hover:fill-gray-200'
        }`}
        onClick={() => onKeyClick?.(key.bufferIndex)}
      />
    );
  };

  return (
    <div className="border border-gray-300 rounded p-4 bg-white">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        style={{ maxHeight: '400px' }}
      >
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
