import { useState, useEffect } from 'react';
import { getRKDevices } from '../utils/rkConfig';
import {
  decodeKBIni,
  parseKBIniForImages
} from '../utils/keyboardImages';

interface KeyboardListItemProps {
  pid: string;
  name: string;
  expandAll: boolean;
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

function KeyboardListItem({ pid, name, expandAll }: KeyboardListItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasImage, setHasImage] = useState(false);
  const [imageInfo, setImageInfo] = useState<KeyboardImageInfo | null>(null);
  const [showRgb, setShowRgb] = useState<boolean>(false);

  const isExpanded = expandAll || expanded;

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
    <li className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between"
      >
        <span className="text-sm">
          <span className="font-mono text-gray-500">{pid.toUpperCase()}</span> - {name}
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-500">
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
        <div className="px-4 py-3 bg-gray-50">
          {!imageLoaded ? (
            <div className="text-sm text-gray-500">Loading image...</div>
          ) : hasImage && currentImageUrl ? (
            <>
              {hasBothImages && (
                <div className="mb-3 flex justify-end">
                  <div className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-md p-1">
                    <button
                      onClick={() => setShowRgb(false)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        !showRgb
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setShowRgb(true)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        showRgb
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
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
            <div className="text-sm text-gray-500">No image available</div>
          )}
        </div>
      )}
    </li>
  );
}

export function HomePage() {
  const [keyboards, setKeyboards] = useState<Array<{ pid: string; name: string }>>([]);
  const [showAllKeyboards, setShowAllKeyboards] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    getRKDevices().then(devices => {
      const kbList = Array.from(devices.entries()).map(([pid, name]) => ({ pid, name }));
      setKeyboards(kbList);
    });
  }, []);

  // Reset "show all" and "expand all" when search query changes
  useEffect(() => {
    setShowAllKeyboards(false);
    setExpandAll(false);
  }, [searchQuery]);

  // Filter keyboards based on search query (by name only)
  const filteredKeyboards = searchQuery
    ? keyboards.filter(kb =>
        kb.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : keyboards;

  const displayedKeyboards = showAllKeyboards ? filteredKeyboards : filteredKeyboards.slice(0, 10);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Intro */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Key remapper and lighting controller for Royal Kludge keyboards
        </h2>
        <p className="text-xl text-gray-600">
          Runs directly in your browser, no software to download and install
        </p>
      </div>

      {/* Getting Started */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
        <ol className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-sm font-bold mr-3">1</span>
            <span>Connect your Royal Kludge keyboard to your computer via USB (Bluetooth mode is not supported)</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-sm font-bold mr-3">2</span>
            <span>Click the "Connect Keyboard" button in the top right corner</span>
          </li>
          <li className="flex items-start">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-sm font-bold mr-3">3</span>
            <span>In the Chrome popup dialog, select your Royal Kludge keyboard from the list and click "Connect"</span>
          </li>
        </ol>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This app requires a Chromium-based browser (Chrome, Edge, or Opera) with WebHID support. Firefox and Safari are not supported.
          </p>
        </div>
      </section>

      {/* Feature Stability */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Feature Stability</h2>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-20 mr-4">
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">STABLE</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Key Mapping</p>
              <p className="text-sm text-gray-600">Extensively tested on RK F68, should be stable on all devices</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-20 mr-4">
              <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">BETA</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Lighting Controls</p>
              <p className="text-sm text-gray-600">Lightly tested on RK F68, should work on most devices</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-20 mr-4">
              <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">ALPHA</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">RGB Features</p>
              <p className="text-sm text-gray-600">Untested - may not work at all</p>
            </div>
          </div>
        </div>
      </section>

      {/* Important Limitations */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Limitations</h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-amber-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Cannot Read Settings from Keyboard</p>
              <p className="text-sm text-gray-600">RK firmware does not allow reading of settings. The app can only write new mappings.</p>
            </div>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-amber-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">All Keys Written at Once</p>
              <p className="text-sm text-gray-600">When you change a single key mapping, all key mappings are written to the keyboard.</p>
            </div>
          </li>
          <li className="flex items-start">
            <svg className="flex-shrink-0 w-5 h-5 text-amber-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold">Browser LocalStorage Only</p>
              <p className="text-sm text-gray-600">Mappings cannot be stored on the keyboard itself. Your custom mappings are saved in browser localStorage, so they will only persist on the same browser on the same computer. Clearing browser history will delete saved mappings.</p>
            </div>
          </li>
        </ul>
      </section>

      {/* Supported Keyboards */}
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Supported Keyboards</h2>
        <p className="text-gray-600 mb-2">
          KludgeKnight supports {keyboards.length} Royal Kludge keyboard models. Click on any keyboard to view its layout image.
        </p>
        <p className="text-sm text-gray-500 mb-4">
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
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-gray-600">
                  Found {filteredKeyboards.length} keyboard{filteredKeyboards.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {filteredKeyboards.length > 0 ? (
              <>
                {/* Show/Hide All Images button */}
                <div className="mb-3 flex justify-end">
                  <button
                    onClick={() => setExpandAll(!expandAll)}
                    className="text-sm px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1"
                  >
                    {expandAll ? (
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

                <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                  {displayedKeyboards.map(kb => (
                    <KeyboardListItem key={kb.pid} pid={kb.pid} name={kb.name} expandAll={expandAll} />
                  ))}
                </ul>
                {filteredKeyboards.length > 10 && (
                  <button
                    onClick={() => setShowAllKeyboards(!showAllKeyboards)}
                    className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    {showAllKeyboards ? 'Show Less' : `Show All ${filteredKeyboards.length} Keyboards`}
                  </button>
                )}
              </>
            ) : (
              <p className="text-gray-500 text-center py-8">No keyboards found matching "{searchQuery}"</p>
            )}
          </>
        ) : (
          <p className="text-gray-500">Loading keyboard list...</p>
        )}
      </section>

    </div>
  );
}
