/**
 * Headless smoke checks for the bundled WebGL entry.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

describe('Built assets present', () => {
  for (const f of ['assets/touring.js', 'assets/touring.css', 'assets/game/GameManager.js']) {
    it(f, () => assert.ok(existsSync(join(root, f)), f));
  }
});

describe('WebGL bundle', () => {
  it('ships a single esbuild bundle with Three and start gate', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const src = readFileSync(join(root, 'assets/touring.js'), 'utf8');
    assert.match(src, new RegExp(`ramon-touring ${pkg.version.replace(/\./g, '\\.')} webgl\\+esbuild`));
    assert.match(src, /WebGLRenderer/);
    assert.match(src, /\(\s*["']start["']\s*\)/); // show("start") after minify rename
    assert.match(src, /start-screen/);
    assert.match(src, /data-reader-link/);
    assert.match(src, /Touring \$\{[^}]+\} webgl|Touring .* webgl/);
    assert.ok(src.length > 200_000, 'bundle should include three.js');
  });
});
