import { createContext, ReactNode, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { HIDDeviceManager } from '../models/HIDDeviceManager';
import { KeyboardDevice } from '../models/KeyboardDevice';
import { DemoKeyboardDevice } from '../models/DemoKeyboardDevice';
import { ToastContext } from './ToastContext';
import { WebHIDNotAvailableError, UnsupportedKeyboardError, UserCancelledError } from '../errors/KludgeKnightErrors';
import { ERROR_MESSAGES } from '../constants/errorMessages';
import { parseKBIni } from '../utils/kbIniParser';

export interface DeviceContextValue {
  devices: (KeyboardDevice | DemoKeyboardDevice)[];
  selectedDevice: KeyboardDevice | DemoKeyboardDevice | null;
  selectDevice: (device: KeyboardDevice | DemoKeyboardDevice | null) => void;
  requestDevice: () => Promise<void>;
  disconnectDevice: (device: KeyboardDevice | DemoKeyboardDevice) => Promise<void>;
  isConnecting: boolean;
  isScanning: boolean;
  isDemoMode: boolean;
  enterDemoMode: (pid: string) => Promise<void>;
  switchDemoKeyboard: (pid: string) => Promise<void>;
  exitDemoMode: () => void;
}

export const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children, ledManifest }: { children: ReactNode; ledManifest?: string }) {
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  const [selectedDevice, setSelectedDevice] = useState<KeyboardDevice | DemoKeyboardDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoDevice, setDemoDevice] = useState<DemoKeyboardDevice | null>(null);
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

  const disconnectDevice = async (device: KeyboardDevice | DemoKeyboardDevice) => {
    // Handle demo device disconnect
    if ('isDemo' in device && device.isDemo) {
      exitDemoMode();
      return;
    }

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

  const enterDemoMode = async (pid: string) => {
    try {
      setIsConnecting(true);

      // Load keyboard config for the selected PID
      const config = await parseKBIni(pid, ledManifest || null);
      if (!config) {
        toast?.showError(`Failed to load configuration for keyboard ${pid.toUpperCase()}`);
        return;
      }

      // Create demo device
      const demo = new DemoKeyboardDevice(config);
      demo.notify = forceUpdate;

      // Set demo device and mode
      setDemoDevice(demo);
      setSelectedDevice(demo);
      setIsDemoMode(true);

      toast?.showSuccess(`Entered demo mode with ${config.name}`);
    } catch (error) {
      console.error('Failed to enter demo mode:', error);
      toast?.showError('Failed to enter demo mode');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchDemoKeyboard = async (pid: string) => {
    if (!isDemoMode) return;

    try {
      setIsConnecting(true);

      // Load new keyboard config
      const config = await parseKBIni(pid, ledManifest || null);
      if (!config) {
        toast?.showError(`Failed to load configuration for keyboard ${pid.toUpperCase()}`);
        return;
      }

      // Create new demo device
      const demo = new DemoKeyboardDevice(config);
      demo.notify = forceUpdate;

      // Replace demo device
      setDemoDevice(demo);
      setSelectedDevice(demo);

      toast?.showInfo(`Switched to ${config.name}`);
    } catch (error) {
      console.error('Failed to switch demo keyboard:', error);
      toast?.showError('Failed to switch keyboard');
    } finally {
      setIsConnecting(false);
    }
  };

  const exitDemoMode = () => {
    setDemoDevice(null);
    setSelectedDevice(null);
    setIsDemoMode(false);
    toast?.showInfo('Exited demo mode');
  };

  const value: DeviceContextValue = {
    devices: isDemoMode && demoDevice ? [demoDevice] : manager.getAllDevices(),
    selectedDevice,
    selectDevice: setSelectedDevice,
    requestDevice,
    disconnectDevice,
    isConnecting,
    isScanning,
    isDemoMode,
    enterDemoMode,
    switchDemoKeyboard,
    exitDemoMode,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}
