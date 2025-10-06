import { useDevices } from '../hooks/useDevices';

export function ConnectButton() {
  const { requestDevice, devices, selectedDevice, selectDevice } = useDevices();

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={requestDevice}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer"
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
          className="px-4 py-2 border border-gray-300 rounded bg-white"
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
  );
}
