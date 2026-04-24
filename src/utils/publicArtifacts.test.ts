import { test, expect } from 'bun:test';
import { readdir } from 'fs/promises';
import { join } from 'path';

const DISALLOWED_PUBLIC_EXTENSIONS = new Set([
  '.bat',
  '.bin',
  '.cmd',
  '.dll',
  '.exe',
  '.msi',
  '.upf',
]);

async function findDisallowedFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const results: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...await findDisallowedFiles(fullPath));
      continue;
    }

    const dotIndex = entry.name.lastIndexOf('.');
    const extension = dotIndex >= 0 ? entry.name.slice(dotIndex).toLowerCase() : '';
    if (DISALLOWED_PUBLIC_EXTENSIONS.has(extension)) {
      results.push(fullPath);
    }
  }

  return results;
}

test('public assets should not include executable or firmware update artifacts', async () => {
  const publicDir = join(process.cwd(), 'public');
  const disallowedFiles = await findDisallowedFiles(publicDir);

  expect(disallowedFiles).toEqual([]);
});
