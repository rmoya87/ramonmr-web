import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const php = readFileSync(new URL('../../ramon-touring.php', import.meta.url), 'utf8');
const css = php.match(/function rm_touring_mode_css\(\) \{\s*return '([^']+)'/)[1];
test('mode selector does not reserve a mobile body column', () => {
  assert.doesNotMatch(css, /padding-right\s*:/);
});
test('mode selector stays below site header and hides with the mobile menu', () => {
  assert.match(css, /#rm-mode-pill\{[^}]*z-index:19;/);
  assert.match(css, /html\.has-modal-open #rm-mode-pill\{display:none\}/);
});
test('mode selector keeps the vertical mobile layout and accessible switch', () => {
  assert.match(css, /@media\(max-width:700px\)/);
  assert.match(css, /writing-mode:vertical-rl/);
  assert.match(php, /role="switch" aria-checked=/);
});
