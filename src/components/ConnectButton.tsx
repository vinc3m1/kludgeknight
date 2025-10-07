import { useDevices } from '../hooks/useDevices';

export function ConnectButton() {
  const { requestDevice, devices, selectedDevice, selectDevice } = useDevices();
  const isWebHIDSupported = typeof navigator !== 'undefined' && 'hid' in navigator;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4">
        <button
          onClick={requestDevice}
          disabled={!isWebHIDSupported}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Connect Keyboard
        </button>

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

      {!isWebHIDSupported && (
        <p className="text-sm text-red-600 dark:text-red-400">
          WebHID is not supported in your browser. Please use Chrome, Edge, or Opera.
        </p>
      )}
    </div>
  );
}
