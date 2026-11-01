import { COLLISION, PHYSICS } from './config.js';
import { applyHitImpulse } from './VehicleController.js';
/**
 * Player hull (oriented by yaw) vs NPC box, real dimensions, separating-axis
 * test. Returns the minimum push-out (axis, signed distance) or null.
 * The same body you see is the body that collides: no hidden corridor on the
 * lane lines and no clipping through a car's nose or tail.
 */
function contact(s, o) {
    // Oriented box vs oriented box, separating-axis test on all four edge normals.
    const dx = s.x - o.x;
    const dz = s.d - o.d;
    const reach = COLLISION.length / 2 + o.length / 2 + COLLISION.width + o.width;
    if (Math.abs(dz) > reach || Math.abs(dx) > reach)
        return null;
    const pa = [Math.cos(s.yaw), -Math.sin(s.yaw)]; // player's right axis in (x, z)
    const pf = [Math.sin(s.yaw), Math.cos(s.yaw)]; // player's forward axis
    const oa = [Math.cos(o.yaw ?? 0), -Math.sin(o.yaw ?? 0)];
    const of = [Math.sin(o.yaw ?? 0), Math.cos(o.yaw ?? 0)];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
    const phw = COLLISION.width / 2;
    const phl = COLLISION.length / 2;
    const ohw = o.width / 2;
    const ohl = o.length / 2;
    let best = Infinity;
    let bx = 0;
    let bz = 0;
    for (const axis of [pa, pf, oa, of]) {
        const rp = phw * Math.abs(dot(axis, pa)) + phl * Math.abs(dot(axis, pf));
        const ro = ohw * Math.abs(dot(axis, oa)) + ohl * Math.abs(dot(axis, of));
        const c = axis[0] * dx + axis[1] * dz;
        const ov = rp + ro - Math.abs(c);
        if (ov <= 0)
            return null;
        if (ov < best) {
            best = ov;
            const sg = c >= 0 ? 1 : -1;
            bx = axis[0] * sg * ov;
            bz = axis[1] * sg * ov;
        }
    }
    return { mx: bx, mz: bz };
}
/** Ids of the traffic cars whose hull currently overlaps the player's (diagnostics and tests). */
export function contactingIds(s) {
    return s.traffic.filter((o) => contact(s, o) !== null).map((o) => o.id);
}
/**
 * Cars are solid. Every overlap is pushed apart; while invulnerable the
 * contact costs nothing, otherwise it is a hit. No ghost corridor either way.
 */
export function resolveCollisions(s) {
    if (s.branch || s.ended)
        return { hit: false, gameOver: false };
    let hit = false;
    for (const o of s.traffic) {
        const c = contact(s, o);
        if (!c)
            continue;
        s.x += c.mx;
        s.d += c.mz;
        if (Math.abs(c.mx) >= Math.abs(c.mz)) {
            s.vx = Math.sign(c.mx) * Math.max(Math.abs(s.vx) * 0.3, 1.5);
        }
        else if (c.mz < 0) {
            // Rear-ended a car: cannot go faster than it.
            s.speed = Math.min(s.speed, o.speed);
        }
        if (s.inv <= 0 && !hit) {
            hit = true;
            s.hits++;
            applyHitImpulse(s, s.x >= o.x);
            if (s.mode === 'arcade' && s.hits >= 3) {
                s.ended = true;
                return { hit: true, gameOver: true };
            }
        }
    }
    return { hit, gameOver: false };
}
export function livesRemaining(s) {
    if (s.mode === 'explore')
        return 99;
    return Math.max(0, 3 - s.hits);
}
export function isShoulder(s) {
    return Math.abs(s.x) > PHYSICS.shoulderAbsX && !s.branch;
}
