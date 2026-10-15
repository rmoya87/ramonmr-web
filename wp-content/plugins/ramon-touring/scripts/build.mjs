import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// Emit game modules for node tests; browser entry is overwritten by the bundle.
execSync('npx tsc -p tsconfig.json', { cwd: root, stdio: 'inherit' });

await build({
  entryPoints: [join(root, 'src/touring.ts')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  outfile: join(root, 'assets/touring.js'),
  sourcemap: false,
  minify: true,
  logLevel: 'info',
});

const out = join(root, 'assets/touring.js');
const code = readFileSync(out, 'utf8');
writeFileSync(out, `/* ramon-touring ${pkg.version} webgl+esbuild */\n` + code);

console.log(`Build complete: assets/touring.js v=${pkg.version} (Three.js bundled)`);
