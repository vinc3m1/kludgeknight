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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <button
          onClick={requestDevice}
          disabled={!isWebHIDSupported || isConnecting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isConnecting && <Spinner size="sm" className="text-white" />}
          {isConnecting ? 'Connecting...' : 'Connect Keyboard'}
        </button>

        {isScanning && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Spinner size="sm" />
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
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
        <p className="text-sm text-red-600 dark:text-red-400">
          WebHID is not supported in your browser. Please use Chrome, Edge, or Opera.
        </p>
      )}
    </div>
  );
}
