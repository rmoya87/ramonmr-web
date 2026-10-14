# RM Touring Lab 2.0 — Auditoría técnica (línea base 1.3.0)

## Arquitectura actual (pre-2.0)

- Shell WordPress: `ramon-touring.php` (`?rm_drive=1`), catálogo Polylang, pill Web/Game.
- Controlador monolítico: `assets/touring.js` (estado, física, tráfico, score, UI, taller, REST).
- Render: Canvas 2D software 3D (`mesh.js` + `world.js`). Sin Three.js/WebGL.
- Scores: REST `ramon-touring/v1` + tabla `{prefix}rm_touring_scores`.

## Funcionalidades existentes

Puntuación/combos/niveles/3 vidas, top 10, salidas → taller con iframe WP, 3 ambientes, controles táctiles, Polylang, deploy IONOS vía GitHub Actions.

## Problemas reproducibles

1. Auto-start al final de `touring.js` contradice docs y UI de inicio voluntario.
2. `src/world.ts` desfasado respecto a `assets/world.js` (environments, yaw, slip, señales).
3. Enlace “Abrir en la web normal” eliminado del DOM.
4. Fórmulas de velocidad distintas entre cliente (`195+time*0.85`) y tests (`185+time*0.65`).
5. `readme.txt` declara Stable tag 1.1.0; código es 1.3.0.
6. Física con `dt` acotado pero sin timestep fijo ni interpolación.

## Decisión de motor

**Evolucionar Canvas 2D.** Three.js no aporta suficiente beneficio frente al coste de migración y tamaño de bundle para este plugin WordPress.

## Componentes reutilizables

`mesh` (primitivas + renderer), `curve`/`ramp`/`drawRoad`/`drawGarage`, catálogo PHP, API scores, tests de contrato.

## Riesgos

- Refactor del controlador puede romper taller/iframe.
- Cambiar fórmula de score requiere versionado de clasificación.
- Deploy automático en merge a `main`.

## Mediciones iniciales

- Sin telemetría de FPS en 1.3.0; el canvas expone `data-draw-ms`.
- Objetivo 2.0: perfiles de calidad + medición en `PerformanceManager`.
