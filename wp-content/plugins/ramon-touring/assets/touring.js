import { drawRoad, drawGarage, setSectionLabels } from './world.js?v=2.1.0';
import { VERSION } from './game/config.js?v=2.1.0';
import { GameLoop } from './game/GameLoop.js?v=2.1.0';
import { InputManager } from './game/InputManager.js?v=2.1.0';
import { AudioManager } from './game/AudioManager.js?v=2.1.0';
import { PerformanceManager, prepareDrawContext, sizeGameCanvas } from './game/PerformanceManager.js?v=2.1.0';
import { createRun, hudSnapshot, resumeFromWorkshop, simulateStep } from './game/GameManager.js?v=2.1.0';
import { clearRunSnapshot, loadProgress, loadRunSnapshot, saveProgress, saveRunSnapshot, updateProgressFromRun, } from './game/SaveManager.js?v=2.1.0';
const cfg = JSON.parse(document.getElementById('rm-touring-config').textContent);
const en = cfg.lang === 'en';
const sections = cfg.sections;
const root = document.getElementById('rm-touring-app');
const tr = (es, english) => (en ? english : es);
const esc = (s) => String(s).replace(/[&<>"']/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x]);
if (!sections.length) {
    root.innerHTML = '<p></p>';
    root.firstChild.textContent = tr('No hay contenido publicado disponible. Vuelve a la web normal.', 'No published content is available. Return to the regular website.');
    throw new Error('Empty published catalog');
}
setSectionLabels(sections.map((x) => x.name));
const progress = loadProgress();
const audio = new AudioManager();
audio.master = progress.audioMaster;
audio.sfx = progress.audioSfx;
audio.music = progress.audioMusic;
audio.muted = progress.muted;
const perf = new PerformanceManager();
perf.setProfile(progress.quality);
const input = new InputManager();
let mode = 'start';
let garage = 0;
let view = 0;
let paused = true;
const camera = 0;
let color = progress.color || '#b12f3c';
let lights = false;
let hood = false;
let zoom = 8;
let angle = Math.PI + 0.45;
let environment = 'auto';
let weather = 'clear';
let readerKey = '';
let readerLoaded = false;
let expanded = false;
let runToken = null;
let runPromise = null;
let runGeneration = 0;
let completedMissions = [...progress.missions];
let s = createRun('arcade');
let pops = [];
let resized = true;
let drawKey = '';
let drag = null;
let hudTime = 0;
let lastLevel = 1;
const text = {
    start: tr('Empezar a conducir', 'Start driving'),
    pause: tr('Pausa', 'Pause'),
    resume: tr('Seguir', 'Resume'),
    back: tr('Volver a conducir', 'Back to driving'),
    brake: tr('↓ Freno', '↓ Brake'),
    auto: tr('Aceleración automática', 'Automatic acceleration'),
    read: tr('Leer sin conducir', 'Read without driving'),
    open: tr('Abrir capó', 'Open hood'),
    close: tr('Cerrar capó', 'Close hood'),
};
const menuIcon = `<span class="menu-burger" aria-hidden="true"><i></i><i></i><i></i></span>`;
root.innerHTML = `
<div class="racer" data-v="${VERSION}">
  <section class="start-screen" role="dialog" aria-modal="true" aria-label="${tr('Instrucciones del juego', 'Game instructions')}">
    <div class="instructions-card start-card">
      <header><h2>${tr('Cómo conducir', 'How to drive')}</h2></header>
      <p>${tr('← → o A / D: girar. ↓ o S: frenar. En móvil, usa las flechas y el freno. El coche acelera al soltar el freno.', '← → or A / D: steer. ↓ or S: brake. On mobile, use the arrows and brake. The car accelerates when you release the brake.')}</p>
      <p>${tr('Ⅱ o P: pausa. Toma el carril derecho cerca de la salida para entrar al taller y leer las secciones de la web.', 'Ⅱ or P: pause. Take the right lane near the exit to enter the workshop and read the site sections.')}</p>
      <p>${tr('Adelanta sin chocar para sumar puntos. Tres golpes terminan la partida.', 'Pass traffic without crashing to score. Three hits end the run.')}</p>
      <div class="start-actions start-actions-play">
        <button class="start-play" data-action="arcade" autofocus>▶ ${tr('Jugar', 'Play')}</button>
        <button data-action="read">${text.read}</button>
      </div>
    </div>
  </section>
  <div class="hud-icons">
    <button data-action="help" aria-label="${tr('Instrucciones', 'Instructions')}">?</button>
    <button data-action="pause-icon" aria-label="${tr('Pausa', 'Pause')}">Ⅱ</button>
    <button class="desktop-menu-toggle" data-action="game-menu" aria-expanded="false" aria-haspopup="dialog" aria-label="${tr('Menú', 'Menu')}">${menuIcon}</button>
  </div>
  <section class="road" hidden>
    <div class="race-screen" tabindex="0" role="group" aria-label="${tr('Conducción', 'Driving')}">
      <canvas aria-hidden="true"></canvas>
      <div class="top-hud">
        <div class="hud-stack">
          <b><span data-hud="level">1</span> · <span data-hud="distance">0.00 km</span></b>
        </div>
        <div class="hud-stack">
          <b data-hud="score">0</b>
        </div>
        <div class="level-box"><span data-hud="lives"></span></div>
      </div>
      <div class="hud-toast" data-hud="toast" hidden></div>
      <div class="speed gauge"><b data-hud="speed">65</b><span>km/h</span></div>
      <div class="mission-bar" data-hud="mission-wrap" hidden><small>${tr('MISIÓN', 'MISSION')}</small><span data-hud="mission"></span></div>
      <div class="route-cue" aria-hidden="true"><b>↗</b><span data-route-label></span></div>
      <div class="game-over" hidden>
        <div class="game-over-card">
          <header class="game-over-head">
            <h2>${tr('Fin de partida', 'Run over')}</h2>
            <p class="final-score" data-final-score></p>
            <p class="final-stats" data-final-stats></p>
          </header>
          <section class="leaderboard">
            <h3>${tr('Récords · Top 10', 'High scores · Top 10')}</h3>
            <ol data-scores></ol>
            <p data-board-status role="status"></p>
          </section>
          <form class="score-form">
            <label class="score-row">
              <span class="sr-only">${tr('Alias (3-12)', 'Alias (3-12)')}</span>
              <input name="alias" minlength="3" maxlength="12" pattern="[A-Za-z0-9][A-Za-z0-9 _-]{1,10}[A-Za-z0-9]" required autocomplete="off" placeholder="${tr('Alias (3-12)', 'Alias (3-12)')}">
              <button type="submit">${tr('Guardar récord', 'Save score')}</button>
            </label>
            <p data-score-status role="status"></p>
          </form>
          <div class="game-over-actions">
            <button data-action="reset">${tr('Otra partida', 'Play again')}</button>
            <a class="web-return" href="${esc(cfg.home)}">${tr('Volver a versión web', 'Back to web version')} ↗</a>
          </div>
        </div>
      </div>
    </div>
    <div class="driving-controls">
      <button data-hold="left" aria-label="${tr('Izquierda', 'Left')}">←</button>
      <button data-hold="right" aria-label="${tr('Derecha', 'Right')}">→</button>
      <button data-hold="brake">${text.brake}</button>
      <span class="auto-gas">${text.auto}</span>
    </div>
  </section>
  <section class="workshop" hidden aria-label="${tr('Taller', 'Workshop')}">
    <div class="workshop-actions">
      <button data-action="restore">${tr('Restablecer vista', 'Reset view')}</button>
      <button data-action="resume">${text.back}</button>
    </div>
    <aside class="scene-car-tools" aria-label="${tr('Opciones del coche', 'Car options')}">
      <div class="workshop-tools">
        <label>${tr('Vista', 'View')}
          <select data-setting="car-view">
            <option value="rear">${tr('Trasera', 'Rear')}</option>
            <option value="side">${tr('Lateral', 'Side')}</option>
            <option value="front">${tr('Frontal', 'Front')}</option>
            <option value="hood">${tr('Capó', 'Hood')}</option>
          </select>
        </label>
        <label>${tr('Pintura', 'Paint')} <select data-setting="color">
          <option value="#b12f3c">${tr('Rojo', 'Red')}</option>
          <option value="#254d6d">${tr('Azul', 'Blue')}</option>
          <option value="#d1c9b6">${tr('Marfil', 'Ivory')}</option>
          <option value="#3a454a">${tr('Grafito', 'Graphite')}</option>
          <option value="#c9a24a">${tr('Oro', 'Gold')}</option>
          <option value="#2a7a6e">${tr('Verde', 'Teal')}</option>
        </select></label>
        <button data-action="hood" aria-pressed="false">${text.open}</button>
        <button data-action="lights" aria-pressed="false">${tr('Luces', 'Lights')}</button>
        <label>${tr('Acercamiento', 'Zoom')} <input data-setting="zoom" type="range" min="6" max="11" step=".25" value="8"></label>
      </div>
    </aside>
    <div class="garage-scene">
      <div class="hanging-panel">
        <button class="poster-toggle" data-action="expand-reader" aria-label="${tr('Ampliar póster', 'Expand poster')}" title="${tr('Ampliar póster', 'Expand poster')}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <div class="reader-toolbar">
          <strong>${tr('Lectura', 'Reading')}</strong>
          <button data-action="close-reader" aria-expanded="false">${tr('Cerrar lectura', 'Close reader')}</button>
          <label for="rm-touring-select">${tr('Página', 'Page')}</label>
          <select id="rm-touring-select"></select>
          <a data-reader-link target="_blank" rel="noopener">${tr('Abrir en la web normal', 'Open on the regular website')} ↗</a>
        </div>
        <p class="reader-fallback" role="status" hidden></p>
        <iframe class="reader" title="${tr('Contenido de la web', 'Website content')}" loading="eager" referrerpolicy="same-origin"></iframe>
      </div>
      <div class="orbit-stage" tabindex="0" role="group" aria-label="${tr('Orbitar coche', 'Orbit car')}">
        <canvas aria-hidden="true"></canvas>
        <span class="scene-label">${tr('CÁMARA LIBRE', 'FREE CAMERA')}</span>
      </div>
    </div>
    <div class="workshop-controls">
      <button data-action="orbit-left" aria-label="${tr('Orbitar izquierda', 'Orbit left')}">←</button>
      <p data-garage-title></p>
      <button data-action="orbit-right" aria-label="${tr('Orbitar derecha', 'Orbit right')}">→</button>
    </div>
    <div class="catalog"></div>
  </section>
  <p class="sr-only" role="status" data-status></p>
</div>`;
const $ = (q) => root.querySelector(q);
const road = $('.road');
const workshop = $('.workshop');
const start = $('.start-screen');
const rc = road.querySelector('canvas');
const gc = workshop.querySelector('canvas');
const reader = $('.reader');
const stage = $('.orbit-stage');
const menu = document.createElement('dialog');
menu.className = 'options-modal';
menu.setAttribute('aria-label', tr('Menú del juego', 'Game menu'));
menu.innerHTML = `<header><div><h2>${tr('Menú', 'Menu')}</h2></div><button data-action="close-menu" aria-label="${tr('Cerrar', 'Close')}">✕</button></header>
<nav class="menu-tabs">${['drive', 'car', 'sections', 'scores', 'settings'].map((id, i) => `<button data-tab="${id}" aria-pressed="${i === 0}">${[tr('Ambiente', 'World'), tr('Coche', 'Car'), tr('Secciones', 'Sections'), tr('Récords', 'Scores'), tr('Ajustes', 'Settings')][i]}</button>`).join('')}</nav>
<div class="menu-body">
  <section data-panel="drive"><h3>${tr('Ambiente', 'World')}</h3>
    <label class="environment-picker">${tr('Ambiente', 'Environment')}
      <select data-setting="environment">
        <option value="auto">${tr('Automático', 'Automatic')}</option>
        <option value="coast">${tr('Costa', 'Coast')}</option>
        <option value="forest">${tr('Bosque', 'Forest')}</option>
        <option value="city">${tr('Ciudad', 'City')}</option>
        <option value="desert">${tr('Desierto', 'Desert')}</option>
        <option value="snow">${tr('Nieve', 'Snow')}</option>
        <option value="night">${tr('Noche', 'Night')}</option>
        <option value="beach">${tr('Playa', 'Beach')}</option>
      </select>
    </label>
    <label>${tr('Clima', 'Weather')}
      <select data-setting="weather">
        <option value="clear">${tr('Despejado', 'Clear')}</option>
        <option value="sunset">${tr('Atardecer', 'Sunset')}</option>
        <option value="cloudy">${tr('Nublado', 'Cloudy')}</option>
        <option value="rain">${tr('Lluvia', 'Rain')}</option>
        <option value="fog">${tr('Niebla', 'Fog')}</option>
      </select>
    </label>
  </section>
  <section data-panel="car" hidden><h3>${tr('Coche', 'Car')}</h3>
    <p>${tr('Pintura, capó y vista están en el taller, a la izquierda del coche.', 'Paint, hood and view are in the workshop, left of the car.')}</p>
    <button data-action="inspect-car">${tr('Abrir taller', 'Open workshop')}</button>
  </section>
  <section data-panel="sections" hidden><h3>${tr('Secciones', 'Sections')}</h3>
    <nav class="garage-nav" aria-label="${tr('Destinos', 'Destinations')}"></nav>
    <button data-action="read-current">${tr('Leer página seleccionada', 'Read selected page')}</button>
  </section>
  <section data-panel="scores" hidden><h3>${tr('Récords', 'Scores')}</h3>
    <section class="leaderboard"><ol data-scores></ol><p data-board-status role="status"></p>
    <button data-action="refresh-scores">${tr('Actualizar', 'Refresh')}</button></section>
  </section>
  <section data-panel="settings" hidden><h3>${tr('Ajustes', 'Settings')}</h3>
    <label>${tr('Calidad', 'Quality')}
      <select data-setting="quality">
        <option value="auto">${tr('Automática', 'Auto')}</option>
        <option value="low">${tr('Baja', 'Low')}</option>
        <option value="medium">${tr('Media', 'Medium')}</option>
        <option value="high">${tr('Alta', 'High')}</option>
      </select>
    </label>
    <label><input type="checkbox" data-setting="muted" ${audio.muted ? 'checked' : ''}> ${tr('Silenciar', 'Mute')}</label>
    <label>${tr('Volumen efectos', 'SFX volume')} <input type="range" min="0" max="1" step="0.05" data-setting="sfx" value="${audio.sfx}"></label>
    <label><input type="checkbox" data-setting="reduceMotion" ${progress.reduceMotion ? 'checked' : ''}> ${tr('Menos movimiento', 'Reduce motion')}</label>
  </section>
</div>
<footer><button data-action="close-menu">${tr('Volver', 'Back')}</button><a href="${esc(cfg.home)}">${tr('Cambiar a Web', 'Switch to Web')} ↗</a></footer>`;
$('.racer').append(menu);
const helpDialog = document.createElement('dialog');
helpDialog.className = 'options-modal';
helpDialog.innerHTML = `<header><h2>${tr('Cómo conducir', 'How to drive')}</h2><button data-action="close-help">✕</button></header>
<div class="menu-body"><p>${tr('← → o A/D: girar. ↓ o S: frenar. En móvil, flechas, freno o arrastre horizontal.', '← → or A/D: steer. ↓ or S: brake. On mobile, arrows, brake or horizontal drag.')}</p>
<p>${tr('P: pausa. Entra en el carril derecho cerca de la salida para ir al taller.', 'P: pause. Take the right lane near the exit to enter the workshop.')}</p>
<p>${tr('Arcade: vidas, puntos y clasificación. Exploración: ritmo suave para descubrir la web.', 'Arcade: lives, score and leaderboard. Explore: calmer pace to discover the site.')}</p></div>`;
$('.racer').append(helpDialog);
const pauseDialog = document.createElement('dialog');
pauseDialog.className = 'options-modal pause-modal';
pauseDialog.innerHTML = `<header><h2>${tr('Pausa', 'Paused')}</h2><button data-action="close-pause">✕</button></header>
<div class="pause-actions"><button data-action="play-icon">▶</button><button data-action="reset">↻</button></div>`;
$('.racer').append(pauseDialog);
const navHtml = sections.map((x, i) => `<button data-section="${i}">${esc(x.name)}</button>`).join('');
menu.querySelector('.garage-nav').innerHTML = navHtml;
const colorSelect = $('[data-setting=color]');
if ([...colorSelect.options].some((o) => o.value === color))
    colorSelect.value = color;
const pill = document.getElementById('rm-mode-pill');
if (pill)
    pill.hidden = true;
let menuWasPaused = true;
let menuFocus = null;
const coarse = matchMedia('(pointer:coarse)').matches || matchMedia('(max-width:899px)').matches;
function announce(msg) {
    $('[data-status]').textContent = msg;
}
function toast(msg) {
    const el = $('[data-hud=toast]');
    el.hidden = !msg;
    el.textContent = msg;
    if (msg)
        setTimeout(() => { if (el.textContent === msg)
            el.hidden = true; }, 2200);
}
function chooseTab(tab) {
    menu.querySelectorAll('[data-panel]').forEach((x) => (x.hidden = x.dataset.panel !== tab));
    menu.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.tab === tab)));
}
function openMenu(tab = 'drive') {
    if (!start.hidden && mode === 'start')
        return;
    menuWasPaused = paused;
    menuFocus = document.activeElement;
    if (mode === 'road')
        setPause(true);
    input.clear();
    chooseTab(tab);
    $('[data-action=game-menu]').setAttribute('aria-expanded', 'true');
    menu.showModal();
}
function closeMenu(restore = true) {
    if (!menu.open)
        return;
    menu.close();
    $('[data-action=game-menu]').setAttribute('aria-expanded', 'false');
    if (restore && mode === 'road' && !s.ended)
        setPause(menuWasPaused);
    input.clear();
    if (menuFocus && menuFocus.isConnected)
        menuFocus.focus({ preventScroll: true });
}
function show(next) {
    root.dataset.mode = next;
    const racerEl = root.querySelector('.racer');
    if (racerEl)
        racerEl.dataset.mode = next;
    if (expanded)
        expandReader(false);
    resized = true;
    mode = next;
    // Keep the road canvas as a live backdrop behind the start card
    road.hidden = next === 'garage';
    workshop.hidden = next !== 'garage';
    start.hidden = next !== 'start';
    drawKey = '';
    loop.resetClock();
    input.clear();
}
function setPause(value) {
    paused = value;
    input.clear();
    audio.setPaused(value || mode !== 'road');
    loop.resetClock();
}
function beginRun() {
    const generation = ++runGeneration;
    runToken = null;
    runPromise = cfg.run
        ? fetch(cfg.run, { cache: 'no-store' })
            .then((r) => { if (!r.ok)
            throw new Error(); return r.json(); })
            .then((x) => { if (generation !== runGeneration)
            return null; runToken = x.token; return x.token; })
            .catch(() => { if (generation === runGeneration)
            runToken = null; return null; })
        : Promise.resolve(null);
}
function startDrive(gameMode) {
    void audio.unlock();
    const snap = loadRunSnapshot();
    if (snap && snap.state.mode === gameMode && !snap.state.ended) {
        s = snap.state;
        color = snap.color;
        lights = snap.lights;
        environment = snap.environment;
        garage = snap.garage;
        view = snap.view;
    }
    else {
        s = createRun(gameMode, environment);
        completedMissions = [...loadProgress().missions];
        beginRun();
    }
    lastLevel = 1;
    show('road');
    setPause(false);
    road.querySelector('.race-screen').focus({ preventScroll: true });
    clearRunSnapshot();
}
function loadPage(index) {
    const item = sections[garage].items[index];
    const key = garage + ':' + index;
    const select = $('#rm-touring-select');
    if (readerKey === key) {
        select.value = String(view);
        return;
    }
    readerKey = key;
    view = index;
    readerLoaded = false;
    const fallback = $('.reader-fallback');
    fallback.hidden = false;
    fallback.textContent = tr('Cargando…', 'Loading…');
    reader.src = item.reader;
    select.value = String(index);
    const link = $('[data-reader-link]');
    link.href = item.url;
    announce(item.title);
}
function enter(index) {
    closeMenu(false);
    saveRunSnapshot({ state: s, garage: index, view: 0, color, camera, lights, environment });
    garage = index;
    view = 0;
    hood = false;
    angle = Math.PI + 0.45;
    $('[data-action=hood]').textContent = text.open;
    show('garage');
    setPause(true);
    const group = sections[index];
    $('[data-garage-title]').textContent = group.name;
    $('#rm-touring-select').innerHTML = group.items.map((x, i) => `<option value="${i}">${esc(x.title)}</option>`).join('');
    $('.catalog').innerHTML = group.items.map((x, i) => `<button data-page="${i}" aria-pressed="${i === 0}">${esc(x.title)}</button>`).join('');
    loadPage(0);
    if (s.missionId === 'visit1') {
        s.missionProgress = 1;
    }
    stage.focus({ preventScroll: true });
    audio.play('exit');
}
function expandReader(value) {
    expanded = value;
    root.classList.toggle('reader-expanded', value);
    document.body.classList.toggle('rm-reader-expanded', value);
    resized = true;
}
async function refreshScores() {
    const statuses = [...root.querySelectorAll('[data-board-status]')];
    statuses.forEach((x) => (x.textContent = tr('Cargando…', 'Loading…')));
    try {
        const scoresUrl = cfg.scores + (cfg.scores.includes('?') ? '&' : '?') + 'version=2';
        const r = await fetch(scoresUrl, { cache: 'no-store' });
        if (!r.ok)
            throw new Error();
        const data = (await r.json());
        for (const list of root.querySelectorAll('[data-scores]')) {
            list.replaceChildren();
            for (const entry of data.scores) {
                const li = document.createElement('li');
                li.textContent = `${entry.alias} · ${Number(entry.score).toLocaleString(en ? 'en' : 'es')} · ${entry.date}`;
                list.append(li);
            }
        }
        statuses.forEach((x) => (x.textContent = data.scores.length ? '' : tr('Todavía no hay récords.', 'No scores yet.')));
    }
    catch {
        statuses.forEach((x) => (x.textContent = tr('Clasificación no disponible.', 'Scores unavailable.')));
    }
}
reader.addEventListener('load', () => {
    readerLoaded = true;
    const fallback = $('.reader-fallback');
    fallback.textContent = '';
    fallback.hidden = true;
    try {
        const u = new URL(reader.contentWindow.location.href);
        if (u.origin !== location.origin)
            return;
        const doc = reader.contentDocument;
        if (doc) {
            doc.addEventListener('click', (e) => {
                const a = e.target.closest('a[href]');
                if (!a || a.target === '_blank' || a.hasAttribute('download'))
                    return;
                const next = new URL(a.href, reader.contentWindow.location.href);
                if (next.origin !== location.origin) {
                    a.target = '_blank';
                    a.rel = 'noopener';
                    return;
                }
                if (next.searchParams.has('rm_drive')) {
                    a.target = '_top';
                    return;
                }
                if (!next.pathname.match(/\.(pdf|zip|png|jpe?g|webp)$/i)) {
                    next.searchParams.set('rm_reader', '1');
                    next.searchParams.set('ri_noredirect', '1');
                    a.href = next.href;
                }
            }, true);
        }
        const link = $('[data-reader-link]');
        u.searchParams.delete('rm_reader');
        u.searchParams.delete('ri_noredirect');
        if (link)
            link.href = u.href;
    }
    catch { /* cross-origin */ }
});
root.querySelectorAll('[data-hold]').forEach((b) => input.bindHold(b, b.dataset.hold));
input.bindSteerDrag(road.querySelector('.race-screen'));
stage.addEventListener('pointerdown', (e) => { stage.setPointerCapture(e.pointerId); drag = { x: e.clientX, a: angle }; });
stage.addEventListener('pointermove', (e) => { if (drag)
    angle = drag.a + (e.clientX - drag.x) * 0.012; });
stage.addEventListener('pointerup', () => { drag = null; });
root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b)
        return;
    if (b.dataset.tab) {
        chooseTab(b.dataset.tab);
        return;
    }
    if (b.dataset.section !== undefined) {
        enter(+b.dataset.section);
        expandReader(true);
        return;
    }
    if (b.dataset.page !== undefined) {
        loadPage(+b.dataset.page);
        closeMenu(false);
        expandReader(true);
        return;
    }
    switch (b.dataset.action) {
        case 'arcade':
            closeMenu(false);
            startDrive('arcade');
            break;
        case 'resume':
            closeMenu(false);
            if (mode === 'garage') {
                resumeFromWorkshop(s, sections.length);
                show('road');
                setPause(false);
            }
            else
                startDrive(s.mode);
            break;
        case 'help':
            helpDialog.showModal();
            if (mode === 'road')
                setPause(true);
            break;
        case 'close-help':
            helpDialog.close();
            if (mode === 'road')
                setPause(false);
            break;
        case 'pause-icon':
            if (mode === 'road' && !s.ended) {
                setPause(true);
                pauseDialog.showModal();
            }
            break;
        case 'play-icon':
        case 'close-pause':
            pauseDialog.close();
            setPause(false);
            break;
        case 'close-reader':
            expandReader(false);
            break;
        case 'game-menu':
            openMenu(mode === 'garage' ? 'car' : 'drive');
            break;
        case 'close-menu':
            closeMenu();
            break;
        case 'inspect-car':
            closeMenu(false);
            if (mode !== 'garage')
                enter(garage);
            break;
        case 'read-current':
            closeMenu(false);
            if (mode !== 'garage')
                enter(garage);
            expandReader(true);
            break;
        case 'read':
            enter(0);
            expandReader(true);
            break;
        case 'refresh-scores':
            void refreshScores();
            break;
        case 'reset':
            if (!s.ended && !window.confirm(tr('¿Reiniciar y perder los puntos?', 'Restart and lose points?')))
                break;
            closeMenu(false);
            pauseDialog.close();
            clearRunSnapshot();
            s = createRun(s.mode || 'arcade', environment);
            beginRun();
            $('.game-over').hidden = true;
            root.classList.remove('run-ended');
            show('road');
            setPause(false);
            break;
        case 'expand-reader':
            expandReader(!expanded);
            break;
        case 'orbit-left':
            angle -= 0.7;
            break;
        case 'orbit-right':
            angle += 0.7;
            break;
        case 'hood':
            hood = !hood;
            angle = 0.6;
            b.textContent = hood ? text.close : text.open;
            b.setAttribute('aria-pressed', String(hood));
            $('[data-setting=car-view]').value = hood ? 'hood' : 'front';
            break;
        case 'lights':
            lights = !lights;
            b.setAttribute('aria-pressed', String(lights));
            drawKey = '';
            break;
        case 'restore':
            angle = Math.PI + 0.45;
            zoom = 8;
            hood = false;
            lights = false;
            $('[data-setting=zoom]').value = '8';
            $('[data-setting=car-view]').value = 'rear';
            $('[data-action=hood]').textContent = text.open;
            $('[data-action=hood]').setAttribute('aria-pressed', 'false');
            $('[data-action=lights]').setAttribute('aria-pressed', 'false');
            break;
        default: break;
    }
});
root.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'rm-touring-select')
        loadPage(+t.value);
    if (t.dataset.setting === 'environment') {
        environment = t.value;
        lights = environment === 'night';
        drawKey = '';
    }
    if (t.dataset.setting === 'weather')
        weather = t.value;
    if (t.dataset.setting === 'color') {
        color = t.value;
        progress.color = color;
        saveProgress(progress);
        drawKey = '';
    }
    if (t.dataset.setting === 'car-view') {
        const presets = {
            rear: { angle: Math.PI + 0.45, zoom: 8, hood: false },
            side: { angle: Math.PI / 2 + 0.15, zoom: 8.5, hood: false },
            front: { angle: 0.35, zoom: 8, hood: false },
            hood: { angle: 0.6, zoom: 7, hood: true },
        };
        const p = presets[t.value] || presets.rear;
        angle = p.angle;
        zoom = p.zoom;
        hood = p.hood;
        $('[data-setting=zoom]').value = String(zoom);
        const hoodBtn = $('[data-action=hood]');
        hoodBtn.textContent = hood ? text.close : text.open;
        hoodBtn.setAttribute('aria-pressed', String(hood));
        drawKey = '';
    }
    if (t.dataset.setting === 'quality') {
        perf.setProfile(t.value);
        progress.quality = t.value;
        saveProgress(progress);
    }
    if (t.dataset.setting === 'muted') {
        audio.muted = t.checked;
        progress.muted = audio.muted;
        saveProgress(progress);
    }
    if (t.dataset.setting === 'reduceMotion') {
        progress.reduceMotion = t.checked;
        saveProgress(progress);
    }
});
root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.setting === 'zoom')
        zoom = +t.value;
    if (t.dataset.setting === 'sfx') {
        audio.sfx = +t.value;
        progress.audioSfx = audio.sfx;
        saveProgress(progress);
    }
});
$('.score-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!s.ended || s.mode !== 'arcade')
        return;
    const status = $('[data-score-status]');
    const button = $('.score-form button');
    const finalScore = Math.floor(s.score);
    const alias = new FormData(e.target).get('alias');
    const pendingToken = runPromise;
    const generation = runGeneration;
    button.disabled = true;
    status.textContent = tr('Guardando…', 'Saving…');
    const token = await pendingToken;
    if (generation !== runGeneration)
        return;
    try {
        if (!token)
            throw new Error();
        const r = await fetch(cfg.scores, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alias, score: finalScore, token, score_version: 2 }),
        });
        if (!r.ok)
            throw new Error();
        status.textContent = tr('Récord publicado.', 'Score published.');
        void refreshScores();
    }
    catch {
        status.textContent = tr('No se pudo guardar. La partida debe durar al menos 15 segundos.', 'Could not save. Run must last at least 15 seconds.');
        button.disabled = false;
    }
});
root.addEventListener('keydown', (e) => {
    if (pauseDialog.open || helpDialog.open)
        return;
    if (menu.open) {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeMenu();
        }
        return;
    }
    if (mode === 'start')
        return;
    if (e.target.matches?.('input,select,textarea'))
        return;
    const k = e.key.toLowerCase();
    if (mode === 'garage') {
        if (k === 'escape' && expanded) {
            expandReader(false);
            e.preventDefault();
        }
        return;
    }
    if (mode !== 'road')
        return;
    if (!['arrowleft', 'arrowright', 'arrowdown', 'a', 'd', 's', 'p'].includes(k))
        return;
    e.preventDefault();
    input.setKey(k, true);
});
window.addEventListener('keyup', (e) => input.setKey(e.key, false));
window.addEventListener('blur', () => input.clear());
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        input.clear();
        if (mode === 'road')
            setPause(true);
        audio.setPaused(true);
        loop.resetClock();
    }
});
const obs = new ResizeObserver(() => { resized = true; drawKey = ''; });
obs.observe(rc);
obs.observe(gc);
function endRun() {
    clear();
    const p = updateProgressFromRun(loadProgress(), s);
    p.missions = completedMissions;
    saveProgress(p);
    $('.game-over').hidden = false;
    root.classList.add('run-ended');
    $('[data-final-score]').textContent = `${Math.floor(s.score)} ${tr('puntos', 'points')}`;
    $('[data-final-stats]').textContent = `${(s.d / 1000).toFixed(2)} km · ${tr('combo', 'combo')} ${s.combo} · ${tr('nivel', 'level')} ${hudSnapshot(s, sections, en).level}`;
    void refreshScores();
    announce(tr('Fin', 'End'));
}
function clear() { input.clear(); }
const loop = new GameLoop({
    shouldSimulate: () => mode === 'road' && !paused && !s.ended,
    update: (dt) => {
        const polled = input.poll();
        if (polled.pause) {
            setPause(true);
            pauseDialog.showModal();
            return;
        }
        if (polled.brake)
            audio.play('brake');
        const result = simulateStep(s, sections, {
            steerAxis: polled.steerAxis,
            brake: polled.brake,
            confirmExit: true,
            cameraMode: 0,
            weather,
            forcedEnv: environment,
            reduceMotion: progress.reduceMotion,
            isCoarsePointer: coarse,
        }, dt, performance.now(), en, completedMissions);
        completedMissions = result.completedMissions;
        pops = pops.concat(result.pops).slice(-6);
        if (result.hit)
            audio.play('hit');
        if (result.pops.some((p) => p.text.includes('CLOSE') || p.text.includes('x')))
            audio.play('combo');
        else if (result.pops.length)
            audio.play('pass');
        if (result.levelUp) {
            audio.play('level');
            toast(tr('Nivel ', 'Level ') + hudSnapshot(s, sections, en).level);
        }
        if (result.missionMessage) {
            audio.play('mission');
            toast(result.missionMessage);
            announce(result.missionMessage);
        }
        if (result.enteredWorkshop)
            enter(result.exitIndex);
        if (result.gameOver)
            endRun();
        audio.updateEngine(s.speed, !polled.brake);
    },
    render: (_alpha, frameDt) => {
        const now = performance.now();
        if (mode === 'start' || mode === 'road' || mode === 'garage') {
            const canvas = mode === 'garage' ? gc : rc;
            const q = perf.settings();
            if (resized || !canvas.width) {
                sizeGameCanvas(canvas, q.resolutionScale);
                resized = false;
                drawKey = '';
            }
            else if (sizeGameCanvas(canvas, q.resolutionScale)) {
                drawKey = '';
            }
            const key = [mode, angle, zoom, color, hood, lights, environment, weather, camera, canvas.width, canvas.height, Math.floor(s.d)].join(':');
            const liveRoad = mode === 'road' && !paused && !s.ended;
            const livePreview = mode === 'start';
            if (liveRoad || livePreview || key !== drawKey) {
                const st = performance.now();
                const ctx = canvas.getContext('2d');
                prepareDrawContext(ctx);
                if (mode === 'garage') {
                    drawGarage(ctx, canvas.width, canvas.height, angle, zoom, color, hood ? 1 : 0, lights, view);
                }
                else {
                    if (livePreview) {
                        s.d += Math.min(0.45, Math.max(0, frameDt)) * 18;
                        s.speed = 88;
                        s.x *= 0.96;
                    }
                    const polled = liveRoad ? input.poll() : { brake: false, steerAxis: 0, pause: false };
                    drawRoad(ctx, s, canvas.width, canvas.height, {
                        color,
                        camera: livePreview ? 0 : camera,
                        brake: !!polled.brake,
                        lights: lights || environment === 'night',
                        environment: s.environment,
                        weather,
                        quality: q,
                        reduceEffects: progress.reduceMotion || livePreview,
                    });
                }
                const drawMs = performance.now() - st;
                canvas.dataset.drawMs = drawMs.toFixed(2);
                if (liveRoad)
                    perf.sampleFrame(drawMs, now);
                drawKey = key;
            }
        }
        if (now - hudTime > 120 || s.ended) {
            hudTime = now;
            if (mode === 'road') {
                const hud = hudSnapshot(s, sections, en);
                $('[data-hud=speed]').textContent = String(hud.speed);
                $('[data-hud=distance]').textContent = hud.distance;
                $('[data-hud=score]').textContent = String(hud.score);
                $('[data-hud=level]').textContent = String(hud.level);
                $('[data-hud=lives]').textContent = hud.livesText;
                $('[data-route-label]').textContent = hud.branch
                    ? tr('AL TALLER', 'TO WORKSHOP')
                    : `${hud.exitName} · ${hud.approach} m`;
                $('.route-cue').classList.toggle('near', hud.approach < 220);
                const mw = $('[data-hud=mission-wrap]');
                if (hud.mission && s.mode === 'arcade') {
                    mw.hidden = false;
                    $('[data-hud=mission]').textContent = `${hud.mission} (${hud.missionProgress}/${hud.missionTarget})`;
                }
                else
                    mw.hidden = true;
                if (pops.length) {
                    const latest = pops[pops.length - 1];
                    toast(`+${latest.points} ${latest.text}`);
                    pops = [];
                }
            }
        }
    },
});
void refreshScores();
// Explicit start — no auto-drive
show('start');
setPause(true);
loop.start();
window.addEventListener('pagehide', () => {
    loop.stop();
    obs.disconnect();
    input.clear();
    if (mode === 'road' && !s.ended) {
        saveRunSnapshot({ state: s, garage, view, color, camera, lights, environment });
    }
});
console.info(`Touring ${VERSION}`);
