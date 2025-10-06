import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DeviceProvider } from './context/DeviceContext.tsx'
import { getRKDevices } from './utils/rkConfig.ts'

// Use hydrateRoot for production (with SSR), createRoot for dev (without SSR)
const rootElement = document.getElementById('root')!;

if (rootElement.hasChildNodes()) {
  // Has pre-rendered content - hydrate it
  // MUST pass same initialKeyboards prop as SSR to avoid hydration mismatch
  const devices = await getRKDevices();
  const keyboards = Array.from(devices.entries()).map(([pid, name]) => ({ pid, name }));
  hydrateRoot(
    rootElement,
    <StrictMode>
      <DeviceProvider>
        <App initialKeyboards={keyboards} />
      </DeviceProvider>
    </StrictMode>,
  );
} else {
  // Empty root - dev mode, just render normally
  const { createRoot } = await import('react-dom/client');
  createRoot(rootElement).render(
    <StrictMode>
      <DeviceProvider>
        <App />
      </DeviceProvider>
    </StrictMode>,
  );
}
