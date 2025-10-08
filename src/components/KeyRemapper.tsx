import { useState } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import { useToast } from '../hooks/useToast';
import { KEY_MAP, getAllKeysByCategory, type FirmwareCode } from '../types/keycode';
import { KeyboardCanvas } from './KeyboardCanvas';
import { Spinner } from './Spinner';

// Helper to get friendly key name
function getKeyName(fwCode: FirmwareCode | undefined): string {
  if (fwCode === undefined) return 'Unknown';

  // Try to find the key in KEY_MAP by firmware code
  const keyInfo = Object.values(KEY_MAP).find(k => k.fw === fwCode);
  if (keyInfo) {
    return keyInfo.label;
  }

  // Fallback to hex representation
  return `0x${fwCode.toString(16)}`;
}

export function KeyRemapper() {
  const device = useSelectedDevice();
  const toast = useToast();
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);
  const [selectedTargetKey, setSelectedTargetKey] = useState<FirmwareCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!device) return null;

  const keyCategories = getAllKeysByCategory();

  const handleConfirmRemap = async () => {
    if (selectedKeyIndex === null || selectedTargetKey === null) return;

    setError(null);
    try {
      await device.setMapping(selectedKeyIndex, selectedTargetKey);
      setSelectedTargetKey(null);
      toast.showSuccess('Key mapping updated successfully');
    } catch (err) {
      const errorMessage = 'Failed to update key mapping. Please try again.';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error('Remap error:', err);
    }
  };

  const handleSetToDefault = async () => {
    if (selectedKeyIndex === null) return;

    setError(null);
    try {
      await device.clearMapping(selectedKeyIndex);
      setSelectedTargetKey(null);
      toast.showSuccess('Key reset to default');
    } catch (err) {
      const errorMessage = 'Failed to reset key to default. Please try again.';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error(err);
    }
  };

  const handleClose = () => {
    setSelectedKeyIndex(null);
    setSelectedTargetKey(null);
    setError(null);
  };

  const handleKeyClick = (keyIndex: number) => {
    setSelectedKeyIndex(keyIndex);
    setSelectedTargetKey(null);
    setError(null);
  };

  const currentMapping = selectedKeyIndex !== null ? device.getMapping(selectedKeyIndex) : undefined;
  const defaultKeyLabel = selectedKeyIndex !== null
    ? device.config.keys.find(k => k.bIndex === selectedKeyIndex)?.keyInfo.label
    : undefined;

  const handleResetAll = async () => {
    setError(null);
    try {
      await device.clearAll();
      setSelectedKeyIndex(null);
      setSelectedTargetKey(null);
      toast.showSuccess('All keys reset to default');
    } catch (err) {
      const errorMessage = 'Failed to reset all keys. Please try again.';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error(err);
    }
  };

  const isLoading = device.isMappingLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Key Mapping</h2>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner size="sm" />
              <span>Syncing...</span>
            </div>
          )}
        </div>
        <button
          onClick={handleResetAll}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset All Keys to Default
        </button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded border border-destructive/30">
          {error}
        </div>
      )}

      <KeyboardCanvas
        onKeyClick={handleKeyClick}
        selectedKeyIndex={selectedKeyIndex ?? undefined}
      />

      {selectedKeyIndex !== null && (
        <div className="border border-border rounded p-4 space-y-4 bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-card-foreground">Selected Key:</h3>
                <span className="px-2 py-1 text-sm bg-accent border border-border text-accent-foreground rounded font-mono">
                  {defaultKeyLabel || 'Unknown'}
                </span>
                {currentMapping !== undefined && (
                  <>
                    <span className="text-sm text-muted-foreground">→</span>
                    <span className="px-2 py-1 text-sm bg-accent border border-border text-accent-foreground rounded font-mono">
                      {getKeyName(currentMapping)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmRemap}
                disabled={selectedTargetKey === null || isLoading}
                className="px-3 py-1 min-h-[2.5rem] text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap flex items-center gap-2"
              >
                {isLoading && <Spinner size="sm" className="text-primary-foreground" />}
                Apply
              </button>
              <button
                onClick={handleSetToDefault}
                disabled={isLoading}
                className="px-3 py-1 min-h-[2.5rem] text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Reset to default: ${defaultKeyLabel || 'Unknown'}`}
              >
                Set to Default
              </button>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-3 py-1 min-h-[2.5rem] text-sm bg-muted text-muted-foreground rounded hover:bg-muted/80 cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Button Index: {selectedKeyIndex}
          </p>

          <div className="space-y-3">
            {Object.entries(keyCategories).map(([category, keys]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold mb-2 text-card-foreground">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {keys.map((keyInfo) => (
                    <button
                      key={keyInfo.vk}
                      onClick={() => setSelectedTargetKey(keyInfo.fw)}
                      className={`px-3 py-1 text-sm border rounded transition-colors cursor-pointer ${
                        selectedTargetKey === keyInfo.fw
                          ? 'bg-primary text-primary-foreground border-primary'
                          : currentMapping === keyInfo.fw
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-background border-border hover:bg-accent text-foreground'
                      }`}
                    >
                      {keyInfo.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
