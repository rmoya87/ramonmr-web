import { COLORS, SAVE_KEY, SAVE_TTL_MS } from './config.js?v=2.0.15';
const PROGRESS_DEFAULT = {
    v: 2,
    bestScore: 0,
    bestDistance: 0,
    bestCombo: 0,
    missions: [],
    regions: [],
    unlocks: ['red', 'blue', 'ivory', 'graphite'],
    color: COLORS.red,
    quality: 'auto',
    audioMaster: 0.8,
    audioSfx: 0.8,
    audioMusic: 0.4,
    muted: false,
    reduceMotion: false,
};
function storage() {
    try {
        return typeof localStorage !== 'undefined' ? localStorage : null;
    }
    catch {
        return null;
    }
}
export function loadProgress() {
    const st = storage();
    if (!st)
        return { ...PROGRESS_DEFAULT };
    try {
        const raw = st.getItem(SAVE_KEY + '_progress');
        if (!raw)
            return { ...PROGRESS_DEFAULT };
        const data = JSON.parse(raw);
        if (data.v !== 2)
            return migrateProgress(data);
        return { ...PROGRESS_DEFAULT, ...data };
    }
    catch {
        return { ...PROGRESS_DEFAULT };
    }
}
function migrateProgress(data) {
    return { ...PROGRESS_DEFAULT, ...data, v: 2 };
}
export function saveProgress(p) {
    const st = storage();
    if (!st)
        return;
    try {
        st.setItem(SAVE_KEY + '_progress', JSON.stringify(p));
    }
    catch {
        /* quota */
    }
}
export function updateProgressFromRun(p, s) {
    const next = { ...p };
    next.bestScore = Math.max(next.bestScore, Math.floor(s.score));
    next.bestDistance = Math.max(next.bestDistance, s.d);
    next.bestCombo = Math.max(next.bestCombo, s.combo);
    for (const r of s.discovered) {
        if (!next.regions.includes(r))
            next.regions.push(r);
    }
    if (next.bestScore >= 5000 && !next.unlocks.includes('gold'))
        next.unlocks.push('gold');
    if (next.regions.length >= 2 && !next.unlocks.includes('teal'))
        next.unlocks.push('teal');
    return next;
}
export function saveRunSnapshot(payload) {
    const st = storage();
    if (!st)
        return;
    const data = {
        v: 2,
        expires: Date.now() + SAVE_TTL_MS,
        state: structuredClone ? structuredClone(payload.state) : JSON.parse(JSON.stringify(payload.state)),
        garage: payload.garage,
        view: payload.view,
        color: payload.color,
        camera: payload.camera,
        lights: payload.lights,
        environment: payload.environment,
    };
    try {
        st.setItem(SAVE_KEY + '_run', JSON.stringify(data));
    }
    catch {
        /* ignore */
    }
}
export function loadRunSnapshot() {
    const st = storage();
    if (!st)
        return null;
    try {
        const raw = st.getItem(SAVE_KEY + '_run');
        if (!raw)
            return null;
        const data = JSON.parse(raw);
        if (data.v !== 2 || data.expires < Date.now()) {
            st.removeItem(SAVE_KEY + '_run');
            return null;
        }
        return data;
    }
    catch {
        return null;
    }
}
export function clearRunSnapshot() {
    storage()?.removeItem(SAVE_KEY + '_run');
}
