/**
 * Vite plugin to inject server-rendered HomePage HTML into index.html
 *
 * IMPORTANT: This file must not import any source files at the top level!
 * All imports must be lazy-loaded inside closeBundle() to prevent Vite from
 * tracking them as config dependencies, which would cause full server restarts
 * on every file change during development.
 */

import type { Plugin } from 'vite';

export function ssrHomePlugin(): Plugin {
  return {
    name: 'ssr-home',
    apply: 'build', // Only run during build, not dev
    async closeBundle() {
      // Import fs/path/dependencies ONLY here, not at module level!
      // This prevents Vite from tracking source files as config dependencies
      const { readFileSync, writeFileSync } = await import('fs');
      const { join } = await import('path');
      const { generateHomePageHTML } = await import('./scripts/generate-static-home.js');
      const homePageHTML = await generateHomePageHTML();

      // Read the built index.html
      const indexPath = join(process.cwd(), 'dist', 'index.html');
      let html = readFileSync(indexPath, 'utf-8');

      // Replace <div id="root"></div> with <div id="root">{rendered HTML}</div>
      html = html.replace(
        '<div id="root"></div>',
        `<div id="root">${homePageHTML}</div>`
      );

      // Write back
      writeFileSync(indexPath, html, 'utf-8');

      console.log('✓ Injected server-rendered HomePage into index.html');
    }
  };
}
