import { StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DeviceProvider } from './context/DeviceContext.tsx'

// Use hydrateRoot for production (with SSR), createRoot for dev (without SSR)
const rootElement = document.getElementById('root')!;

if (rootElement.hasChildNodes()) {
  // Has pre-rendered content - hydrate it
  // No need to pass initialKeyboards since the data is already in the DOM
  hydrateRoot(
    rootElement,
    <StrictMode>
      <DeviceProvider>
        <App />
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
