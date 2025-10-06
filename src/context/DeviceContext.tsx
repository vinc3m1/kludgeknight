import { ReactNode, useCallback, useEffect, useReducer, useState } from 'react';
import { HIDDeviceManager } from '../models/HIDDeviceManager';
import { KeyboardDevice } from '../models/KeyboardDevice';
import { DeviceContext, type DeviceContextValue } from './DeviceContext.ts';

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [selectedDevice, setSelectedDevice] = useState<KeyboardDevice | null>(null);

  const manager = HIDDeviceManager.getInstance();

  // Helper to setup device callbacks
  const setupDeviceCallbacks = useCallback((device: KeyboardDevice) => {
    device.notify = forceUpdate;
    const deviceId = device.id;
    device.onDisconnect = () => {
      manager.removeDevice(deviceId);
      setSelectedDevice(current => {
        // If the disconnected device was selected
        if (current?.id === deviceId) {
          // Switch to another device if available
          const remaining = manager.getAllDevices();
          return remaining.length > 0 ? remaining[0] : null;
        }
        return current;
      });
      forceUpdate();
    };
  }, [manager, forceUpdate]);

  // Scan for previously authorized devices on mount (persists across page refreshes)
  useEffect(() => {
    let mounted = true;

    manager.scanAuthorizedDevices().then(devices => {
      if (!mounted) return;

      if (devices.length > 0) {
        // Set notify callbacks and auto-select first device
        devices.forEach(device => {
          setupDeviceCallbacks(device);
        });
        setSelectedDevice(devices[0]);
      }
    }).catch(error => {
      console.error('Failed to scan for authorized devices:', error);
    });

    return () => {
      mounted = false;
    };
  }, [manager, forceUpdate, setupDeviceCallbacks]); // Only run once on mount

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
      setupDeviceCallbacks(device);
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
