/**
 * Headless smoke checks for built modules (no full browser WordPress).
 * Documents what CI can verify without a live site.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('Built assets present', () => {
  for (const f of ['assets/touring.js', 'assets/world.js', 'assets/mesh.js', 'assets/look.js', 'assets/touring.css', 'assets/game/GameManager.js']) {
    it(f, () => assert.ok(existsSync(join(root, f)), f));
  }
});

describe('No auto-start boot', () => {
  it('touring.js shows start mode without forcing road', () => {
    const src = readFileSync(join(root, 'assets/touring.js'), 'utf8');
    assert.match(src, /show\(['"]start['"]\)/);
    assert.doesNotMatch(src, /root\.dataset\.mode=['"]road['"];mode=['"]road['"]/);
  });
});

describe('Reader link restored', () => {
  it('includes canonical web link markup', () => {
    const src = readFileSync(join(root, 'assets/touring.js'), 'utf8');
    assert.match(src, /data-reader-link/);
  });
});

describe('ESM cache bust', () => {
  it('stamps relative imports with package version', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const src = readFileSync(join(root, 'assets/touring.js'), 'utf8');
    assert.match(src, new RegExp(`from '\\./world\\.js\\?v=${pkg.version.replace(/\./g, '\\.')}'`));
  });
});
