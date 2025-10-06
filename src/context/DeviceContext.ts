import { createContext } from 'react';
import { KeyboardDevice } from '../models/KeyboardDevice';

export interface DeviceContextValue {
  devices: KeyboardDevice[];
  selectedDevice: KeyboardDevice | null;
  selectDevice: (device: KeyboardDevice | null) => void;
  requestDevice: () => Promise<void>;
}

export const DeviceContext = createContext<DeviceContextValue | null>(null);
