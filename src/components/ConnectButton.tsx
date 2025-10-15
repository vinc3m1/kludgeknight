import { useState, useEffect } from 'react';
import { useDevices } from '../hooks/useDevices';
import { Spinner } from './Spinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import { ERROR_MESSAGES } from '../constants/errorMessages';

export function ConnectButton() {
  const { requestDevice, isConnecting } = useDevices();
  const [isWebHIDSupported, setIsWebHIDSupported] = useState(true); // Assume supported during SSR
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsWebHIDSupported(typeof navigator !== 'undefined' && 'hid' in navigator);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md">
      <Button
        onClick={requestDevice}
        disabled={!isWebHIDSupported || isConnecting}
        size="lg"
        className="px-8 py-6 text-lg shadow-lg hover:shadow-xl"
      >
        {isConnecting && <Spinner size="md" className="text-primary-foreground" />}
        {isConnecting ? 'Connecting...' : 'Connect Keyboard'}
      </Button>

      {mounted && !isWebHIDSupported && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription className="text-center">
            {ERROR_MESSAGES.WEBHID_NOT_AVAILABLE}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
