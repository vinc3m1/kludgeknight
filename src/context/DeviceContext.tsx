import { ReactNode, useEffect, useReducer, useState } from 'react';
import { HIDDeviceManager } from '../models/HIDDeviceManager';
import { KeyboardDevice } from '../models/KeyboardDevice';
import { DeviceContext, type DeviceContextValue } from './DeviceContext';

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [selectedDevice, setSelectedDevice] = useState<KeyboardDevice | null>(null);

  const manager = HIDDeviceManager.getInstance();

  // Set notify callback on all devices
  useEffect(() => {
    manager.getAllDevices().forEach(device => {
      device.notify = forceUpdate;
    });
  }, [manager, forceUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      manager.getAllDevices().forEach(device => {
        device.notify = undefined;
      });
    };
  }, [manager]);

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
