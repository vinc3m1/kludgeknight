import { useState, useEffect } from 'react';
import { useDevices } from '../hooks/useDevices';
import { Spinner } from './Spinner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';

export function ConnectButton() {
  const { requestDevice, devices, selectedDevice, selectDevice, isConnecting, isScanning } = useDevices();
  const [isWebHIDSupported, setIsWebHIDSupported] = useState(true); // Assume supported during SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsWebHIDSupported(typeof navigator !== 'undefined' && 'hid' in navigator);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div className="flex flex-col items-center gap-4 w-full">
        <Button
          onClick={requestDevice}
          disabled={!isWebHIDSupported || isConnecting}
          size="lg"
          className="px-8 py-6 text-lg shadow-lg hover:shadow-xl"
        >
          {isConnecting && <Spinner size="md" className="text-white" />}
          {isConnecting ? 'Connecting...' : 'Connect Keyboard'}
        </Button>

        {isScanning && (
          <div className="flex items-center gap-2 text-base text-muted-foreground">
            <Spinner size="md" />
            <span>Scanning for devices...</span>
          </div>
        )}

        {devices.length > 0 && (
          <Select
            value={selectedDevice?.id || ''}
            onValueChange={(value) => {
              const device = devices.find(d => d.id === value);
              selectDevice(device || null);
            }}
          >
            <SelectTrigger className="w-full text-base">
              <SelectValue placeholder="Select device..." />
            </SelectTrigger>
            <SelectContent>
              {devices.map((device) => (
                <SelectItem key={device.id} value={device.id}>
                  {device.config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {mounted && !isWebHIDSupported && (
        <Alert className="bg-destructive/10 border-destructive/30">
          <TriangleAlert className="text-destructive" />
          <AlertDescription className="text-destructive text-center">
            WebHID is not supported in your browser. Please use Chrome, Edge, or Opera.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
