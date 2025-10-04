import { createContext, ReactNode, useEffect, useReducer, useState } from 'react';
import { HIDDeviceManager } from '../models/HIDDeviceManager';
import { KeyboardDevice } from '../models/KeyboardDevice';

export interface DeviceContextValue {
  devices: KeyboardDevice[];
  selectedDevice: KeyboardDevice | null;
  selectDevice: (device: KeyboardDevice | null) => void;
  requestDevice: () => Promise<void>;
}

export const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [selectedDevice, setSelectedDevice] = useState<KeyboardDevice | null>(null);

  const manager = HIDDeviceManager.getInstance();

  // Load keyboard configs on mount
  useEffect(() => {
    const loadConfigs = async () => {
      // Use Vite's import.meta.glob to get all keyboard configs
      const configModules = import.meta.glob('/public/keyboards/*.json');
      const urls = Object.keys(configModules).map(path =>
        path.replace('/public', '/KludgeKnight')
      );

      await manager.loadConfigs(urls);
    };

    loadConfigs();
  }, []);

  // Set notify callback on all devices
  useEffect(() => {
    manager.getAllDevices().forEach(device => {
      device.notify = forceUpdate;
    });
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manager.getAllDevices().forEach(device => {
        device.notify = undefined;
      });
    };
  }, []);

  const requestDevice = async () => {
    const device = await manager.requestDevice();
    if (device) {
      device.notify = forceUpdate;
      setSelectedDevice(device);
    }
  };

  const value: DeviceContextValue = {
    devices: manager.getAllDevices(),
    selectedDevice,
    selectDevice: setSelectedDevice,
    requestDevice,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}
