import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { HIDDeviceManager } from '../models/HIDDeviceManager';
import { KeyboardDevice } from '../models/KeyboardDevice';
import { ToastContext } from './ToastContext';
import { WebHIDNotAvailableError, UnsupportedKeyboardError, UserCancelledError } from '../errors/KludgeKnightErrors';
import { ERROR_MESSAGES } from '../constants/errorMessages';

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

export function DeviceProvider({ children, ledManifest }: { children: ReactNode; ledManifest?: string }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [selectedDevice, setSelectedDevice] = useState<KeyboardDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const toast = useContext(ToastContext);

  const manager = HIDDeviceManager.getInstance();

  // Set led manifest on manager if provided
  useEffect(() => {
    if (ledManifest) {
      manager.setLedManifest(ledManifest);
    }
  }, [ledManifest, manager]);

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

    // Skip scanning if WebHID is not supported
    if (!navigator.hid) {
      setIsScanning(false);
      return;
    }

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
        toast?.showError(ERROR_MESSAGES.SCAN_FAILED);
      }
    });

    return () => {
      mounted = false;
    };
  }, [manager, setupDeviceCallbacks, toast]); // manager and setupDeviceCallbacks are stable (singleton/memoized)

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
      // User cancelled - don't show error
      if (error instanceof UserCancelledError) {
        return;
      }

      console.error('Failed to connect device:', error);

      // Provide user-friendly error messages based on error type
      let errorMessage = ERROR_MESSAGES.CONNECTION_FAILED;

      if (error instanceof WebHIDNotAvailableError) {
        errorMessage = ERROR_MESSAGES.WEBHID_NOT_AVAILABLE;
      } else if (error instanceof UnsupportedKeyboardError) {
        errorMessage = ERROR_MESSAGES.UNSUPPORTED_KEYBOARD;
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

      // Forget the HID device (revokes permission, prevents auto-reconnect)
      await device.hidDevice.forget();

      // Remove from manager
      manager.removeDevice(device.id);

      // Update selected device - set to null if it was the disconnected device
      setSelectedDevice(current => {
        if (current?.id === device.id) {
          // Don't auto-select another device - let user choose
          return null;
        }
        return current;
      });

      // Force update to refresh device list
      forceUpdate();
      toast?.showInfo(`Disconnected from ${device.config.name}`);
    } catch (error) {
      console.error('Failed to disconnect device:', error);
      toast?.showError(ERROR_MESSAGES.DISCONNECT_FAILED);
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
