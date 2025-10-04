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

  // Set notify callback on all devices and profiles
  useEffect(() => {
    manager.getAllDevices().forEach(device => {
      device.notify = forceUpdate;
      device.profiles.forEach(profile => {
        profile.notify = forceUpdate;
      });
    });
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manager.getAllDevices().forEach(device => {
        device.notify = undefined;
        device.profiles.forEach(p => p.notify = undefined);
      });
    };
  }, []);

  const requestDevice = async () => {
    const device = await manager.requestDevice();
    if (device) {
      device.notify = forceUpdate;
      device.profiles.forEach(profile => {
        profile.notify = forceUpdate;
      });
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
