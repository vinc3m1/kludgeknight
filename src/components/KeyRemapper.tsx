import { useState } from 'react';
import { useSelectedDevice } from '../hooks/useDevices';
import { useToast } from '../hooks/useToast';
import { KEY_MAP, getAllKeysByCategory, type FirmwareCode } from '../types/keycode';
import { KeyboardCanvas } from './KeyboardCanvas';
import { Spinner } from './Spinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ImageManifest } from '../utils/buildImageManifest';

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

export function KeyRemapperActionButton() {
  const device = useSelectedDevice();
  const toast = useToast();

  if (!device) return null;

  const handleResetAll = async () => {
    try {
      await device.resetAllMappings();
      toast.showSuccess('All keys reset to default');
    } catch (err) {
      const errorMessage = 'Failed to reset keys. Please try again.';
      toast.showError(errorMessage);
      console.error(err);
    }
  };

  const isLoading = device.isMappingLoading;

  return (
    <Button
      onClick={handleResetAll}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      Reset All Keys to Default
    </Button>
  );
}

interface KeyRemapperProps {
  imageManifest?: ImageManifest;
}

export function KeyRemapper({ imageManifest }: KeyRemapperProps = {}) {
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

  const isLoading = device.isMappingLoading;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <KeyboardCanvas
        onKeyClick={handleKeyClick}
        selectedKeyIndex={selectedKeyIndex ?? undefined}
        imageManifest={imageManifest}
      />

      {selectedKeyIndex !== null && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-card-foreground">Selected Key:</h3>
                  <Badge variant="outline" className="font-mono">
                    {defaultKeyLabel || 'Unknown'}
                  </Badge>
                  {currentMapping !== undefined && (
                    <>
                      <span className="text-sm text-muted-foreground">→</span>
                      <Badge variant="outline" className="font-mono">
                        {getKeyName(currentMapping)}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConfirmRemap}
                disabled={selectedTargetKey === null || isLoading}
                size="sm"
              >
                {isLoading && <Spinner size="sm" className="text-primary-foreground" />}
                Apply
              </Button>
              <Button
                onClick={handleSetToDefault}
                disabled={isLoading}
                variant="secondary"
                size="sm"
                title={`Reset to default: ${defaultKeyLabel || 'Unknown'}`}
              >
                Set to Default
              </Button>
              <Button
                onClick={handleClose}
                disabled={isLoading}
                variant="ghost"
                size="sm"
              >
                Close
              </Button>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
