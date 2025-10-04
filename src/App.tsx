import { useSelectedDevice } from './hooks/useDevices';
import { ConnectButton } from './components/ConnectButton';
import { ProfileList } from './components/ProfileList';
import { KeyRemapper } from './components/KeyRemapper';
import { ExportImport } from './components/ExportImport';

function App() {
  const device = useSelectedDevice();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">RK-Web</h1>
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
              <h2 className="text-lg font-semibold mb-4">
                Connected: {device.config.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <KeyRemapper />
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <ProfileList />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <ExportImport />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Based on{' '}
            <a
              href="https://github.com/rnayabed/rangoli"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Rangoli
            </a>
            {' '}by Debayan Sutradhar
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
