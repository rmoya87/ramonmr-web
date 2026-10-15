/**
 * Headless gates for look bible + path math + vehicle factory (src via compiled assets).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const assets = join(root, 'assets');

describe('Look + path (3.0)', () => {
  it('look bible exports shared materials', async () => {
    const { LOOK, mixHex, fogToward } = await import(join(assets, 'look.js'));
    assert.equal(LOOK.glass.tint, '#1e3a4c');
    assert.equal(LOOK.asphalt.day.length, 7);
    assert.equal(mixHex('#000000', '#ffffff', 0.5), '#808080');
    assert.ok(fogToward('#5c646c', '#e8dcc8', 200).startsWith('#'));
  });

  it('path curve/ramp match legacy arcade math', async () => {
    const { curve, ramp } = await import(join(assets, 'render/webgl/path.js'));
    assert.ok(Math.abs(curve(0)) < 1e-9);
    assert.ok(Math.abs(ramp(0) - 4.6) < 1e-9);
    assert.ok(ramp(100) > ramp(0));
  });

  it('traffic spawn gaps stay playable', async () => {
    const { createInitialTraffic } = await import(join(assets, 'game/TrafficManager.js'));
    const { TRAFFIC } = await import(join(assets, 'game/config.js'));
    const { traffic } = createInitialTraffic('arcade');
    assert.ok(traffic.length >= 6);
    const sorted = traffic.slice().sort((a, b) => a.d - b.d);
    assert.ok(sorted[0].d >= 100);
    assert.ok(TRAFFIC.minGap >= 36);
  });
});

describe('WebGL entry contract', () => {
  it('bundle advertises webgl build', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const src = readFileSync(join(assets, 'touring.js'), 'utf8');
    assert.match(src, /webgl\+esbuild/);
    assert.match(src, new RegExp(`ramon-touring ${pkg.version.replace(/\./g, '\\.')} webgl\\+esbuild`));
  });
});
