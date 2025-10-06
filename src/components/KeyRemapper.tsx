import { useState } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import { KEY_MAP, getAllKeysByCategory, type FirmwareCode } from '../types/keycode';
import { KeyboardCanvas } from './KeyboardCanvas';

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

export function KeyRemapper() {
  const device = useSelectedDevice();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [selectedTargetKey, setSelectedTargetKey] = useState<FirmwareCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!device) return null;

  const keyCategories = getAllKeysByCategory();

  const handleConfirmRemap = async () => {
    if (selectedKeyIndex === null || selectedTargetKey === null) return;

    setError(null);
    try {
      await device.setMapping(selectedKeyIndex, selectedTargetKey);
      setSelectedTargetKey(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to remap key: ${errorMessage}`);
      console.error('Remap error:', err);
    }
  };

  const handleSetToDefault = async () => {
    if (selectedKeyIndex === null) return;

    setError(null);
    try {
      await device.clearMapping(selectedKeyIndex);
      setSelectedTargetKey(null);
    } catch (err) {
      setError('Failed to set to default. Please try again.');
      console.error(err);
    }
  };

  const handleClose = () => {
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
  const defaultKeyLabel = selectedKeyIndex !== null
    ? device.config.keys.find(k => k.bIndex === selectedKeyIndex)?.keyInfo.label
    : undefined;

  const handleResetAll = async () => {
    setError(null);
    try {
      await device.clearAll();
      setSelectedKeyIndex(null);
      setSelectedTargetKey(null);
    } catch (err) {
      setError('Failed to reset all keys. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Key Remapper</h2>
        <button
          onClick={handleResetAll}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
        >
          Reset All Keys to Default
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <KeyboardCanvas
        onKeyClick={handleKeyClick}
        selectedKeyIndex={selectedKeyIndex ?? undefined}
      />

      {selectedKeyIndex !== null && (
        <div className="border border-gray-300 rounded p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold">Selected Key:</h3>
                <span className="px-2 py-1 text-sm bg-blue-50 border border-blue-300 text-blue-900 rounded font-mono">
                  {defaultKeyLabel || 'Unknown'}
                </span>
                {currentMapping !== undefined && (
                  <>
                    <span className="text-sm text-gray-600">→</span>
                    <span className="px-2 py-1 text-sm bg-blue-50 border border-blue-300 text-blue-900 rounded font-mono">
                      {getKeyName(currentMapping)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmRemap}
                disabled={selectedTargetKey === null}
                className="px-3 py-1 min-h-[2.5rem] text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
              >
                {selectedTargetKey !== null ? (
                  <>
                    Apply:
                    <span className="px-2 py-0.5 bg-white text-green-900 border border-green-200 rounded font-mono">
                      {getKeyName(selectedTargetKey)}
                    </span>
                  </>
                ) : (
                  'Apply'
                )}
              </button>
              <button
                onClick={handleSetToDefault}
                className="px-3 py-1 min-h-[2.5rem] text-sm bg-orange-600 text-white rounded hover:bg-orange-700 whitespace-nowrap"
                title={`Reset to default: ${defaultKeyLabel || 'Unknown'}`}
              >
                Set to Default
              </button>
              <button
                onClick={handleClose}
                className="px-3 py-1 min-h-[2.5rem] text-sm bg-gray-600 text-white rounded hover:bg-gray-700 whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Button Index: {selectedKeyIndex}
          </p>

          <div className="space-y-3">
            {Object.entries(keyCategories).map(([category, keys]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold mb-2">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {keys.map((keyInfo) => (
                    <button
                      key={keyInfo.fw}
                      onClick={() => setSelectedTargetKey(keyInfo.fw)}
                      className={`px-3 py-1 text-sm border rounded transition-colors ${
                        selectedTargetKey === keyInfo.fw
                          ? 'bg-blue-500 text-white border-blue-600'
                          : currentMapping === keyInfo.fw
                          ? 'bg-green-100 border-green-400'
                          : 'bg-white border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {keyInfo.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
