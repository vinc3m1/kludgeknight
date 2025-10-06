/**
 * Generate static HTML for HomePage at build time
 * Uses the same parsing logic as runtime code
 */

import React from 'react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { getRKDevices } from '../src/utils/rkConfig.js';

// Make React available globally for JSX compiled code
(globalThis as typeof globalThis & { React: typeof React }).React = React;

export async function generateHomePageHTML(): Promise<string> {
  const devices = await getRKDevices();
  const keyboards = Array.from(devices.entries()).map(([pid, name]) => ({ pid, name }));

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
