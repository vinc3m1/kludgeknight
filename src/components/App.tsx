import { useState } from 'react';
import { useSelectedDevice, useDevices } from '../hooks/useDevices';
import { KeyRemapper, KeyRemapperActionButton } from './KeyRemapper';
import { LightingEditor, LightingControls, LightingControlsActionButton } from './LightingControls';
import { HomePage } from './HomePage';
import { ThemeToggle } from './ThemeToggle';
import { ThemeSelector } from './ThemeSelector';
import { DeviceProvider } from '../context/DeviceContext';
import { ToastProvider } from '../context/ToastContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ImageManifest } from '../utils/buildImageManifest';

type Tab = 'keys' | 'lighting';

interface AppProps {
  initialKeyboards?: Array<{ pid: string; name: string }>;
  imageManifest?: ImageManifest;
  ledManifest?: string;
}

function AppContent({ initialKeyboards, imageManifest }: AppProps = {}) {
  const device = useSelectedDevice();
  const { disconnectDevice } = useDevices();
  const [activeTab, setActiveTab] = useState<Tab>('keys');

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">KludgeKnight</h1>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeSelector />
              <ThemeToggle />
              <a
                href="https://github.com/vinc3m1/kludgeknight"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-foreground hover:bg-foreground/90 text-background rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View Source on GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!device ? (
          <HomePage initialKeyboards={initialKeyboards} imageManifest={imageManifest} />
        ) : (
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
                    onClick={() => disconnectDevice(device)}
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
              <LightingEditor>
                <Card className="overflow-hidden">
                  <div className="flex justify-between items-center py-4 px-6">
                    <div className="flex-1" />
                    <div className="inline-flex bg-muted border border-border rounded-lg p-1">
                      <button
                        onClick={() => setActiveTab('keys')}
                        className={`px-6 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
                          activeTab === 'keys'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        Key Mapping
                      </button>
                      <button
                        onClick={() => setActiveTab('lighting')}
                        className={`px-6 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
                          activeTab === 'lighting'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        Lighting
                      </button>
                    </div>
                    <div className="flex-1 flex justify-end">
                      {activeTab === 'keys' ? <KeyRemapperActionButton /> : <LightingControlsActionButton />}
                    </div>
                  </div>
                  <CardContent>
                    <div className={activeTab === 'keys' ? '' : 'hidden'}>
                      <KeyRemapper imageManifest={imageManifest} />
                    </div>
                    <div className={activeTab === 'lighting' ? '' : 'hidden'}>
                      <LightingControls isVisible={activeTab === 'lighting'} />
                    </div>
                  </CardContent>
                </Card>
              </LightingEditor>
            )}

            {/* No tabs if keyboard doesn't have lighting */}
            {!device.config.lightEnabled && (
              <Card>
                <CardContent>
                  <KeyRemapper imageManifest={imageManifest} />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Unofficial browser-based software for Royal Kludge keyboards
          </p>
        </div>
      </footer>
    </div>
  );
}

// Wrap AppContent with ToastProvider and DeviceProvider
// ToastProvider must be outside DeviceProvider since DeviceProvider uses toast context
export default function App(props: AppProps) {
  return (
    <ToastProvider>
      <DeviceProvider ledManifest={props.ledManifest}>
        <AppContent {...props} />
      </DeviceProvider>
    </ToastProvider>
  );
}
