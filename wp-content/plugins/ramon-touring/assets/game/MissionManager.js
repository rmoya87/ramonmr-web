import { SCORE } from './config.js?v=2.1.1';
import { award } from './ScoreManager.js?v=2.1.1';
export const MISSIONS = [
    { id: 'pass5', es: 'Adelanta 5 vehículos', en: 'Overtake 5 vehicles', target: 5, kind: 'pass' },
    { id: 'dist2', es: 'Recorre 2 km', en: 'Drive 2 km', target: 2000, kind: 'distance' },
    { id: 'pass10', es: 'Adelanta 10 vehículos', en: 'Overtake 10 vehicles', target: 10, kind: 'pass', hard: true },
    { id: 'combo4', es: 'Consigue un combo de 4', en: 'Reach a 4x combo', target: 4, kind: 'combo' },
    { id: 'clean30', es: '30 s sin impactos', en: '30 s without crashes', target: 30, kind: 'clean' },
    { id: 'region1', es: 'Descubre una nueva región', en: 'Discover a new region', target: 1, kind: 'region' },
    { id: 'visit1', es: 'Visita una sección del mapa', en: 'Visit a map section', target: 1, kind: 'visit' },
];
export function pickMission(completed) {
    const open = MISSIONS.filter((m) => !completed.includes(m.id));
    return open[Math.floor(Math.random() * open.length)] || MISSIONS[0];
}
export function assignMission(s, completed) {
    const m = pickMission(completed);
    s.missionId = m.id;
    s.missionTarget = m.target;
    s.missionProgress = 0;
}
export function missionLabel(id, en) {
    const m = MISSIONS.find((x) => x.id === id);
    if (!m)
        return '';
    return en ? m.en : m.es;
}
export function notePass(s) {
    if (s.missionId?.startsWith('pass'))
        s.missionProgress++;
}
export function noteCombo(s) {
    if (s.missionId === 'combo4')
        s.missionProgress = Math.max(s.missionProgress, s.combo);
}
export function syncMissionProgress(s) {
    if (!s.missionId)
        return;
    const m = MISSIONS.find((x) => x.id === s.missionId);
    if (!m)
        return;
    if (m.kind === 'distance')
        s.missionProgress = s.d;
    if (m.kind === 'clean')
        s.missionProgress = s.cleanTimer;
    if (m.kind === 'combo')
        s.missionProgress = Math.max(s.missionProgress, s.combo);
    if (m.kind === 'region')
        s.missionProgress = s.discovered.length;
}
export function checkMissionComplete(s, completed, now, en) {
    syncMissionProgress(s);
    if (!s.missionId || s.missionProgress < s.missionTarget) {
        return { completed, popup: null, message: '' };
    }
    const m = MISSIONS.find((x) => x.id === s.missionId);
    const next = completed.includes(m.id) ? completed : [...completed, m.id];
    const points = m.hard ? SCORE.missionHard : SCORE.missionEasy;
    const popup = award(s, points, en ? 'MISSION' : 'MISIÓN', now);
    const message = en ? `Mission complete: ${m.en}` : `Misión completada: ${m.es}`;
    assignMission(s, next);
    return { completed: next, popup, message };
}
