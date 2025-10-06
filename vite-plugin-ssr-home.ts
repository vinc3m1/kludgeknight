/**
 * Vite plugin to inject server-rendered HomePage HTML into index.html
 */

import type { Plugin } from 'vite';

export function ssrHomePlugin(): Plugin {
  return {
    name: 'ssr-home',
    apply: 'build', // Only run during build, not dev
    async closeBundle() {
      // Import fs/path only when needed (not at plugin load time)
      const { readFileSync, writeFileSync } = await import('fs');
      const { join } = await import('path');

      // Import after bundle is complete to avoid circular dependency issues
      const { generateHomePageHTML, getKeyboardsData } = await import('./scripts/generate-static-home.js');
      const homePageHTML = await generateHomePageHTML();
      const keyboards = getKeyboardsData();

      // Read the built index.html
      const indexPath = join(process.cwd(), 'dist', 'index.html');
      let html = readFileSync(indexPath, 'utf-8');

      // Inject keyboard data as a script tag
      const dataScript = `<script>window.__INITIAL_KEYBOARDS__=${JSON.stringify(keyboards)}</script>`;
      html = html.replace('</head>', `${dataScript}</head>`);

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
