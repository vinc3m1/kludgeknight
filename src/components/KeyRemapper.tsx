import { useState } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import { KeyCode } from '../types/keycode';
import { KeyboardCanvas } from './KeyboardCanvas';

// Helper to get friendly key name
function getKeyName(keyCode: KeyCode): string {
  const name = KeyCode[keyCode];
  if (!name) return `0x${keyCode.toString(16)}`;
  return name.replace('Key_', '').replace(/([A-Z])/g, ' $1').trim();
}

// Group key codes by category
const keyCategories = {
  Letters: [
    KeyCode.Key_A, KeyCode.Key_B, KeyCode.Key_C, KeyCode.Key_D, KeyCode.Key_E,
    KeyCode.Key_F, KeyCode.Key_G, KeyCode.Key_H, KeyCode.Key_I, KeyCode.Key_J,
    KeyCode.Key_K, KeyCode.Key_L, KeyCode.Key_M, KeyCode.Key_N, KeyCode.Key_O,
    KeyCode.Key_P, KeyCode.Key_Q, KeyCode.Key_R, KeyCode.Key_S, KeyCode.Key_T,
    KeyCode.Key_U, KeyCode.Key_V, KeyCode.Key_W, KeyCode.Key_X, KeyCode.Key_Y,
    KeyCode.Key_Z,
  ],
  Numbers: [
    KeyCode.Key_1, KeyCode.Key_2, KeyCode.Key_3, KeyCode.Key_4, KeyCode.Key_5,
    KeyCode.Key_6, KeyCode.Key_7, KeyCode.Key_8, KeyCode.Key_9, KeyCode.Key_0,
  ],
  'Function Keys': [
    KeyCode.Key_F1, KeyCode.Key_F2, KeyCode.Key_F3, KeyCode.Key_F4,
    KeyCode.Key_F5, KeyCode.Key_F6, KeyCode.Key_F7, KeyCode.Key_F8,
    KeyCode.Key_F9, KeyCode.Key_F10, KeyCode.Key_F11, KeyCode.Key_F12,
  ],
  Navigation: [
    KeyCode.Key_ArrowUp, KeyCode.Key_ArrowDown, KeyCode.Key_ArrowLeft, KeyCode.Key_ArrowRight,
    KeyCode.Key_Home, KeyCode.Key_End, KeyCode.Key_PageUp, KeyCode.Key_PageDown,
    KeyCode.Key_Insert, KeyCode.Key_Delete,
  ],
  Modifiers: [
    KeyCode.Key_ControlLeft, KeyCode.Key_ControlRight,
    KeyCode.Key_ShiftLeft, KeyCode.Key_ShiftRight,
    KeyCode.Key_AltLeft, KeyCode.Key_AltRight,
    KeyCode.Key_MetaLeft, KeyCode.Key_MetaRight,
  ],
  Media: [
    KeyCode.Key_MediaPlayPause, KeyCode.Key_MediaStop,
    KeyCode.Key_MediaTrackNext, KeyCode.Key_MediaTrackPrevious,
    KeyCode.Key_VolumeUp, KeyCode.Key_VolumeDown, KeyCode.Key_VolumeMute,
  ],
  Special: [
    KeyCode.Key_Escape, KeyCode.Key_Return, KeyCode.Key_Backspace, KeyCode.Key_Tab,
    KeyCode.Key_Space, KeyCode.Key_CapsLock, KeyCode.Key_PrintScreen,
  ],
};

export function KeyRemapper() {
  const device = useSelectedDevice();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!device) return null;

  const profile = device.getActiveProfile();
  if (!profile) return null;

  const handleRemap = async (keyCode: KeyCode) => {
    if (selectedKeyIndex === null) return;

    setError(null);
    try {
      await profile.setMapping(selectedKeyIndex, keyCode);
    } catch (err) {
      setError('Failed to remap key. Please try again.');
      console.error(err);
    }
  };

  const handleClearMapping = async () => {
    if (selectedKeyIndex === null) return;

    setError(null);
    try {
      await profile.clearMapping(selectedKeyIndex);
      setSelectedKeyIndex(null);
    } catch (err) {
      setError('Failed to clear mapping. Please try again.');
      console.error(err);
    }
  };

  const currentMapping = selectedKeyIndex !== null ? profile.getMapping(selectedKeyIndex) : undefined;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Key Remapper</h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <KeyboardCanvas
        onKeyClick={setSelectedKeyIndex}
        selectedKeyIndex={selectedKeyIndex ?? undefined}
      />

      {selectedKeyIndex !== null && (
        <div className="border border-gray-300 rounded p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Selected Key: {selectedKeyIndex}</h3>
              {currentMapping !== undefined && (
                <p className="text-sm text-gray-600">
                  Currently mapped to: {getKeyName(currentMapping)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearMapping}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Mapping
              </button>
              <button
                onClick={() => setSelectedKeyIndex(null)}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(keyCategories).map(([category, keys]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold mb-2">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {keys.map((keyCode) => (
                    <button
                      key={keyCode}
                      onClick={() => handleRemap(keyCode)}
                      className={`px-3 py-1 text-sm border rounded transition-colors ${
                        currentMapping === keyCode
                          ? 'bg-blue-500 text-white border-blue-600'
                          : 'bg-white border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {getKeyName(keyCode)}
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
