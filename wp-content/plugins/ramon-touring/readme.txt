=== Ramon Touring ===
Contributors: rmoya87
Requires at least: 6.5
Requires PHP: 8.1
Stable tag: 1.0.0
License: GPLv2 or later

Optional driving mode for ramonmr.com. The normal WordPress site remains the default.

== Installation ==
Install the ramon-touring directory as its own plugin. Activation is a separate, explicit deployment step. No activation/deactivation hook changes options, rewrites, posts or content.

== Content ==
The catalog uses published, non-password-protected public post types and Polylang's current language. Attachments and private content are excluded. Services, CV, projects, articles and contact have their own exits. Other published pages remain available in More pages. Full canonical WordPress pages are opened inside the workshop, with normal rendering, links, cookie consent and forms. There is always a separate full-page link. Content is not duplicated in JavaScript.

== Accessibility and privacy ==
The game does not start automatically. Read without driving reaches every section. Buttons, keyboard controls, a labeled page selector, iframe title, pause, focus indicators and non-driving links are provided. Moving counters are not live announcements. The normal site's accessibility and cookie behavior remain unchanged. No external libraries, telemetry, storage, new cookies, API credentials or analytics are added by this plugin. The full page reader keeps the website's own consent controls.

== Removal ==
Deactivate the plugin to remove its entry link and game view. No content or database restoration is needed. Existing canonical pages remain available. Files can then be removed by the approved deployment procedure.

== Build ==
The checked-in assets/mesh.js and assets/world.js are compiled from src/*.ts using TypeScript targeting ES2020 modules. No CDN or runtime build dependency is used. assets/touring.js is the standalone browser controller. assets/touring.css is scoped to #rm-touring.
