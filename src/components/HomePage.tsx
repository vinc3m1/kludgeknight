import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react';
import { getRKDevices } from '../utils/rkConfig';
import { ConnectButton } from './ConnectButton';
import { KeyboardSelector } from './KeyboardSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Rocket } from 'lucide-react';
import type { ImageManifest } from '../utils/buildImageManifest';
import { useDevices } from '../hooks/useDevices';

interface KeyboardListItemProps {
  pid: string;
  name: string;
  isExpanded: boolean;
  onToggle: (pid: string) => void;
  imageManifest?: ImageManifest;
}

const KeyboardListItem = memo(function KeyboardListItem({ pid, name, isExpanded, onToggle, imageManifest }: KeyboardListItemProps) {
    const [showRgb, setShowRgb] = useState<boolean>(false);
    const [standardLoaded, setStandardLoaded] = useState<boolean>(false);
    const [rgbLoaded, setRgbLoaded] = useState<boolean>(false);
    const [hasRequestedStandard, setHasRequestedStandard] = useState<boolean>(false);
    const [hasRequestedRgb, setHasRequestedRgb] = useState<boolean>(false);

    // Get image info from manifest (pre-computed at build time)
    // Memoize to keep stable reference across re-renders
    const pidUpper = pid.toUpperCase();
    const imageInfo = useMemo(() => {
      let info = imageManifest?.[pidUpper];

      // Handle kbImgUse references
      if (info?.kbImgUse && imageManifest) {
        const refInfo = imageManifest[info.kbImgUse.toUpperCase()];
        if (refInfo) {
          info = { ...refInfo, kbImgUse: undefined }; // Use referenced keyboard's images
        }
      }

      return info;
    }, [imageManifest, pidUpper]);

    const hasImage = imageInfo && (imageInfo.hasKeyimg || imageInfo.hasKbled);
    const hasBothImages = imageInfo?.hasKeyimg && imageInfo?.hasKbled;

    // Default to RGB images if available
    useEffect(() => {
      if (hasBothImages) {
        setShowRgb(true);
      } else if (imageInfo?.useRgbDefault !== undefined) {
        setShowRgb(imageInfo.useRgbDefault);
      }
    }, [hasBothImages, imageInfo?.useRgbDefault]);

    const standardImageUrl = imageInfo && hasImage && imageInfo.hasKeyimg
      ? `${import.meta.env.BASE_URL}rk/Dev/${imageInfo.dirCase}/keyimg.png`
      : null;

    const rgbImageUrl = imageInfo && hasImage && imageInfo.hasKbled
      ? `${import.meta.env.BASE_URL}rk/Dev/${imageInfo.dirCase}/kbled.png`
      : null;

    const currentImageUrl = showRgb ? rgbImageUrl : standardImageUrl;
    const currentImageLoaded = showRgb ? rgbLoaded : standardLoaded;

    // Reset state when collapsed
    useEffect(() => {
      if (!isExpanded) {
        setStandardLoaded(false);
        setRgbLoaded(false);
        setHasRequestedStandard(false);
        setHasRequestedRgb(false);
      }
    }, [isExpanded]);

    // Request images based on which view is active
    useEffect(() => {
      if (!isExpanded) return;

      if (showRgb && !hasRequestedRgb) {
        setHasRequestedRgb(true);
      } else if (!showRgb && !hasRequestedStandard) {
        setHasRequestedStandard(true);
      }
    }, [isExpanded, showRgb, hasRequestedRgb, hasRequestedStandard]);

    const handleStandardLoad = () => {
      setStandardLoaded(true);
    };

    const handleRgbLoad = () => {
      setRgbLoaded(true);
    };

    const expandedPanelId = `kb-${pidUpper}-panel`;

    // Get dimensions from manifest (pre-computed at build time)
    const standardDims = imageInfo?.keyimgDimensions;
    const rgbDims = imageInfo?.kbledDimensions;

    // Calculate aspect ratio (width/height) for the current view
    const currentDims = showRgb ? rgbDims : standardDims;
    const aspectRatio = currentDims ? currentDims.width / currentDims.height : undefined;

    return (
      <li className="border-b border-border last:border-b-0">
      <button
        onClick={() => onToggle(pid)}
        className="w-full text-left px-4 py-2 hover:bg-accent transition-colors flex items-center justify-between cursor-pointer text-foreground"
        aria-expanded={isExpanded}
        aria-controls={expandedPanelId}
      >
        <span className="text-sm">
          <span className="font-mono text-muted-foreground">{pid.toUpperCase()}</span> - {name}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {isExpanded ? 'Hide Image' : 'Show Image'}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isExpanded && (
        <div id={expandedPanelId} className="px-4 py-3 bg-muted">
          {hasImage && currentImageUrl ? (
            <>
              {hasBothImages && (
                <div className="mb-3 flex justify-end">
                  <div className="inline-flex items-center gap-1 bg-background border rounded-md p-1">
                    <Button
                      onClick={() => setShowRgb(false)}
                      variant={!showRgb ? "default" : "ghost"}
                      size="sm"
                    >
                      Standard
                    </Button>
                    <Button
                      onClick={() => setShowRgb(true)}
                      variant={showRgb ? "default" : "ghost"}
                      size="sm"
                    >
                      RGB
                    </Button>
                  </div>
                </div>
              )}
              <div
                className="relative w-full mx-auto"
                style={{
                  aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
                  maxWidth: currentDims?.width ? `${currentDims.width}px` : undefined
                }}
              >
                {/* Loading spinner - shown while image loads */}
                {!currentImageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                )}
                {/* Standard image with SVG background - mount once requested, keep mounted */}
                {hasRequestedStandard && standardImageUrl && imageInfo?.luminance && standardDims && (
                  <svg
                    key={`svg-${standardImageUrl}`}
                    viewBox={`0 0 ${standardDims.width} ${standardDims.height}`}
                    className={`absolute inset-0 w-full h-full ${!showRgb && standardLoaded ? 'kb-img-visible' : 'kb-img-hidden'}`}
                    role="img"
                    aria-label={`${name} keyboard layout`}
                    aria-hidden={showRgb}
                  >
                    {/* Render single large background rect for majority */}
                    <rect
                      x={imageInfo.luminance.keyboardBounds[0]}
                      y={imageInfo.luminance.keyboardBounds[1]}
                      width={imageInfo.luminance.keyboardBounds[2] - imageInfo.luminance.keyboardBounds[0]}
                      height={imageInfo.luminance.keyboardBounds[3] - imageInfo.luminance.keyboardBounds[1]}
                      fill={imageInfo.luminance.majorityBackground}
                    />
                    {/* Render small rects only for exception keys */}
                    {imageInfo.luminance.exceptionKeys.map((exceptionKey, index) => {
                      const [left, top, right, bottom] = exceptionKey.rect;
                      return (
                        <rect
                          key={`exception-${index}`}
                          x={left}
                          y={top}
                          width={right - left}
                          height={bottom - top}
                          fill={exceptionKey.background}
                        />
                      );
                    })}
                    <image
                      href={standardImageUrl}
                      x="0"
                      y="0"
                      width={standardDims.width}
                      height={standardDims.height}
                      onLoad={handleStandardLoad}
                    />
                  </svg>
                )}
                {/* Standard image without luminance data - mount once requested, keep mounted */}
                {hasRequestedStandard && standardImageUrl && !imageInfo?.luminance && (
                  <img
                    key={`img-${standardImageUrl}`}
                    src={standardImageUrl}
                    alt={`${name} keyboard layout`}
                    className={`absolute inset-0 w-full h-full object-contain ${!showRgb && standardLoaded ? 'kb-img-visible' : 'kb-img-hidden'}`}
                    aria-hidden={showRgb}
                    onLoad={handleStandardLoad}
                    decoding="async"
                  />
                )}
                {/* RGB image - mount once requested, keep mounted */}
                {hasRequestedRgb && rgbImageUrl && (
                  <img
                    key={`img-${rgbImageUrl}`}
                    src={rgbImageUrl}
                    alt={`${name} keyboard layout with RGB lighting`}
                    className={`absolute inset-0 w-full h-full object-contain ${showRgb && rgbLoaded ? 'kb-img-visible' : 'kb-img-hidden'}`}
                    aria-hidden={!showRgb}
                    onLoad={handleRgbLoad}
                    decoding="async"
                  />
                )}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">No image available</div>
          )}
        </div>
      )}
    </li>
  );
});

interface HomePageProps {
  initialKeyboards?: Array<{ pid: string; name: string }>;
  imageManifest?: ImageManifest;
}

export function HomePage({ initialKeyboards, imageManifest }: HomePageProps = {}) {
  const [keyboards, setKeyboards] = useState<Array<{ pid: string; name: string }>>(initialKeyboards || []);
  const [filterQuery, setFilterQuery] = useState('');
  const [expandedPids, setExpandedPids] = useState<Set<string>>(new Set());
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(true);
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { enterDemoMode } = useDevices();

  useEffect(() => {
    // Only fetch if we don't have initial data (SSR provides it)
    if (!initialKeyboards) {
      getRKDevices().then(devices => {
        const keyboards = Array.from(devices.entries()).map(([pid, name]) => ({ pid, name }));
        setKeyboards(keyboards);
      });
    }
  }, [initialKeyboards]);

  // Reset expanded items and scroll when filter query changes
  useEffect(() => {
    setExpandedPids(new Set());
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [filterQuery]);

  const toggleExpanded = useCallback((pid: string) => {
    setExpandedPids(prev => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  }, []);

  // Filter keyboards based on filter query (by name or PID, case-insensitive)
  const filteredKeyboards = filterQuery
    ? keyboards.filter(kb =>
        kb.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
        kb.pid.toLowerCase().includes(filterQuery.toLowerCase())
      )
    : keyboards;

  // Update shadows when filtered list changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const isScrollable = container.scrollHeight > container.clientHeight;
      setShowTopShadow(false); // Always reset to top
      setShowBottomShadow(isScrollable);
    }
  }, [filteredKeyboards.length]);

  const handleExpandAllToggle = () => {
    if (expandedPids.size > 0) {
      // Hide all
      setExpandedPids(new Set());
    } else {
      // Show all - expand all filtered keyboards
      setExpandedPids(new Set(filteredKeyboards.map(kb => kb.pid)));
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // Only show shadows if content is scrollable
    const isScrollable = scrollHeight > clientHeight;

    // Show top shadow if scrolled down from top
    setShowTopShadow(isScrollable && scrollTop > 0);

    // Show bottom shadow if not at bottom (with 1px tolerance)
    setShowBottomShadow(isScrollable && scrollTop + clientHeight < scrollHeight - 1);
  };

  const handleEnterDemoMode = async (pid: string) => {
    await enterDemoMode(pid);
    setShowDemoSelector(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section with CTA */}
      <header className="text-center py-8">
        <h1 className="text-4xl font-bold text-foreground mb-3">
          Configure Royal Kludge Keyboards<br />from the browser
        </h1>
        <p className="text-xl text-muted-foreground">
          Remap keys and control lighting, works on Mac, Linux, and Windows
        </p>
        <p className="text-sm text-muted-foreground mt-2 mb-6">
          Unofficial software, not affiliated with Royal Kludge.<br />
          Built through reverse engineering and referencing other works like <a href="https://rnayabed.github.io/rangoli_website/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Rangoli</a>.
        </p>

        {/* CTA - Connect Keyboard & Demo Mode */}
        <div className="flex flex-col items-center gap-4">
          <ConnectButton />

          <div className="flex items-center gap-3">
            <div className="h-px bg-border w-16"></div>
            <span className="text-sm text-muted-foreground">or</span>
            <div className="h-px bg-border w-16"></div>
          </div>

          <Button
            onClick={() => setShowDemoSelector(!showDemoSelector)}
            variant="outline"
            size="lg"
            className="px-8 py-6 text-lg"
          >
            <Rocket className="w-5 h-5 mr-2" />
            {showDemoSelector ? 'Hide Demo Mode' : 'Try Demo Mode'}
          </Button>

          {/* Demo Mode Keyboard Selector */}
          {showDemoSelector && (
            <Card className="w-full mt-4">
              <CardHeader>
                <CardTitle>Select a Keyboard to Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <AlertDescription>
                    Demo mode lets you explore the interface without connecting a physical keyboard. All features work normally, but nothing is written to hardware.
                  </AlertDescription>
                </Alert>

                <KeyboardSelector
                  keyboards={keyboards}
                  onSelect={handleEnterDemoMode}
                  showRandom={true}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </header>

      {/* Features / Value Props */}
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Remap Any Key</h3>
              <p className="text-sm text-muted-foreground">Map any key to any other key or modifier. Changes are written directly to keyboard firmware.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center" aria-hidden="true">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Control Lighting</h3>
              <p className="text-sm text-muted-foreground">Set backlight brightness, speed, and effects. Works with both standard and RGB models.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-lg flex items-center justify-center" aria-hidden="true">
              <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Runs in Browser</h3>
              <p className="text-sm text-muted-foreground">Uses WebHID API. Works in Chrome, Edge, and Opera. No drivers or admin permissions needed.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-accent rounded-lg flex items-center justify-center" aria-hidden="true">
              <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Cross-Platform</h3>
              <p className="text-sm text-muted-foreground">Works across Windows, Mac, and Linux. Settings saved in browser storage.</p>
            </div>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Notice */}
      <Card>
        <CardHeader>
          <CardTitle>Everything Runs Locally</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0" aria-hidden="true">
            <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-card-foreground">
              Hosted as a static site on GitHub Pages with no backend. All configuration happens directly between browser and keyboard via WebHID. Settings stored in browser localStorage only.
            </p>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
        <ol className="space-y-3 text-card-foreground">
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-sm font-bold mr-3">1</span>
            <span>Connect Royal Kludge keyboard via USB (Bluetooth not supported)</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-sm font-bold mr-3">2</span>
            <span>Click Connect Keyboard button</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-sm font-bold mr-3">3</span>
            <span>Select keyboard from browser dialog and click Connect</span>
          </li>
        </ol>
        <Alert className="mt-4">
          <AlertDescription>
            Chrome, Edge, or Opera required (desktop only). WebHID not supported in Firefox/Safari or mobile browsers.
          </AlertDescription>
        </Alert>
        </CardContent>
      </Card>

      {/* Feature Stability */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Stability</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-20 mr-4">
              <Badge className="bg-accent/20 text-accent-foreground border-accent/30">STABLE</Badge>
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Key Mapping</p>
              <p className="text-sm text-muted-foreground">Tested on RK F68 and S70 Split. Stable for keyboards up to 70 keys with 2 spacebars. Keyboards with other unique modifier keys may be untested.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-20 mr-4">
              <Badge className="bg-accent/20 text-accent-foreground border-accent/30">STABLE</Badge>
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Lighting & RGB Controls</p>
              <p className="text-sm text-muted-foreground">Keyboard-wide lighting and RGB controls tested on RK F68 and S70 Split with extensive RGB functionality. Should work on most devices.</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-20 mr-4">
              <Badge className="bg-muted text-muted-foreground border-transparent">FUTURE</Badge>
            </div>
            <div>
              <p className="font-semibold text-card-foreground">Per-Key RGB</p>
              <p className="text-sm text-muted-foreground">Individual key RGB customization is not yet implemented. Pull requests welcome!</p>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Important Limitations */}
      <Card>
        <CardHeader>
          <CardTitle>Limitations</CardTitle>
        </CardHeader>
        <CardContent>
        <ul className="space-y-3 text-card-foreground">
          <li className="flex items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-accent mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-card-foreground">Can&apos;t read existing mappings from keyboard</p>
              <p className="text-sm text-muted-foreground">RK firmware only accepts writes. KludgeKnight starts with default layout and can only save mappings to browser localStorage.</p>
            </div>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-accent mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-card-foreground">Settings only saved in browser localStorage</p>
              <p className="text-sm text-muted-foreground">Since keyboard firmware can&apos;t be read, settings are saved to browser localStorage as a fallback. No backend means these stay local to one browser. Clearing browser data or switching browsers resets to defaults.</p>
            </div>
          </li>
        </ul>
        </CardContent>
      </Card>

      {/* Supported Keyboards */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Models</CardTitle>
        </CardHeader>
        <CardContent>
        <p className="text-muted-foreground mb-2">
          {keyboards.length} RK keyboard models supported.
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Configurations from official RK Windows software (Oct 2025).
        </p>
        {keyboards.length > 0 ? (
          <>
            {/* Filter input */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-accent" />
                <Input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter by model name or PID..."
                  className="pl-10 w-full"
                />
              </div>
            </div>

            {filteredKeyboards.length > 0 ? (
              <>
                {/* Show/Hide All Images button */}
                <div className="mb-3 flex justify-end">
                  <Button
                    onClick={handleExpandAllToggle}
                    variant="ghost"
                    size="sm"
                  >
                    {expandedPids.size > 0 ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Hide All Images
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Show All Images
                      </>
                    )}
                  </Button>
                </div>

                <div className="relative border border-border bg-muted rounded-md overflow-hidden" style={{ height: '480px' }}>
                  {/* Top shadow overlay */}
                  {showTopShadow && (
                    <div
                      className="absolute top-0 left-0 right-0 h-4 pointer-events-none z-10 bg-gradient-to-b from-foreground/10 to-transparent"
                    />
                  )}

                  {/* Bottom shadow overlay */}
                  {showBottomShadow && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none z-10 bg-gradient-to-t from-foreground/10 to-transparent"
                    />
                  )}

                  <div className="h-full overflow-y-auto" onScroll={handleScroll} ref={scrollContainerRef}>
                    <ul className="divide-y divide-border">
                      {filteredKeyboards.map(kb => (
                        <KeyboardListItem
                          key={kb.pid}
                          pid={kb.pid}
                          name={kb.name}
                          isExpanded={expandedPids.has(kb.pid)}
                          onToggle={toggleExpanded}
                          imageManifest={imageManifest}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">No keyboards found matching "{filterQuery}"</p>
            )}
          </>
        ) : (
          <p className="text-muted-foreground">Loading keyboard list...</p>
        )}
        </CardContent>
      </Card>

      {/* License */}
      <Card>
        <CardHeader>
          <CardTitle>License</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="text-sm text-card-foreground space-y-2 font-mono bg-muted p-4 rounded border border-border">
          <p>Kludge Knight - Browser-based Software for Royal Kludge Keyboards</p>
          <p>Copyright (C) 2025 Vince Mi (vinc3m1)</p>
          <p className="pt-2">
            This program is free software: you can redistribute it and/or modify
            it under the terms of the GNU General Public License as published by
            the Free Software Foundation, either version 3 of the License, or
            (at your option) any later version.
          </p>
          <p>
            This program is distributed in the hope that it will be useful,
            but WITHOUT ANY WARRANTY; without even the implied warranty of
            MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
            GNU General Public License for more details.
          </p>
        </div>
        </CardContent>
      </Card>

    </div>
  );
}
