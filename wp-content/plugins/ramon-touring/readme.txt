=== Ramon Touring ===
Contributors: rmoya87
Requires at least: 6.5
Requires PHP: 8.1
Stable tag: 1.1.0
License: GPLv2 or later

Optional driving mode for ramonmr.com. The normal WordPress site remains the default.

== Installation ==
Install the ramon-touring directory as its own plugin. Activation is a separate, explicit deployment step. Activation creates only the plugin score table; no existing content or settings are changed.

== Content ==
The catalog uses published, non-password-protected public post types and Polylang's current language. Attachments and private content are excluded. Services, CV, projects, articles and contact have their own exits. Other published pages remain available in More pages. Full canonical WordPress pages are opened inside the workshop, with normal rendering, links, cookie consent and forms. There is always a separate full-page link. Content is not duplicated in JavaScript.

== Accessibility and privacy ==
The game does not start automatically. Read without driving reaches every section. Buttons, keyboard controls, a labeled page selector, iframe title, pause, focus indicators and non-driving links are provided. Moving counters are not live announcements. The normal site's accessibility and cookie behavior remain unchanged. No external libraries, telemetry, new cookies, API credentials or analytics are added. Voluntarily submitted public scores persist in the plugin table described below. The full page reader keeps the website's own consent controls.

== Removal ==
Deactivate the plugin to remove its entry link and game view. No existing content restoration is needed. The plugin score table is retained, not deleted. Existing canonical pages remain available. Files can then be removed by the approved deployment procedure.

== Build ==
The checked-in assets/mesh.js and assets/world.js are compiled from src/*.ts using TypeScript targeting ES2020 modules. No CDN or runtime build dependency is used. assets/touring.js is the standalone browser controller. assets/touring.css is scoped to #rm-touring.

== 1.1.0 ==
* Right-side Mode Web/Game switch replaces the native theme social rail while this plugin is active. Web remains default; no preference stored. Deactivation restores original rail. Mobile control is bottom-right; reader-expanded hides it to avoid overlap.
* Expand reader to the viewport without replacing its iframe. Reader-only native header/footer presentation; normal site untouched.
* Earlier exit sign, lane arrows and route cue; wider exit capture area.
* Three road landscape palettes with deterministic roadside props and moderate curvature/roll.
* Active-time difficulty: level each 30 seconds, automatic target speed rising from 185 to 300 km/h. Brake remains available. Three traffic impacts end the run.
* Distance points plus overtaking/combo bonus. Paused and workshop time do not raise difficulty.
* Public top 10, shared across languages, only alias/score/date. Alias 3-12 ASCII letters/numbers/space/hyphen/underscore. Visitors explicitly submit after game over.
* Creates only prefix_rm_touring_scores on activation. Stores alias, score, UTC date and a one-use run-token hash, not account/email/IP. Does not delete records on deactivation or uninstall.
* REST run token is HMAC signed; submission checks origin, duration (15s-1h), integer score bounds, one-use token, and best-effort global throttle at 30 saved scores/minute (not atomic). These are abuse deterrents, not server-authoritative anti-cheat. Visitor-controlled clients can still forge plausible scores.
* No audio, third-party services or cookie/localStorage requirement. Standard server logs may still exist outside this plugin.
* Rollback: deactivate plugin, purge cache, restore 1.0 files; preserve own score table. Existing content and other plugins' tables unchanged.
