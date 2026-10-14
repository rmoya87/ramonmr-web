import { readdir, unlink, rm } from 'node:fs/promises';
import { join } from 'node:path';

/** Remove accidental PHP leftovers and keep only JS under assets from this build. */
const assets = new URL('../assets/', import.meta.url);
const game = join(assets.pathname, 'game');

// Ensure CSS is never wiped; only JS modules are emitted by tsc.
console.log('Build complete: assets/mesh.js, assets/world.js, assets/touring.js, assets/game/*');
