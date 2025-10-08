import { useState, useEffect } from 'react';
import { useDevices } from '../hooks/useDevices';
import { Spinner } from './Spinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';

export function ConnectButton() {
  const { requestDevice, isConnecting, isScanning } = useDevices();
  const [isWebHIDSupported, setIsWebHIDSupported] = useState(true); // Assume supported during SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsWebHIDSupported(typeof navigator !== 'undefined' && 'hid' in navigator);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <div className="relative flex flex-col items-center w-full">
        <Button
          onClick={requestDevice}
          disabled={!isWebHIDSupported || isConnecting}
          size="lg"
          className="px-8 py-6 text-lg shadow-lg hover:shadow-xl"
        >
          {isConnecting && <Spinner size="md" className="text-primary-foreground" />}
          {isConnecting ? 'Connecting...' : 'Connect Keyboard'}
        </Button>

        {/* Absolute positioned elements that don't push content */}
        <div className="absolute top-full mt-4 w-full flex flex-col items-center gap-4">
          {isScanning && (
            <div className="flex items-center gap-2 text-base text-muted-foreground">
              <Spinner size="md" />
              <span>Scanning for devices...</span>
            </div>
          )}
        </div>
      </div>

      {mounted && !isWebHIDSupported && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription className="text-center">
            WebHID is not supported in your browser. Please use Chrome, Edge, or Opera.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
