import { useState, useRef } from 'react';
import { KeyboardDevice } from '../models/KeyboardDevice';
import { KeyRemapper, KeyRemapperActionButton } from './KeyRemapper';
import { LightingControls } from './LightingControls';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ImageManifest } from '../utils/buildImageManifest';

type Tab = 'keys' | 'lighting';

interface DeviceEditorProps {
  device: KeyboardDevice;
  imageManifest?: ImageManifest;
  onDisconnect: (device: KeyboardDevice) => Promise<void>;
}

export function DeviceEditor({ device, imageManifest, onDisconnect }: DeviceEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('keys');
  const lightingTabVisitedRef = useRef(false);

  // Track when lighting tab is visited for the first time
  if (activeTab === 'lighting') {
    lightingTabVisitedRef.current = true;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Connected Device</p>
              <h2 className="text-lg font-semibold text-card-foreground">
                {device.config.name}
                <span className="ml-3 text-sm font-normal text-muted-foreground">
                  VID: {device.hidDevice.vendorId.toString(16).toUpperCase().padStart(4, '0')} · PID: {device.config.pid.toUpperCase()}
                </span>
              </h2>
            </div>
            <Button
              onClick={() => onDisconnect(device)}
              variant="outline"
              size="sm"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tab switcher - only show if keyboard has lighting */}
      {device.config.lightEnabled && (
        <Card className="overflow-hidden">
          <div className="flex justify-between items-center py-4 px-6">
            <div className="flex-1" />
            <div className="inline-flex bg-muted border border-border rounded-lg p-1 shrink-0">
              <button
                onClick={() => setActiveTab('keys')}
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
            <div className={activeTab === 'keys' ? '' : 'hidden'}>
              <KeyRemapper device={device} imageManifest={imageManifest} />
            </div>
            {/* Lazy load lighting tab - only mount on first visit, then keep mounted */}
            {lightingTabVisitedRef.current && (
              <div className={activeTab === 'lighting' ? '' : 'hidden'}>
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
