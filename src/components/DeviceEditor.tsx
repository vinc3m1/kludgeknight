import { useState, useRef, useEffect } from 'react';
import { KeyboardDevice } from '../models/KeyboardDevice';
import { DemoKeyboardDevice } from '../models/DemoKeyboardDevice';
import { KeyRemapper, KeyRemapperActionButton } from './KeyRemapper';
import { LightingControls } from './LightingControls';
import { KeyboardSelector } from './KeyboardSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TriangleAlert } from 'lucide-react';
import type { ImageManifest } from '../utils/buildImageManifest';
import { useDevices } from '../hooks/useDevices';
import { getRKDevices } from '../utils/rkConfig';

type Tab = 'keys' | 'lighting';

interface DeviceEditorProps {
  device: KeyboardDevice | DemoKeyboardDevice;
  imageManifest?: ImageManifest;
  onDisconnect: (device: KeyboardDevice | DemoKeyboardDevice) => Promise<void>;
}

export function DeviceEditor({ device, imageManifest, onDisconnect }: DeviceEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('keys');
  const lightingTabVisitedRef = useRef(false);
  const [showKeyboardSwitcher, setShowKeyboardSwitcher] = useState(false);
  const [keyboards, setKeyboards] = useState<Array<{ pid: string; name: string }>>([]);
  const { switchDemoKeyboard } = useDevices();

  const isDemo = 'isDemo' in device && device.isDemo;

  // Load keyboards for switcher
  useEffect(() => {
    if (isDemo) {
      getRKDevices().then(devices => {
        const kbList = Array.from(devices.entries()).map(([pid, name]) => ({ pid, name }));
        setKeyboards(kbList);
      });
    }
  }, [isDemo]);

  // Track when lighting tab is visited for the first time
  if (activeTab === 'lighting') {
    lightingTabVisitedRef.current = true;
  }

  const handleSwitchKeyboard = async (pid: string) => {
    await switchDemoKeyboard(pid);
    setShowKeyboardSwitcher(false);
  };

  return (
    <div className="space-y-8">
      {/* DEMO MODE WARNING BANNER */}
      {isDemo && (
        <Alert className="bg-accent/50 border-accent">
          <TriangleAlert className="h-5 w-5 text-accent-foreground" />
          <AlertDescription className="text-accent-foreground">
            <div className="flex flex-col gap-2">
              <div className="font-bold text-base">DEMO MODE - No Keyboard Connected</div>
              <div className="text-sm">
                You are exploring the interface without a physical keyboard. All operations are simulated and nothing is written to hardware.
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {isDemo ? 'Demo Keyboard' : 'Connected Device'}
              </p>
              <h2 className="text-lg font-semibold text-card-foreground">
                {device.config.name}
                {isDemo && <span className="ml-2 text-sm font-medium text-primary">(DEMO)</span>}
                <span className="ml-3 text-sm font-normal text-muted-foreground">
                  VID: {device.hidDevice.vendorId.toString(16).toUpperCase().padStart(4, '0')} · PID: {device.config.pid.toUpperCase()}
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isDemo && (
                <Button
                  onClick={() => setShowKeyboardSwitcher(!showKeyboardSwitcher)}
                  variant="secondary"
                  size="sm"
                >
                  Switch Keyboard
                </Button>
              )}
              <Button
                onClick={() => onDisconnect(device)}
                variant="outline"
                size="sm"
              >
                {isDemo ? 'Exit Demo' : 'Disconnect'}
              </Button>
            </div>
          </div>

          {/* Keyboard Switcher */}
          {isDemo && showKeyboardSwitcher && (
            <div className="mt-4 pt-4 border-t border-border">
              <KeyboardSelector
                keyboards={keyboards}
                onSelect={handleSwitchKeyboard}
                currentPid={device.config.pid}
                showRandom={true}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab switcher - only show if keyboard has lighting */}
      {device.config.lightEnabled && (
        <Card className="overflow-hidden">
          <div className="flex justify-between items-center py-4 px-6">
            <div className="flex-1" />
            <div className="inline-flex bg-muted border border-border rounded-lg p-1 shrink-0" role="tablist" aria-label="Device configuration tabs">
              <button
                onClick={() => setActiveTab('keys')}
                role="tab"
                aria-selected={activeTab === 'keys'}
                aria-controls="keys-panel"
                id="keys-tab"
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'keys'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                Key Mapping
              </button>
              <button
                onClick={() => setActiveTab('lighting')}
                role="tab"
                aria-selected={activeTab === 'lighting'}
                aria-controls="lighting-panel"
                id="lighting-tab"
                className={`px-6 py-2 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'lighting'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                Lighting
              </button>
            </div>
            <div className="flex-1 flex justify-end">
              {activeTab === 'keys' && <KeyRemapperActionButton device={device} />}
            </div>
          </div>
          <CardContent>
            <div
              id="keys-panel"
              role="tabpanel"
              aria-labelledby="keys-tab"
              className={activeTab === 'keys' ? '' : 'hidden'}
            >
              <KeyRemapper device={device} imageManifest={imageManifest} />
            </div>
            {/* Lazy load lighting tab - only mount on first visit, then keep mounted */}
            {lightingTabVisitedRef.current && (
              <div
                id="lighting-panel"
                role="tabpanel"
                aria-labelledby="lighting-tab"
                className={activeTab === 'lighting' ? '' : 'hidden'}
              >
                <LightingControls
                  device={device}
                  initialSettings={device.lightingSettings}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No tabs if keyboard doesn't have lighting */}
      {!device.config.lightEnabled && (
        <Card>
          <CardContent>
            <KeyRemapper device={device} imageManifest={imageManifest} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
