import { useState } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import { KeyCode, KEY_MAP } from '../types/keycode';
import { KeyboardCanvas } from './KeyboardCanvas';

// Helper to get friendly key name
function getKeyName(keyCode: KeyCode | undefined): string {
  if (keyCode === undefined) return 'Unknown';

  // Try to find the key in KEY_MAP by HID code
  const keyInfo = Object.values(KEY_MAP).find(k => k.hid === keyCode);
  if (keyInfo) {
    return keyInfo.label;
  }

  // Fallback to enum name transformation
  const name = KeyCode[keyCode];
  if (!name) return `0x${keyCode.toString(16)}`;
  return name.replace('Key_', '').replace(/_/g, ' ');
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
  Symbols: [
    KeyCode.Key_Minus, KeyCode.Key_Equal, KeyCode.Key_BracketLeft, KeyCode.Key_BracketRight,
    KeyCode.Key_Backslash, KeyCode.Key_Semicolon, KeyCode.Key_Quote, KeyCode.Key_Grave,
    KeyCode.Key_Comma, KeyCode.Key_Period, KeyCode.Key_Slash,
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
    KeyCode.Key_Fn,
  ],
  Numpad: [
    KeyCode.Key_NumLock,
    KeyCode.Key_KeypadDivide, KeyCode.Key_KeypadMultiply, KeyCode.Key_KeypadMinus, KeyCode.Key_KeypadPlus,
    KeyCode.Key_Keypad7, KeyCode.Key_Keypad8, KeyCode.Key_Keypad9,
    KeyCode.Key_Keypad4, KeyCode.Key_Keypad5, KeyCode.Key_Keypad6,
    KeyCode.Key_Keypad1, KeyCode.Key_Keypad2, KeyCode.Key_Keypad3,
    KeyCode.Key_Keypad0, KeyCode.Key_KeypadPeriod, KeyCode.Key_KeypadEnter,
  ],
  Media: [
    KeyCode.Key_MediaPlayPause, KeyCode.Key_MediaStop,
    KeyCode.Key_MediaTrackNext, KeyCode.Key_MediaTrackPrevious,
    KeyCode.Key_MediaEject,
    KeyCode.Key_VolumeUp, KeyCode.Key_VolumeDown, KeyCode.Key_VolumeMute,
  ],
  Special: [
    KeyCode.Key_Escape, KeyCode.Key_Return, KeyCode.Key_Backspace, KeyCode.Key_Tab,
    KeyCode.Key_Space, KeyCode.Key_CapsLock, KeyCode.Key_PrintScreen,
    KeyCode.Key_ScrollLock, KeyCode.Key_Pause,
  ],
};

export function KeyRemapper() {
  const device = useSelectedDevice();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [selectedTargetKey, setSelectedTargetKey] = useState<KeyCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!device) return null;

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

  const handleCancelSelection = () => {
    setSelectedTargetKey(null);
    setError(null);
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Key Remapper</h2>

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
                  {keys.filter(k => k !== undefined).map((keyCode) => (
                    <button
                      key={keyCode}
                      onClick={() => setSelectedTargetKey(keyCode)}
                      className={`px-3 py-1 text-sm border rounded transition-colors ${
                        selectedTargetKey === keyCode
                          ? 'bg-blue-500 text-white border-blue-600'
                          : currentMapping === keyCode
                          ? 'bg-green-100 border-green-400'
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
