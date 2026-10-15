import { SCORE, SCORE_VERSION } from './config.js?v=2.0.11';
const awardedPasses = new Set();
export function resetPassTracking() {
    awardedPasses.clear();
}
export function applyPassEvents(s, events, now) {
    if (s.mode !== 'arcade' || s.branch || s.ended)
        return [];
    const pops = [];
    for (const e of events) {
        if (awardedPasses.has(e.id))
            continue;
        awardedPasses.add(e.id);
        const base = e.close ? SCORE.closePass : SCORE.pass;
        const bonus = Math.min(SCORE.comboBonusCap, s.combo * SCORE.comboBonusPer);
        const gain = base + bonus;
        s.score += gain;
        s.combo++;
        s.comboTimer = SCORE.comboExpire;
        pops.push({
            text: e.close ? (s.combo > 1 ? `CLOSE x${s.combo}` : 'CLOSE') : s.combo > 1 ? `PASS x${s.combo}` : 'PASS',
            points: gain,
            at: now,
        });
    }
    return pops;
}
export function award(s, amount, label, now) {
    if (s.mode !== 'arcade' || s.ended)
        return null;
    s.score += amount;
    return { text: label, points: amount, at: now };
}
export function levelOf(s) {
    return 1 + Math.floor(s.time / SCORE.levelSeconds);
}
export function scoreMeta() {
    return { version: SCORE_VERSION };
}
/** Mirror of server ceiling intent for documentation/tests. */
export function estimateCeiling(elapsed) {
    const blocks = Math.floor(elapsed / 30);
    const tail = elapsed % 30;
    const weighted = 30 * (blocks + 0.15 * (blocks * (blocks - 1)) / 2) + tail * (1 + 0.15 * blocks);
    const maxDistance = 305 / 3.6 * elapsed;
    const maxPasses = 9 + Math.ceil(maxDistance / 40);
    return Math.ceil(305 / 3.6 * weighted + 500 * maxPasses + 1000);
}
