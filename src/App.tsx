import { useSelectedDevice } from './hooks/useDevices';
import { ConnectButton } from './components/ConnectButton';
import { KeyRemapper } from './components/KeyRemapper';

function App() {
  const device = useSelectedDevice();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">KludgeKnight</h1>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!device ? (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-600 mb-4">
              No keyboard connected
            </h2>
            <p className="text-gray-500">
              Click "Connect Keyboard" to get started
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Connected: {device.config.name}
                </h2>
                <button
                  onClick={() => device.clearAll()}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Reset All Keys to Default
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <KeyRemapper />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            KludgeKnight - Unofficial web-based key remapper for Royal Kludge keyboards
          </p>
          <p className="text-center text-xs text-gray-400 mt-1">
            Not affiliated with Royal Kludge. Use at your own risk.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
