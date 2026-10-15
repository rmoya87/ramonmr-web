import { EXIT, SCORE } from './config.js?v=2.0.15';
import { award } from './ScoreManager.js?v=2.0.15';
/** Mirror of world.ramp for exit capture without circular imports during tests. */
export function ramp(t) {
    return 4.6 + Math.max(0, t) * 0.12 + Math.sin(Math.max(0, t) / 180) * 2;
}
export function stepRoute(s, sections, dt, confirmHeld, isCoarsePointer, now, en) {
    const result = { enteredWorkshop: false, exitIndex: s.exit, popup: null };
    if (!sections.length)
        return result;
    const q = s.d - s.fork;
    const onRamp = !s.branch &&
        q > EXIT.captureQMin &&
        q < EXIT.captureQMax &&
        s.x > EXIT.captureXMin &&
        Math.abs(s.x - ramp(q)) < EXIT.captureLaneTol;
    if (onRamp) {
        const needConfirm = isCoarsePointer && EXIT.confirmMobile;
        if (!needConfirm || confirmHeld) {
            s.exitHold += dt;
            if (s.exitHold >= EXIT.holdSeconds) {
                s.branch = true;
                s.branchTime = 0;
                s.x -= ramp(q);
                s.exitHold = 0;
            }
        }
        else {
            s.exitHold = Math.max(0, s.exitHold - dt);
        }
    }
    else if (!s.branch) {
        s.exitHold = 0;
    }
    if (s.branch) {
        s.branchTime += dt;
        if (s.branchTime >= 2) {
            result.enteredWorkshop = true;
            result.exitIndex = s.exit;
        }
    }
    else if (q > 90) {
        const gap = s.mode === 'explore' ? EXIT.exploreGap : EXIT.nextGap;
        s.fork = s.d + gap;
        s.exit = (s.exit + 1) % sections.length;
    }
    // Discover zone bonus once per region when approaching first exit of region
    if (s.discovered.length && s.mode === 'arcade') {
        const key = 1000 + s.regionId;
        if (!s.discovered.includes(key) && q > -EXIT.approachWarn && q < 0) {
            s.discovered.push(key);
            result.popup = award(s, SCORE.discoverZone, en ? 'ZONE' : 'ZONA', now);
        }
    }
    return result;
}
export function approachMeters(s) {
    return Math.max(0, Math.round(s.fork - s.d));
}
