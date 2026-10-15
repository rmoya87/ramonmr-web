# RM Touring Lab — Three.js / WebGL migration (design)

**Status:** approved — implementing 3.0.0  
**Date:** 2026-10-15  
**Version target:** 3.0.0  
**Decisions locked:** Option B (WebGL/Three.js), full migration (road + garage + props), packaging **A (esbuild bundle)**

## 1. Goal

Replace the Canvas 2D soft-3D renderer with a Three.js WebGL renderer so vehicles, road, and workshop read as a coherent arcade-soft 3D game, without changing gameplay systems (physics, traffic AI, missions, scores, menus).

Success criteria:

- Road mode and garage mode both render via WebGL.
- Player + traffic cars use distinct Three.js meshes/materials (not flat prism bricks).
- Props (trees, rocks, buildings, bollards, signs) are 3D instances with shared materials.
- Arcade-soft look (warm horizon, fog, shared palette from current `look.ts` language).
- No CDN; single bundled `assets/touring.js` via esbuild.
- No WebGL → clear message + link to normal site (no fallback to cutre Canvas soft-3D).
- Existing HUD/CSS/dialogs and `simulateStep` loop unchanged in behavior.

## 2. Non-goals (3.0)

- Photoreal PBR / Unreal-level assets.
- Physics engine rewrite (keep current fixed-dt arcade physics).
- Multiplayer, new missions, or catalog/API changes.
- Keeping the old soft-3D path as a quality toggle.

## 3. Architecture

```
touring.ts                 UI shell, GameLoop, Input, Audio, Save
  └─ game/*               UNCHANGED simulation (GameManager, Vehicle, Traffic, Route, …)
  └─ render/webgl/*       NEW Three.js presentation
        SceneApp.ts       create/dispose renderer, resize, DPR, quality
        RoadWorld.ts      road ribbon, skirts, water, fog, sky, sun
        GarageWorld.ts    workshop floor/walls/lights + orbit camera
        Vehicles.ts       player + traffic mesh factories (sport/sedan/van/truck/slow)
        Props.ts          pines, palms, bushes, rocks, buildings, bollards, signs
        Sync.ts           map RunState → object transforms each frame
  └─ look.ts              keep as color/fog bible → feed Three materials/fog/lights
```

**Removed from hot path:** `drawRoad` / `drawGarage` Canvas projector usage.  
**Retained temporarily:** pure helpers still needed (`curve`, `ramp`, section labels) — move to `game/RouteGeometry.ts` or `render/webgl/path.ts` so `world.ts`/`mesh.ts` can be deleted or reduced to tests-only shims.

## 4. Packaging / build

Current: `tsc` → many ESM files + `postbuild.mjs` version stamps.

Target:

1. `tsc --noEmit` (typecheck).
2. `esbuild src/touring.ts --bundle --format=esm --outfile=assets/touring.js`  
   - Bundle `three` into the output (no CDN).  
   - Externalize nothing for the game entry (WordPress loads one module).  
3. CSS remains `assets/touring.css` (unchanged load).
4. PHP: load `touring.js?v=3.0.0` only; drop multi-`modulepreload` list of game chunks (or preload just the bundle).
5. DevDependency: `three`, `@types/three`, `esbuild`.
6. Tests: keep node tests for game logic; add a small smoke that the bundle exists and exports/boot markers remain; WebGL visual checks remain browser-manual or optional headless later.

## 5. Runtime integration

### 5.1 Mount

- Road canvas: reuse `.race-screen canvas` — Three.js `WebGLRenderer({ canvas, antialias: true })`.
- Garage canvas: reuse workshop orbit canvas the same way.
- On `show('start'|'road'|'garage')`: ensure the correct scene is active; start screen keeps live road preview (WebGL) behind the card (same UX as 2.x).

### 5.2 Frame loop

Keep `GameLoop`:

- `update` → `simulateStep` (unchanged).
- `render` → `webgl.sync(runState, opts)` + `renderer.render(scene, camera)` instead of `drawRoad`/`drawGarage`.

### 5.3 Camera

Port chase poses from `CameraController.cameraPose` into Three.js `PerspectiveCamera` (position/target/FOV). Garage keeps orbit angle/zoom from existing UI.

### 5.4 Quality

Map `PerformanceManager` presets to:

- `renderer.setPixelRatio` cap  
- draw distance / fog far  
- prop instance count / traffic mesh LOD (hide far traffic)  
- shadow map on/off (default off or cheap for mobile)

## 6. Visual systems (arcade soft)

| System | Approach |
|--------|----------|
| Sky | Hemisphere + directional sun; optional gradient sky dome or fog color matching `look` sky stops |
| Fog | `FogExp2` or linear fog tinted with biome haze |
| Road | Extruded/ribbon geometry along `curve(d)`; asphalt + chalk lane materials; verge strips |
| Exit ramp | Separate ribbon using `ramp(t)` when in fork window |
| Ground skirts | Wide side planes / mesh bands matching ground palette (no void edges) |
| Water | Far-left band mesh, only coast/beach biomes |
| Player car | Group: body, cabin glass (MeshPhysicalMaterial transparent), wheels, lights |
| Traffic | Same factory with `variant`; pool/reuse meshes by id |
| Props | InstancedMesh where possible; biome-driven placement using existing spacing rules |
| Signs | Plane + canvas texture for section name (port current text sign) |
| Garage | Box room, checkered floor, area lights, same car factory at origin |

## 7. Compatibility & failure

- Feature detect `WebGLRenderingContext` / `WebGL2` before boot.
- On failure: replace app mount with bilingual error + retry + home link (same pattern as current load timeout).
- iOS/Safari: request context with powerPreference default; respect `reduceMotion` (less FOV punch, no rain particles).

## 8. Migration steps (implementation order)

1. Build toolchain (esbuild + three) producing one bundle; PHP preload simplified.  
2. `SceneApp` + empty lit scene on road canvas (smoke).  
3. Road ribbon + chase camera synced to `RunState`.  
4. Player car mesh + glass/wheels.  
5. Traffic pool sync.  
6. Props + biomes/fog.  
7. Garage world + orbit.  
8. Start-screen live preview.  
9. Delete/retire Canvas soft-3D render path; bump 3.0.0; update readme.  
10. Manual QA on desktop + mobile Safari/Chrome.

## 9. Risks

| Risk | Mitigation |
|------|------------|
| Bundle size | Tree-shake three; avoid unused examples; gzip ~150–250KB expected |
| Mobile GPU | Cap DPR≤2, shadows off on low, prop budgets |
| Parity bugs (exit capture, curve) | Reuse exact `curve`/`ramp` math; keep physics tests |
| Regression in HUD/start | No HTML rewrites beyond canvas ownership |

## 10. Testing

- Keep all `tests/js/*` physics/missions tests (import from `src` via esbuild-node or keep compiling game modules for tests).  
- Prefer: esbuild also emits nothing for tests; tests import `src/game/*.ts` through `tsx`/`node --experimental-strip-types` OR keep `tsc` emit of `game/` only for tests. **Decision for plan:** use `tsx`/`node --import tsx` for game unit tests against `src/`, and bundle only for browser entry.  
- Visual: browser checklist (start preview, drive, garage orbit, exit sign, no WebGL message).

## 11. Open points (non-blocking)

- Exact Three r17x version pin at implementation time.  
- Whether rain/particles stay 2D overlay on top of WebGL canvas or Three points — prefer light Three points or skip in 3.0 if costly.
