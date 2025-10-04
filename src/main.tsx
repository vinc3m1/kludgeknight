import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DeviceProvider } from './context/DeviceContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeviceProvider>
      <App />
    </DeviceProvider>
  </StrictMode>,
)
