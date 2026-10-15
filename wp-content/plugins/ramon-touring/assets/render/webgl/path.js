/** Shared road path math — must stay identical to pre-3.0 curve/ramp. */
export const curve = (d) => Math.sin(d / 210) * 30 + Math.sin(d / 620) * 45 + Math.sin(d / 1050) * 35;
/**
 * Chase cam looks +Z from behind; Three.js then puts world +X on screen-left.
 * Flip the projection X scale after updateProjectionMatrix so +X = screen-right.
 */
export function mirrorChaseProjection(camera) {
    camera.projectionMatrix.elements[0] *= -1;
}
export function ramp(t) {
    return 4.6 + Math.max(0, t) * 0.12 + Math.sin(Math.max(0, t) / 180) * 2;
}
export function inExitClearance(t) {
    return t > -40 && t < 340;
}
/**
 * Soft appear/disappear along chase Z: 0 at far horizon and behind camera, 1 in the readable band.
 * `z` is distance ahead of the player (negative = behind).
 */
export function depthPresence(z, farZ, nearZ = -10, fadeIn = 55, fadeOut = 14) {
    const enter = 1 - smooth01(farZ - fadeIn, farZ, z);
    const leave = smooth01(nearZ, nearZ + fadeOut, z);
    return enter * leave;
}
function smooth01(edge0, edge1, x) {
    if (edge0 === edge1)
        return x < edge0 ? 0 : 1;
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}
/** Road heading in radians from a longer tangent sample (avoids sideways cars). */
export function roadYaw(d, z, span = 14) {
    const dx = curve(d + z + span) - curve(d + z - span);
    const yaw = Math.atan2(dx, span * 2);
    const max = 0.32;
    return Math.max(-max, Math.min(max, yaw));
}
