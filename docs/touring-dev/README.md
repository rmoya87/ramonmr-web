# Touring dev checks (not deployed)

Run from this folder after `npm run build` in `wp-content/plugins/ramon-touring`.

- `node reach.mjs <seedFrom> <seedTo> [level 0|1|2]`: records a 5 min traffic simulation and checks, with a space-time search, that a continuous path (hull 1.84x4.3 m, 6 m/s lateral, keep/ease/brake) exists for every 5 s window. Reports dead ends and compares with the old three-lane test.
- `node reach_sanity.mjs`: the search must report a wall for three static buses and a path for a 3.5 m gap.

`physics-test.mjs` in the plugin holds S6 (free corridor), S7 (hull geometry), S8 (rotated hulls vs independent overlap) and S9 (bus/truck lane changes, which vehicle touched).
