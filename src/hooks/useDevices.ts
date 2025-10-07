import { useContext } from 'react';
import { DeviceContext } from '../context/DeviceContext';
import type { DeviceContextValue } from '../context/DeviceContext';
import type { KeyboardDevice } from '../models/KeyboardDevice';

export function useDevices(): DeviceContextValue {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevices must be used within DeviceProvider');
  }
  return context;
}

export function useSelectedDevice(): KeyboardDevice | null {
  const { selectedDevice } = useDevices();
  return selectedDevice;
}
