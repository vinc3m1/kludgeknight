import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: '/',
  server: {
    // HTTPS only needed for network access, localhost works with HTTP for WebHID
    https: process.env.HTTPS === 'true',
    host: true,
    port: 5173
  }
})
