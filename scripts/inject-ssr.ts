/**
 * Post-build script to inject server-rendered HomePage HTML into index.html
 * Run after `vite build` to add SSR content to the built output
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateHomePageHTML } from './generate-static-home.js';

async function injectSSR() {
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

injectSSR().catch(console.error);
