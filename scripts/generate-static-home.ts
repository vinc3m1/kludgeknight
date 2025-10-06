/**
 * Generate static HTML for HomePage at build time
 * Uses the same parsing logic as runtime code
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { parseCfgIni } from '../src/utils/rkConfig.js';

// Make React available globally for JSX compiled code
(globalThis as typeof globalThis & { React: typeof React }).React = React;

// Helper to get keyboards data (shared between HTML generation and data export)
export function getKeyboardsData(): Array<{ pid: string; name: string }> {
  const cfgPath = join(process.cwd(), 'public', 'rk', 'Cfg.ini');
  const buffer = readFileSync(cfgPath);
  const decoder = new TextDecoder('utf-16le');
  const text = decoder.decode(buffer);
  const devices = parseCfgIni(text);
  return Array.from(devices.entries()).map(([pid, name]) => ({ pid, name }));
}

export function generateHomePageHTML(): string {
  const keyboards = getKeyboardsData();

  // Import and render full App tree (matches browser hydration structure)
  // Note: Using dynamic import to avoid SSR issues with other components
  return new Promise((resolve) => {
    Promise.all([
      import('../src/App.tsx'),
      import('../src/context/DeviceContext.tsx')
    ]).then(([AppModule, DeviceContextModule]) => {
      const App = AppModule.default;
      const DeviceProvider = DeviceContextModule.DeviceProvider;

      if (!App) {
        throw new Error('App is undefined - check default export');
      }
      if (!DeviceProvider) {
        throw new Error('DeviceProvider is undefined - check named export');
      }
      // Render the full app tree with keyboard data
      // Since there's no device in SSR, App will render HomePage with initial data
      const html = renderToString(
        createElement(DeviceProvider, {},
          createElement(App, { initialKeyboards: keyboards })
        )
      );
      resolve(html);
    });
  });
}
