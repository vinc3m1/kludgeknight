import { useState, useEffect } from 'react';
import { useDevices } from '../hooks/useDevices';
import { Spinner } from './Spinner';

export function ConnectButton() {
  const { requestDevice, devices, selectedDevice, selectDevice, isConnecting, isScanning } = useDevices();
  const [isWebHIDSupported, setIsWebHIDSupported] = useState(true); // Assume supported during SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsWebHIDSupported(typeof navigator !== 'undefined' && 'hid' in navigator);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div className="flex flex-col items-center gap-4 w-full">
        <button
          onClick={requestDevice}
          disabled={!isWebHIDSupported || isConnecting}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-3 shadow-lg hover:shadow-xl"
        >
          {isConnecting && <Spinner size="md" className="text-white" />}
          {isConnecting ? 'Connecting...' : 'Connect Keyboard'}
        </button>

        {isScanning && (
          <div className="flex items-center gap-2 text-base text-gray-600 dark:text-gray-400">
            <Spinner size="md" />
            <span>Scanning for devices...</span>
          </div>
        )}

        {devices.length > 0 && (
          <select
            value={selectedDevice?.id || ''}
            onChange={(e) => {
              const device = devices.find(d => d.id === e.target.value);
              selectDevice(device || null);
            }}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-base"
          >
            <option value="">Select device...</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.config.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {mounted && !isWebHIDSupported && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <p className="text-base text-center text-amber-700 dark:text-amber-300">
            WebHID is not supported in your browser. Please use Chrome, Edge, or Opera.
          </p>
        </div>
      )}
    </div>
  );
}
