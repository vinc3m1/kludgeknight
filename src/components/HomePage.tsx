import { useState, useEffect, useRef } from 'react';
import { getRKDevices } from '../utils/rkConfig';
import {
  decodeKBIni,
  parseKBIniForImages
} from '../utils/keyboardImages';

interface KeyboardListItemProps {
  pid: string;
  name: string;
  isExpanded: boolean;
  onToggle: () => void;
}

// Try to fetch KB.ini from a PID directory, handling case-sensitivity
// Also verify the directory case by checking if an image file exists
async function fetchKBIni(pid: string): Promise<{ text: string; dirCase: string } | null> {
  // Helper to verify directory exists by trying to load an image
  const verifyDirCase = async (testPid: string): Promise<string | null> => {
    // Try to load keyimg.png to verify the directory case
    const testUrl = `${import.meta.env.BASE_URL}rk/Dev/${testPid}/keyimg.png`;
    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      if (response.ok) return testPid;
    } catch {
      // Ignore errors
    }

    // Also try kbled.png
    const testUrl2 = `${import.meta.env.BASE_URL}rk/Dev/${testPid}/kbled.png`;
    try {
      const response = await fetch(testUrl2, { method: 'HEAD' });
      if (response.ok) return testPid;
    } catch {
      // Ignore errors
    }

    return null;
  };

  // Try uppercase first (most common)
  let response = await fetch(`${import.meta.env.BASE_URL}rk/Dev/${pid.toUpperCase()}/KB.ini`);
  if (response.ok) {
    const buffer = await response.arrayBuffer();
    const text = decodeKBIni(buffer);

    // Verify the actual directory case
    const actualCase = await verifyDirCase(pid.toUpperCase()) || await verifyDirCase(pid.toLowerCase());
    const dirCase = actualCase || pid.toUpperCase();

    return { text, dirCase };
  }

  // Try lowercase
  response = await fetch(`${import.meta.env.BASE_URL}rk/Dev/${pid.toLowerCase()}/KB.ini`);
  if (response.ok) {
    const buffer = await response.arrayBuffer();
    const text = decodeKBIni(buffer);

    // Verify the actual directory case
    const actualCase = await verifyDirCase(pid.toLowerCase()) || await verifyDirCase(pid.toUpperCase());
    const dirCase = actualCase || pid.toLowerCase();

    return { text, dirCase };
  }

  return null;
}

interface KeyboardImageInfo {
  defaultUrl: string;
  hasRgb: boolean;
  hasNonRgb: boolean;
  useRgbDefault: boolean;
  dirCase: string;
}

async function checkImageExists(url: string): Promise<boolean> {
  try {
    // Try to load the image by creating an Image element
    // This is more reliable than HEAD requests in the browser
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      // Set a timeout to avoid hanging
      setTimeout(() => resolve(false), 5000);
      img.src = url;
    });
  } catch {
    return false;
  }
}

async function getKeyboardImageInfo(pid: string): Promise<KeyboardImageInfo | null> {
  try {
    // Check if both images exist
    const checkBothImages = async (dirCase: string, useRgbDefault: boolean) => {
      const rgbUrl = `${import.meta.env.BASE_URL}rk/Dev/${dirCase}/kbled.png`;
      const nonRgbUrl = `${import.meta.env.BASE_URL}rk/Dev/${dirCase}/keyimg.png`;

      const [hasRgb, hasNonRgb] = await Promise.all([
        checkImageExists(rgbUrl),
        checkImageExists(nonRgbUrl)
      ]);

      const defaultUrl = useRgbDefault && hasRgb ? rgbUrl : nonRgbUrl;

      return {
        defaultUrl,
        hasRgb,
        hasNonRgb,
        useRgbDefault,
        dirCase
      };
    };

    // Try to fetch KB.ini
    const kbIni = await fetchKBIni(pid);

    if (!kbIni) {
      // No KB.ini, try uppercase
      return checkBothImages(pid.toUpperCase(), false);
    }

    const { useRgbDefault, kbImgUse } = parseKBIniForImages(kbIni.text);
    let dirCase: string;

    if (kbImgUse) {
      // Use the referenced keyboard's image
      const refKbIni = await fetchKBIni(kbImgUse);
      dirCase = refKbIni?.dirCase || kbImgUse.toUpperCase();
    } else {
      // Use this keyboard's own image
      dirCase = kbIni.dirCase;
    }

    return checkBothImages(dirCase, useRgbDefault);
  } catch (error) {
    console.error(`Failed to get keyboard image info for ${pid}:`, error);
    return null;
  }
}

function KeyboardListItem({ pid, name, isExpanded, onToggle }: KeyboardListItemProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [imageInfo, setImageInfo] = useState<KeyboardImageInfo | null>(null);
  const [showRgb, setShowRgb] = useState<boolean>(false);

  useEffect(() => {
    if (isExpanded && !imageLoaded) {
      getKeyboardImageInfo(pid).then(info => {
        if (!info || (!info.hasRgb && !info.hasNonRgb)) {
          setHasImage(false);
          setImageLoaded(true);
          return;
        }

        setImageInfo(info);
        setShowRgb(info.useRgbDefault);

        // Check if default image actually loads
        const img = new Image();
        img.onload = () => {
          setHasImage(true);
          setImageLoaded(true);
        };
        img.onerror = () => {
          setHasImage(false);
          setImageLoaded(true);
        };
        img.src = info.defaultUrl;
      });
    }
  }, [isExpanded, imageLoaded, pid]);

  const currentImageUrl = imageInfo
    ? (showRgb && imageInfo.hasRgb
        ? `${import.meta.env.BASE_URL}rk/Dev/${imageInfo.dirCase}/kbled.png`
        : `${import.meta.env.BASE_URL}rk/Dev/${imageInfo.dirCase}/keyimg.png`)
    : null;

  const hasBothImages = imageInfo?.hasRgb && imageInfo?.hasNonRgb;

  return (
    <li className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between cursor-pointer text-gray-900 dark:text-gray-100"
      >
        <span className="text-sm">
          <span className="font-mono text-gray-500 dark:text-gray-400">{pid.toUpperCase()}</span> - {name}
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          {isExpanded ? 'Hide Image' : 'Show Image'}
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      {isExpanded && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
          {!imageLoaded ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading image...</div>
          ) : hasImage && currentImageUrl ? (
            <>
              {hasBothImages && (
                <div className="mb-3 flex justify-end">
                  <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1">
                    <button
                      onClick={() => setShowRgb(false)}
                      className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                        !showRgb
                          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setShowRgb(true)}
                      className={`px-3 py-1 text-xs rounded transition-colors cursor-pointer ${
                        showRgb
                          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      RGB
                    </button>
                  </div>
                </div>
              )}
              <img
                src={currentImageUrl}
                alt={name}
                className="max-w-full h-auto"
                key={currentImageUrl}
              />
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No image available</div>
          )}
        </div>
      )}
    </li>
  );
}

interface HomePageProps {
  initialKeyboards?: Array<{ pid: string; name: string }>;
}

export function HomePage({ initialKeyboards }: HomePageProps = {}) {
  const [keyboards, setKeyboards] = useState<Array<{ pid: string; name: string }>>(initialKeyboards || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPids, setExpandedPids] = useState<Set<string>>(new Set());
  const [showTopShadow, setShowTopShadow] = useState(false);
  const [showBottomShadow, setShowBottomShadow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only fetch if we don't have initial data (SSR provides it)
    if (!initialKeyboards) {
      getRKDevices().then(devices => {
        const keyboards = Array.from(devices.entries()).map(([pid, name]) => ({ pid, name }));
        setKeyboards(keyboards);
      });
    }
  }, [initialKeyboards]);

  // Reset expanded items when search query changes
  useEffect(() => {
    setExpandedPids(new Set());
  }, [searchQuery]);

  const toggleExpanded = (pid: string) => {
    setExpandedPids(prev => {
      const next = new Set(prev);
      if (next.has(pid)) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });
  };

  // Filter keyboards based on search query (by name only)
  const filteredKeyboards = searchQuery
    ? keyboards.filter(kb =>
        kb.name.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Intro */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Key remapper and lighting controller for Royal Kludge keyboards
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Runs directly in your browser, no software to download and install
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Unofficial software, not affiliated with Royal Kludge.<br />
          Built through reverse engineering and referencing other works like <a href="https://rnayabed.github.io/rangoli_website/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Rangoli</a>.
        </p>
      </div>

      {/* Features / Value Props */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg shadow-md p-6 border border-blue-100 dark:border-blue-900">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">What You Can Do</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Remap Any Key</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customize your keyboard layout to match your workflow. Change any key to any other key, including modifiers.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-500 dark:bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Control Lighting</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Adjust backlight brightness, speed, and effects. Customize your keyboard&apos;s appearance to match your setup.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">No Installation Required</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Works instantly in your browser using WebHID. No drivers, no admin permissions, no bloatware.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-500 dark:bg-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Cross-Platform</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Works on Windows, Mac, and Linux. Your settings save automatically and stay with your browser.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Notice */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg shadow-md p-6 border border-green-200 dark:border-green-900">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Runs Completely Locally & Privately</h2>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-500 dark:bg-green-600 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              KludgeKnight runs entirely in your browser. All key remapping and configuration happens locally on your device. Your keyboard settings are saved only in your browser&apos;s local storage and never leave your computer.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              We use Google Analytics to understand basic site traffic (page views, visitor counts), but no keyboard configuration data or personal information is collected.
            </p>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Getting Started</h2>
        <ol className="space-y-3 text-gray-700 dark:text-gray-300">
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500 dark:bg-blue-600 text-white rounded-full text-sm font-bold mr-3">1</span>
            <span>Connect your Royal Kludge keyboard to your computer via USB (Bluetooth mode is not supported)</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500 dark:bg-blue-600 text-white rounded-full text-sm font-bold mr-3">2</span>
            <span>Click the "Connect Keyboard" button in the top right corner</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500 dark:bg-blue-600 text-white rounded-full text-sm font-bold mr-3">3</span>
            <span>In the Chrome popup dialog, select your Royal Kludge keyboard from the list and click "Connect"</span>
          </li>
        </ol>
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> This app requires a Chromium-based browser (Chrome, Edge, or Opera) with WebHID support. Firefox and Safari are not supported.
          </p>
        </div>
      </section>

      {/* Feature Stability */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Feature Stability</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-20 mr-4">
              <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 text-xs font-semibold rounded">STABLE</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Key Mapping</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Extensively tested on RK F68, should be stable on all devices</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-20 mr-4">
              <span className="inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded">BETA</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Lighting Controls</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Lightly tested on RK F68, should work on most devices</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-20 mr-4">
              <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs font-semibold rounded">ALPHA</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">RGB Features</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Untested - may not work at all</p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Limitations */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Important Limitations</h2>
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          <li className="flex items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Cannot Read Settings from Keyboard</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">RK firmware does not allow reading of settings. The app can only write new mappings.</p>
            </div>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">All Keys Written at Once</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">When you change a single key mapping, all key mappings are written to the keyboard.</p>
            </div>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-amber-500 dark:text-amber-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Browser LocalStorage Only</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mappings cannot be stored on the keyboard itself. Your custom mappings are saved in browser localStorage, so they will only persist on the same browser on the same computer. Clearing browser history will delete saved mappings.</p>
            </div>
          </li>
        </ul>
      </section>

      {/* Supported Keyboards */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Supported Keyboards</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          KludgeKnight supports {keyboards.length} Royal Kludge keyboard models. Click on any keyboard to view its layout image.
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Configurations imported from official RK Windows software on October 4, 2025.
        </p>
        {keyboards.length > 0 ? (
          <>
            {/* Search input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by model name..."
                  className="w-full px-4 py-2 pl-10 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent focus:bg-white dark:focus:bg-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {filteredKeyboards.length > 0 ? (
              <>
                {/* Show/Hide All Images button */}
                <div className="mb-3 flex justify-end">
                  <button
                    onClick={handleExpandAllToggle}
                    className="text-sm px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {expandedPids.size > 0 ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        Hide All Images
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Show All Images
                      </>
                    )}
                  </button>
                </div>

                <div className="relative border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-md overflow-hidden" style={{ height: '480px' }}>
                  {/* Top shadow overlay */}
                  {showTopShadow && (
                    <div
                      className="absolute top-0 left-0 right-0 h-4 pointer-events-none z-10"
                      style={{
                        background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.1), transparent)'
                      }}
                    />
                  )}

                  {/* Bottom shadow overlay */}
                  {showBottomShadow && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none z-10"
                      style={{
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.1), transparent)'
                      }}
                    />
                  )}

                  <div className="h-full overflow-y-auto" onScroll={handleScroll} ref={scrollContainerRef}>
                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                      {filteredKeyboards.map(kb => (
                        <KeyboardListItem
                          key={kb.pid}
                          pid={kb.pid}
                          name={kb.name}
                          isExpanded={expandedPids.has(kb.pid)}
                          onToggle={() => toggleExpanded(kb.pid)}
                        />
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No keyboards found matching "{searchQuery}"</p>
            )}
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Loading keyboard list...</p>
        )}
      </section>

      {/* License */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">License</h2>
        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 font-mono bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
          <p>KludgeKnight - Browser-based Software for Royal Kludge Keyboards</p>
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
      </section>

    </div>
  );
}
