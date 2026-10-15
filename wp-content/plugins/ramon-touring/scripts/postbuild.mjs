import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = join(root, 'assets');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const version = pkg.version;

async function collectJs(dir) {
  const out = [];
  for (const name of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...(await collectJs(p)));
    else if (name.name.endsWith('.js')) out.push(p);
  }
  return out;
}

/** Bust browser caches on relative ESM imports (./x.js → ./x.js?v=…). */
const importRe = /(from\s+['"])(\.[^'"]+\.js)(['"])/g;
let stamped = 0;
for (const file of await collectJs(assets)) {
  const src = await readFile(file, 'utf8');
  const next = src.replace(importRe, (_, a, spec, b) => {
    const clean = spec.replace(/\?v=[^'"]*$/, '');
    stamped++;
    return `${a}${clean}?v=${version}${b}`;
  });
  if (next !== src) await writeFile(file, next);
}

console.log(`Build complete: assets stamped with v=${version} (${stamped} imports)`);
