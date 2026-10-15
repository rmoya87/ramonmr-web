=== Ramon Touring ===
Contributors: rmoya87
Requires at least: 6.5
Requires PHP: 8.1
Stable tag: 2.0.6
License: GPLv2 or later

Optional RM Touring Lab driving mode for ramonmr.com. The normal WordPress site remains the default.

== Installation ==
Install the ramon-touring directory as its own plugin. Activation is a separate, explicit deployment step. Activation creates/updates only the plugin score table; no existing content or settings are changed.

== Content ==
The catalog uses published, non-password-protected public post types and Polylang's current language. Attachments and private content are excluded. Services, CV, projects, articles and contact have their own exits. Other published pages remain available in More pages. Full canonical WordPress pages open inside the workshop, with normal rendering, links, cookie consent and forms. There is always a separate full-page link. Content is not duplicated in JavaScript. Destinations can be hidden from the game via Settings → RM Touring Lab.

== Accessibility and privacy ==
The game does not start automatically. Arcade, Explore and Read-without-driving are explicit choices. Buttons, keyboard controls, gamepad (optional), labeled page selector, iframe title, pause, focus indicators and non-driving links are provided. Moving counters are not live announcements. Reduce-motion and mute preferences are stored locally. No external libraries, telemetry, new cookies, API credentials or analytics are added. Voluntarily submitted public scores persist in the plugin table. The full page reader keeps the website's own consent controls.

== Build ==
TypeScript sources in src/ (mesh.ts, world.ts, touring.ts, game/*) compile to assets/ with `npm run build` (ES2020 modules). No CDN or runtime build dependency. assets/touring.css is scoped to #rm-touring.

== Rollback ==
Deactivate the plugin, purge cache, restore previous plugin files from deployment backup; preserve the score table. Existing content and other plugins remain unchanged.

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
