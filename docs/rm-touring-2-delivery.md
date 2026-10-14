# RM Touring Lab 2.0 — Entrega

## Resumen ejecutivo

El plugin `ramon-touring` pasa de 1.3.0 a **2.0.0**: arquitectura modular TypeScript, física a 60 Hz, modos Arcade/Exploración, tráfico con IA, biomas/clima, misiones, audio procedimental, recuperación de partida, ajustes de administración y CI propia. Motor gráfico: **Canvas 2D evolucionado** (sin Three.js).

## Arquitectura

- Entry: `src/touring.ts` → `assets/touring.js`
- Núcleo: `src/game/*` (GameLoop, Vehicle, Traffic, Collision, Score, Mission, Save, Audio, Performance, Environment, Route, Camera)
- Render: `src/mesh.ts`, `src/world.ts`
- WP: `ramon-touring.php`, `src/scores.php`, `src/admin.php`

## Nuevo vs mejorado

| Nuevo | Mejorado |
|---|---|
| Modo Exploración | Física / cámara / colisiones |
| Misiones y desbloqueos | Salidas y señales |
| Audio Web Audio | Taller + enlace canónico |
| Quality profiles | Clasificación (score_version 2) |
| Admin settings | Documentación / build reproducible |
| Fixed timestep | Ambientes / biomas |

## Rendimiento

Mediciones en dispositivo del visitante vía `canvas.dataset.drawMs` + `PerformanceManager` (ajuste automático). No se inventan FPS de laboratorio aquí; CI valida build, unit tests y smoke de assets.

## Pruebas ejecutadas localmente

- `npm run build` — OK
- `npm test` (física, colisiones, score, tráfico, rutas, misiones, save, GameLoop, smoke visual de assets) — OK
- PHP (`scores-contract`, `catalog`) — en CI (PHP no disponible en este entorno local)

## GitHub

- Rama: `feature/ramon-touring-2`
- Merge a `main` / deploy IONOS: **pendiente de autorización**

## Limitaciones

- Sin verificación en Safari iOS físico en esta entrega (emulación/CSS safe-area sí).
- Audio procedimental (sin música de archivo licenciada).
- Antitrampas de scores sigue siendo disuasorio, no autoritativo.
