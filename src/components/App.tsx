import { useState } from 'react';
import { useSelectedDevice, useDevices } from '../hooks/useDevices';
import { ConnectButton } from './ConnectButton';
import { KeyRemapper } from './KeyRemapper';
import { LightingControls } from './LightingControls';
import { HomePage } from './HomePage';
import { ThemeToggle } from './ThemeToggle';
import { DeviceProvider } from '../context/DeviceContext';
import { ToastProvider } from '../context/ToastContext';

type Tab = 'keys' | 'lighting';

interface AppProps {
  initialKeyboards?: Array<{ pid: string; name: string }>;
}

function AppContent({ initialKeyboards }: AppProps = {}) {
  const device = useSelectedDevice();
  const { disconnectDevice } = useDevices();
  const [activeTab, setActiveTab] = useState<Tab>('keys');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">KludgeKnight</h1>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <a
                href="https://github.com/vinc3m1/kludgeknight"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded hover:rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                View Source on GitHub
              </a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!device ? (
          <HomePage initialKeyboards={initialKeyboards} />
        ) : (
          <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Connected: {device.config.name}
                  <span className="ml-3 text-sm font-normal text-gray-500 dark:text-gray-400">
                    VID: {device.hidDevice.vendorId.toString(16).toUpperCase().padStart(4, '0')}  PID: {device.config.pid.toUpperCase()}
                  </span>
                </h2>
                <button
                  onClick={() => disconnectDevice(device)}
                  className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Tab switcher - only show if keyboard has lighting */}
            {device.config.lightEnabled && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('keys')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'keys'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      Key Mapping
                    </button>
                    <button
                      onClick={() => setActiveTab('lighting')}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'lighting'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      Lighting
                    </button>
                  </nav>
                </div>
                <div className="p-6">
                  {activeTab === 'keys' ? <KeyRemapper /> : <LightingControls />}
                </div>
              </div>
            )}

            {/* No tabs if keyboard doesn't have lighting */}
            {!device.config.lightEnabled && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <KeyRemapper />
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
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
      <DeviceProvider>
        <AppContent {...props} />
      </DeviceProvider>
    </ToastProvider>
  );
}
