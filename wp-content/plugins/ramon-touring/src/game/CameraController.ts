import { CAMERA } from './config.js';
import type { RunState } from './types.js';

export type CamPose = {
  pos: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fovMul: number;
};

/** Chase camera only — player car must stay visible ahead of the lens. */
export function stepCamera(s: RunState, pathOffset: number, _cameraMode: number, dt: number, reduceMotion: boolean): void {
  const px = s.x + pathOffset;
  s.camX += (px - s.camX) * Math.min(1, dt * CAMERA.damp);
  const speedNorm = Math.min(1, s.speed / 210);
  s.fovBoost += (speedNorm * CAMERA.fovSpeedFactor - s.fovBoost) * Math.min(1, dt * 2);
  s.shake = Math.max(0, s.shake - dt * CAMERA.shakeDecay);
  if (reduceMotion) s.shake = 0;
  s.camY = 3.35 + s.shake * 0.1;
  s.camZ = -9.2;
}

export function cameraPose(s: RunState, pathOffset: number, _cameraMode: number, aspectPortrait: boolean): CamPose {
  const px = s.x + pathOffset;
  const shakeX = (Math.random() - 0.5) * s.shake * 0.12;
  const lookAhead = Math.sin(s.steer) * 2.2;
  return {
    pos: { x: s.camX + shakeX * 0.6, y: s.camY || 3.35, z: s.camZ || -9.2 },
    target: { x: px + lookAhead, y: 0.95, z: 14 },
    fovMul: (aspectPortrait ? 1.05 : 0.85) * (1 - s.fovBoost),
  };
}
