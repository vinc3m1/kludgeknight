import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
  ],
  output: 'static',
  site: 'https://vinc3m1.github.io',
  base: '/',
  server: {
    port: 5173,
    host: true,
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      https: process.env.HTTPS === 'true',
    },
    resolve: {
      alias: {
        '@': path.resolve('./src'),
      },
    },
  },
});
