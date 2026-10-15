# RM Touring Lab Three.js Migration Implementation Plan

> **For agentic workers:** Execute task-by-task. Checkboxes track progress.

**Goal:** Replace Canvas soft-3D with a bundled Three.js WebGL renderer for road + garage + props (v3.0.0), keeping game simulation and HTML UI unchanged.

**Architecture:** `touring.ts` keeps GameLoop/UI; new `src/render/webgl/*` owns Three.js scenes; `esbuild` emits one `assets/touring.js` with `three` inside; no CDN; no Canvas soft-3D fallback.

**Tech Stack:** TypeScript, Three.js r17x, esbuild, existing `game/*` physics, WordPress plugin shell.

## Global Constraints

- Version **3.0.0**; packaging **esbuild single ESM bundle**; **no CDN**
- Full migration: **road + garage + props**
- Keep `simulateStep`, input, audio, scores, HUD/CSS
- No WebGL → bilingual fail UI + home link (no soft-3D fallback)
- Arcade-soft look via `look.ts` colors → fog/lights/materials
- Spec: `docs/superpowers/specs/2026-10-15-touring-threejs-migration-design.md`

---

### Task 1: Toolchain (esbuild + three)

**Files:**
- Modify: `wp-content/plugins/ramon-touring/package.json`
- Create: `wp-content/plugins/ramon-touring/scripts/build.mjs`
- Modify: `wp-content/plugins/ramon-touring/tsconfig.json` (keep typecheck)
- Modify: tests to import from `src/` via node+tsx or keep compiling game for tests

**Steps:**
- [ ] Install `three`, `@types/three`, `esbuild`, `tsx` as devDependencies
- [ ] `build.mjs`: `tsc --noEmit` then esbuild bundle `src/touring.ts` → `assets/touring.js` (format esm, minify false for debuggability first)
- [ ] Copy CSS unchanged; stop postbuild stamp (bundle has no relative imports)
- [ ] `npm test` uses `tsx` for `tests/js` against `src/game` OR esbuild-register; update smoke to check single bundle + look markers
- [ ] Commit toolchain

---

### Task 2: WebGL bootstrap + WebGL fail path

**Files:**
- Create: `src/render/webgl/detect.ts`
- Create: `src/render/webgl/SceneApp.ts`
- Modify: `src/touring.ts` early boot

**Interfaces:**
- `detectWebGL(): boolean`
- `class SceneApp { constructor(canvas); setSize(); dispose(); get renderer(); }`

**Steps:**
- [ ] If `!detectWebGL()`, show fail HTML (ES/EN) and abort module
- [ ] SceneApp wraps WebGLRenderer + resize/DPR cap
- [ ] Commit

---

### Task 3: RoadWorld + chase camera sync

**Files:**
- Create: `src/render/webgl/path.ts` (export `curve`, `ramp` moved from world)
- Create: `src/render/webgl/RoadWorld.ts`
- Create: `src/render/webgl/Sync.ts`

**Interfaces:**
- `RoadWorld.update(state: RunState, opts: DrawOptsLike): void`
- Reuse `curve`/`ramp` math identical to current

**Steps:**
- [ ] Sky color + FogExp2 from biome/look
- [ ] Road ribbon geometry along curve for drawDistance
- [ ] PerspectiveCamera from `cameraPose`
- [ ] Wire render() in touring for road/start preview
- [ ] Commit

---

### Task 4: Vehicles

**Files:**
- Create: `src/render/webgl/Vehicles.ts`

**Steps:**
- [ ] Factory `createCar(variant, color): Group` with body, glass, wheels, lights
- [ ] Pool traffic by id; update transforms from `RunState.traffic`
- [ ] Player car sync yaw/x/d
- [ ] Commit

---

### Task 5: Props + biomes

**Files:**
- Create: `src/render/webgl/Props.ts`

**Steps:**
- [ ] Soft pine/palm/bush/rock/building/bollard as InstancedMesh or pooled Groups
- [ ] Placement rules ported from former world.ts spacing
- [ ] Commit

---

### Task 6: GarageWorld

**Files:**
- Create: `src/render/webgl/GarageWorld.ts`

**Steps:**
- [ ] Room, floor, lights, orbit camera from angle/zoom
- [ ] Same car factory at origin; hood/lights flags
- [ ] Wire garage mode in touring
- [ ] Commit

---

### Task 7: Retire Canvas path + PHP 3.0

**Files:**
- Modify: `ramon-touring.php`, `package.json` version, `readme.txt`, `config.ts` VERSION
- Delete or gut: `src/world.ts`, `src/mesh.ts` render usage; keep tests updated
- Modify: `src/touring.ts` remove drawRoad/drawGarage imports

**Steps:**
- [ ] Single modulepreload for touring.js
- [ ] Version 3.0.0
- [ ] npm test + manual browser QA
- [ ] PR merge deploy

---

## Spec coverage

| Spec section | Task |
|--------------|------|
| esbuild bundle / no CDN | 1 |
| WebGL fail | 2 |
| Road + camera | 3 |
| Cars | 4 |
| Props | 5 |
| Garage | 6 |
| Delete soft-3D / 3.0.0 | 7 |
