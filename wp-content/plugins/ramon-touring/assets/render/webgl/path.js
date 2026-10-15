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
