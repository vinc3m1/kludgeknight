import { useRef, useState } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';

export function ExportImport() {
  const device = useSelectedDevice();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!device) return null;

  const handleExport = () => {
    try {
      const json = device.exportSnapshot(device.config.name);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${device.config.name.toLowerCase().replace(/\s+/g, '-')}-config.json`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess('Profile exported successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to export profile');
      console.error(err);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    try {
      const json = await file.text();
      await device.importSnapshot(json);

      setSuccess('Profile imported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to import profile. Invalid file format.');
      console.error(err);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Export / Import</h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Export Configuration
        </button>

        <button
          onClick={handleImportClick}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Import Configuration
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <p className="text-sm text-gray-600">
        Export your current profiles to a JSON file, or import a previously saved configuration.
      </p>
    </div>
  );
}
