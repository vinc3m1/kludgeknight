import { useState } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';

export function ProfileList() {
  const device = useSelectedDevice();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProfileName, setNewProfileName] = useState('');

  if (!device) return null;

  const switchProfile = async (index: number) => {
    setLoading(true);
    setError(null);
    try {
      await device.activateProfile(index);
    } catch (err) {
      setError('Failed to switch profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addProfile = async () => {
    if (!newProfileName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await device.addProfile(newProfileName);
      setNewProfileName('');
    } catch (err) {
      setError('Failed to add profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (index: number) => {
    if (!confirm('Delete this profile?')) return;

    setLoading(true);
    setError(null);
    try {
      await device.deleteProfile(index);
    } catch (err) {
      setError('Failed to delete profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Profiles</h2>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {device.profiles.map((profile, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-3 border rounded ${
              i === device.activeProfileIndex
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300'
            }`}
          >
            <span className="font-medium">{profile.name}</span>
            <div className="flex gap-2">
              {i !== device.activeProfileIndex && (
                <button
                  onClick={() => switchProfile(i)}
                  disabled={loading}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Activate
                </button>
              )}
              <button
                onClick={() => deleteProfile(i)}
                disabled={loading || device.profiles.length === 1}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newProfileName}
          onChange={(e) => setNewProfileName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addProfile()}
          placeholder="New profile name"
          className="flex-1 px-4 py-2 border border-gray-300 rounded"
        />
        <button
          onClick={addProfile}
          disabled={loading || !newProfileName.trim()}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Add Profile
        </button>
      </div>
    </div>
  );
}
