=== Ramon Touring ===
Contributors: rmoya87
Requires at least: 6.5
Requires PHP: 8.1
Stable tag: 3.0.8
License: GPLv2 or later

Optional RM Touring Lab driving mode for ramonmr.com. The normal WordPress site remains the default.

== Installation ==
Install the ramon-touring directory as its own plugin. Activation is a separate, explicit deployment step. Activation creates/updates only the plugin score table; no existing content or settings are changed.

== Content ==
The catalog uses published, non-password-protected public post types and Polylang's current language. Attachments and private content are excluded. Services, CV, projects, articles and contact have their own exits. Other published pages remain available in More pages. Full canonical WordPress pages open inside the workshop, with normal rendering, links, cookie consent and forms. There is always a separate full-page link. Content is not duplicated in JavaScript. Destinations can be hidden from the game via Settings → RM Touring Lab.

== Accessibility and privacy ==
The game does not start automatically. Arcade, Explore and Read-without-driving are explicit choices. Buttons, keyboard controls, gamepad (optional), labeled page selector, iframe title, pause, focus indicators and non-driving links are provided. Moving counters are not live announcements. Reduce-motion and mute preferences are stored locally. No external libraries, telemetry, new cookies, API credentials or analytics are added. Voluntarily submitted public scores persist in the plugin table. The full page reader keeps the website's own consent controls.

== Build ==
TypeScript in src/ typechecks with tsc; the browser entry is an esbuild ESM bundle (`assets/touring.js`) that includes Three.js. No CDN. `assets/touring.css` is scoped to #rm-touring. Requires WebGL.

== Rollback ==
Deactivate the plugin, purge cache, restore previous plugin files from deployment backup; preserve the score table. Existing content and other plugins remain unchanged.

== 3.0.8 ==
* Denser traffic and faster arcade ramp that packs until crashes; opaque sealed car bodies.
* Far hills no longer cover approaching exit signs.

== 3.0.7 ==
* Scrolling lane dashes (world-distance phase); cars locked upright; sealed car meshes.
* Player blinks while invulnerable after a hit.

== 3.0.6 ==
* Cars face forward (no sideways ribbon yaw); thinner edge lines; two clear dashed lane splits.
* Exit signs with posts at ~280 m and ~110 m, billboarded to the camera.

== 3.0.5 ==
* Three-lane road: dashed dividers at ±2 only (no center stripe).
* Steeper difficulty: ~55s/level, speed & traffic density climb hard toward level 10.
* Player/traffic cars get opaque roofs, pillars and proper window glass.

== 3.0.4 ==
* Brighter car paint (less metalness), traffic follows road heading without sideways poses.
* Roadside props/traffic fade in from the horizon and out past the camera instead of popping.

== 3.0.3 ==
* Fix left/right for real: mirror chase projection (previous world-X flip canceled itself).
* Higher visual quality: ACES tone map, soft shadows, asphalt grain, guardrails, denser roadside.

== 3.0.2 ==
* Fix chase-camera X mirror so left/right steering matches the screen.
* Faster arcade top speed and stronger speed sensation (FOV / camera pullback).
* Richer road (lane dashes, wear), denser props, sky dome and improved car meshes.

== 3.0.1 ==
* Fix road ribbon face winding so asphalt/verge render under the chase camera.
* Dispose lane-mark meshes on rebuild; solid edge lines.

== 3.0.0 ==
* WebGL/Three.js renderer for road, garage and props (arcade-soft materials + fog).
* Single esbuild bundle (Three.js vendored in touring.js); no Canvas soft-3D fallback.
* Physics, HUD and WordPress catalog unchanged.

== 2.1.2 ==
* Hero GT car mesh (r9): denser silhouette, grille, chrome, mirrors, rimmed wheels.
* Traffic variants (sport/sedan/van/truck/slow) with distinct body shapes.

== 2.1.1 ==
* Denser palm canopies (no T-pole silhouette); stronger warm horizon band.

== 2.1.0 ==
* Arcade-soft look bible (`look.ts`): one palette for sky, ground, asphalt, foliage, glass.
* Unified atmosphere painter; fog-tinted road strips; chunky soft props (no stick poles).
* Warm grade + shared glass language; garage matches the same mood.

== 2.0.15 ==
* Hide race HUD on the start screen (data-mode on app + racer); keep live road preview clean.

== 2.0.14 ==
* Live road preview behind the start card (no empty void while loading instructions).
* Continuous hillside ribbons, far-left water, props clear of water; softer lateral vignette.
* Car r7 glass/reflections more visible from chase cam; snappier steering; wider traffic gaps.
* Modulepreload for ES modules; headless render-quality gates in tests/visual.

== 2.0.13 ==
* Full-bleed ground and wider terrain skirts so laterals no longer look cut off.

== 2.0.12 ==
* Car windows with sky/specular reflections; glossy paint stripes on player and traffic.

== 2.0.11 ==
* Continuous 3D road under the car (no 2D/3D seam); smoother hills and roadside props.

== 2.0.10 ==
* Cache-bust relative ES module imports so updates never leave a blank “Cargando…” screen.
* Loading timeout with retry if the game shell fails to mount.

== 2.0.9 ==
* Clear right-side posts through the exit ramp (no poles on the exit).
* Smoother look: higher canvas DPR, edge AA, cylindrical props, softer asphalt/car.

== 2.0.8 ==
* 2D road bed + stricter near-plane cull so asphalt never wipes the sky.
* Pill HUD wins over legacy square selectors; rounded car prism silhouette.

== 2.0.7 ==
* Fix asphalt behind camera filling the screen; restore sky/road.
* Rounded HUD language; softer car silhouette; safer canvas sizing.

== 2.0.6 ==
* Sharp full-resolution canvas (DPR-aware); remove 900px pixel-art upscale.

== 2.0.5 ==
* Mid-distance chase camera; remove yellow center line.
* Visual refresh: biomes, sky haze, road, props, HUD glass panels.

== 2.0.4 ==
* Classic close chase camera so the player car fills the lower frame.
* Richer car/road graphics; tuned physics, traffic density and speed ramp.
* Workshop: taller poster, square expand icon, remove “full page” fallback text.

== 2.0.3 ==
* Menu hamburger icon; remove Arcade/Explore menu entries and RM/TOURING labels.
* Chase camera pulled back so the player car is visible; workshop left tools restored.
* Game-over screen redesigned: save beside alias, return to web version.

== 2.0.2 ==
* Game mode opens on driving instructions with a Play button (no marketing splash).

== 2.0.1 ==
* Chase camera always shows the driven car; camera toggle removed.
* HUD: help next to pause, menu top-right, lives height aligned, bottom cues lower.
* Easier exit capture; clearer exit-sign lettering; empty workshop panel removed.
* Mode Web/Game chip text faces toward the page (left).

== 2.0.0 ==
* Modular TypeScript architecture with fixed 60 Hz simulation timestep.
* Explicit start screen: Arcade, Explore, Read without driving, Instructions.
* Arcade traffic AI (types, follow, lane changes), exploration mode without life game-over.
* Missions, combos, local progression/unlocks, run resume after workshop.
* Biomes (coast/forest/city/desert/snow), weather overlays, quality profiles, procedural audio.
* Score version 2 board; legacy scores retained. Server ceiling aligned with client formula.
* Admin settings for exit warn distance and destination visibility.
* Restored canonical “open on regular website” reader link. Sources and assets kept in sync.

== 1.3.0 ==
* Environments, HUD icons, workshop poster reader, yaw/slip presentation.

== 1.1.0 ==
* Explicit start modal, desktop viewport shell, Mode Web/Game pill, public top 10 scores.
