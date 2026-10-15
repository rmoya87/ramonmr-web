import { CAMERA } from './config.js';
/** Chase camera — pulled back so the full car body stays in the lower frame. */
export function stepCamera(s, pathOffset, _cameraMode, dt, reduceMotion) {
    const px = s.x + pathOffset;
    s.camX += (px - s.camX) * Math.min(1, dt * CAMERA.damp);
    const speedNorm = Math.min(1, s.speed / 210);
    s.fovBoost += (speedNorm * CAMERA.fovSpeedFactor - s.fovBoost) * Math.min(1, dt * 2);
    s.shake = Math.max(0, s.shake - dt * CAMERA.shakeDecay);
    if (reduceMotion)
        s.shake = 0;
    s.camY = 5.1 + s.shake * 0.1;
    s.camZ = -14.5;
}
export function cameraPose(s, pathOffset, _cameraMode, aspectPortrait) {
    const px = s.x + pathOffset;
    const shakeX = (Math.random() - 0.5) * s.shake * 0.12;
    const lookAhead = Math.sin(s.steer) * 1.8;
    return {
        pos: { x: s.camX + shakeX * 0.6, y: s.camY || 5.1, z: s.camZ || -14.5 },
        target: { x: px + lookAhead, y: 1.15, z: 8 },
        fovMul: (aspectPortrait ? 0.98 : 0.78) * (1 - s.fovBoost),
    };
}
