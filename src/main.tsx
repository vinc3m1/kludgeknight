import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DeviceProvider } from './context/DeviceContext.tsx'

// Get initial keyboards data from SSR (if available)
const initialKeyboards = (window as typeof window & {
  __INITIAL_KEYBOARDS__?: Array<{ pid: string; name: string }>;
}).__INITIAL_KEYBOARDS__;

// Use hydrateRoot for production (with SSR), createRoot for dev (without SSR)
const rootElement = document.getElementById('root')!;

if (rootElement.hasChildNodes()) {
  // Has pre-rendered content - hydrate it
  hydrateRoot(
    rootElement,
    <StrictMode>
      <DeviceProvider>
        <App initialKeyboards={initialKeyboards} />
      </DeviceProvider>
    </StrictMode>,
  );
} else {
  // Empty root - dev mode, just render normally
  const { createRoot } = await import('react-dom/client');
  createRoot(rootElement).render(
    <StrictMode>
      <DeviceProvider>
        <App initialKeyboards={initialKeyboards} />
      </DeviceProvider>
    </StrictMode>,
  );
}
