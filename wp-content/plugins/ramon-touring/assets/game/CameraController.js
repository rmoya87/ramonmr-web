import { CAMERA } from './config.js';
export function stepCamera(s, pathOffset, cameraMode, dt, reduceMotion) {
    const px = s.x + pathOffset;
    s.camX += (px - s.camX) * Math.min(1, dt * CAMERA.damp);
    const lookAhead = Math.sin(s.steer) * 2.4;
    const speedNorm = Math.min(1, s.speed / 210);
    s.fovBoost += (speedNorm * CAMERA.fovSpeedFactor - s.fovBoost) * Math.min(1, dt * 2);
    s.shake = Math.max(0, s.shake - dt * CAMERA.shakeDecay);
    if (reduceMotion)
        s.shake = 0;
    // Store look target helpers on state camY/camZ for renderer
    const mode = ((cameraMode % CAMERA.modes) + CAMERA.modes) % CAMERA.modes;
    if (mode === 0) {
        s.camY = 3.15 + s.shake * 0.12;
        s.camZ = -8.7;
    }
    else if (mode === 1) {
        s.camY = 1.7 + s.shake * 0.08;
        s.camZ = -3.6;
    }
    else {
        s.camY = 1.15;
        s.camZ = 0.8;
    }
    void lookAhead;
}
export function cameraPose(s, pathOffset, cameraMode, aspectPortrait) {
    const mode = ((cameraMode % CAMERA.modes) + CAMERA.modes) % CAMERA.modes;
    const px = s.x + pathOffset;
    const shakeX = (Math.random() - 0.5) * s.shake * 0.15;
    const lookAhead = Math.sin(s.steer) * 2.2;
    if (mode === 2) {
        return {
            pos: { x: s.camX + shakeX, y: 1.2, z: 1.4 },
            target: { x: px + lookAhead * 0.5, y: 1.0, z: 28 },
            fovMul: (aspectPortrait ? 1.05 : 0.82) * (1 - s.fovBoost),
        };
    }
    if (mode === 1) {
        return {
            pos: { x: s.camX + shakeX, y: s.camY, z: s.camZ },
            target: { x: px + lookAhead, y: 1.15, z: 22 },
            fovMul: (aspectPortrait ? 1.03 : 0.8) * (1 - s.fovBoost),
        };
    }
    return {
        pos: { x: s.camX + shakeX * 0.6, y: s.camY, z: s.camZ },
        target: { x: px + lookAhead, y: 0.8, z: 13 },
        fovMul: (aspectPortrait ? 1.03 : 0.8) * (1 - s.fovBoost),
    };
}
