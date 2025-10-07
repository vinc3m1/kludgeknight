import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { HIDDeviceManager } from '../models/HIDDeviceManager';
import { KeyboardDevice } from '../models/KeyboardDevice';
import { ToastContext } from './ToastContext';

export interface DeviceContextValue {
  devices: KeyboardDevice[];
  selectedDevice: KeyboardDevice | null;
  selectDevice: (device: KeyboardDevice | null) => void;
  requestDevice: () => Promise<void>;
  disconnectDevice: (device: KeyboardDevice) => Promise<void>;
  isConnecting: boolean;
  isScanning: boolean;
}

export const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [selectedDevice, setSelectedDevice] = useState<KeyboardDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const toast = useContext(ToastContext);

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

    setIsScanning(true);
    manager.scanAuthorizedDevices().then(devices => {
      if (!mounted) return;

      if (devices.length > 0) {
        // Set notify callbacks and auto-select first device
        devices.forEach(device => {
          setupDeviceCallbacks(device);
        });
        setSelectedDevice(devices[0]);
      }
      setIsScanning(false);
    }).catch(error => {
      console.error('Failed to scan for authorized devices:', error);
      if (mounted) {
        setIsScanning(false);
        toast?.showError('Failed to reconnect to previously authorized keyboards. Please try connecting again.');
      }
    });

    return () => {
      mounted = false;
    };
  }, [manager, forceUpdate, setupDeviceCallbacks, toast]); // Only run once on mount

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
        device.onDisconnect = undefined;
        // Clean up event listeners when component unmounts
        device.cleanup();
      });
    };
  }, [manager]);

  const requestDevice = async () => {
    setIsConnecting(true);
    try {
      const device = await manager.requestDevice();
      if (device) {
        setupDeviceCallbacks(device);
        setSelectedDevice(device);
        toast?.showSuccess(`Connected to ${device.config.name}`);
      }
    } catch (error) {
      console.error('Failed to connect device:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to connect to keyboard. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('WebHID API not available')) {
          errorMessage = 'WebHID is not supported in your browser. Please use Chrome, Edge, or Opera.';
        } else if (error.message.includes('No device selected')) {
          // User cancelled the picker, don't show error
          return;
        } else if (error.message.includes('not found') || error.message.includes('configuration')) {
          errorMessage = 'This keyboard model is not supported. Check the device list for compatible models.';
        }
      }

      toast?.showError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectDevice = async (device: KeyboardDevice) => {
    try {
      // Clean up event listeners before closing
      device.cleanup();
      await device.hidDevice.close();
      manager.removeDevice(device.id);
      setSelectedDevice(current => {
        if (current?.id === device.id) {
          const remaining = manager.getAllDevices();
          return remaining.length > 0 ? remaining[0] : null;
        }
        return current;
      });
      forceUpdate();
      toast?.showInfo(`Disconnected from ${device.config.name}`);
    } catch (error) {
      console.error('Failed to disconnect device:', error);
      toast?.showError('Failed to disconnect from keyboard. The device may already be disconnected.');
    }
  };

  const value: DeviceContextValue = {
    devices: manager.getAllDevices(),
    selectedDevice,
    selectDevice: setSelectedDevice,
    requestDevice,
    disconnectDevice,
    isConnecting,
    isScanning,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}
