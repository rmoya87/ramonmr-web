import { CAMERA } from './config.js';
/**
 * Classic chase cam: low and close so the player car fills the lower third
 * of the frame (OutRun-style), not a bird's-eye overview.
 */
export function stepCamera(s, pathOffset, _cameraMode, dt, reduceMotion) {
    const px = s.x + pathOffset;
    s.camX += (px - s.camX) * Math.min(1, dt * CAMERA.damp);
    const speedNorm = Math.min(1, s.speed / 210);
    s.fovBoost += (speedNorm * CAMERA.fovSpeedFactor - s.fovBoost) * Math.min(1, dt * 2);
    s.shake = Math.max(0, s.shake - dt * CAMERA.shakeDecay);
    if (reduceMotion)
        s.shake = 0;
    // Rise slightly with speed, stay behind the rear bumper.
    s.camY = 2.35 + speedNorm * 0.35 + s.shake * 0.08;
    s.camZ = -5.6 - speedNorm * 0.9;
}
export function cameraPose(s, pathOffset, _cameraMode, aspectPortrait) {
    const px = s.x + pathOffset;
    const shakeX = (Math.random() - 0.5) * s.shake * 0.1;
    const lookAhead = Math.sin(s.steer) * 1.4;
    return {
        pos: { x: s.camX + shakeX * 0.5, y: s.camY || 2.35, z: s.camZ || -5.6 },
        target: { x: px + lookAhead, y: 1.05, z: 22 },
        fovMul: (aspectPortrait ? 0.92 : 0.72) * (1 - s.fovBoost * 0.85),
    };
}
