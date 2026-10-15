import { CAMERA } from './config.js';
import type { RunState } from './types.js';

export type CamPose = {
  pos: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fovMul: number;
};

/**
 * Mid-distance chase cam: car clearly readable in the lower frame,
 * with enough space ahead so it does not feel glued to the lens.
 */
export function stepCamera(s: RunState, pathOffset: number, _cameraMode: number, dt: number, reduceMotion: boolean): void {
  const px = s.x + pathOffset;
  s.camX += (px - s.camX) * Math.min(1, dt * CAMERA.damp);
  const speedNorm = Math.min(1, s.speed / 210);
  s.fovBoost += (speedNorm * CAMERA.fovSpeedFactor - s.fovBoost) * Math.min(1, dt * 2);
  s.shake = Math.max(0, s.shake - dt * CAMERA.shakeDecay);
  if (reduceMotion) s.shake = 0;
  s.camY = 3.55 + speedNorm * 0.4 + s.shake * 0.08;
  s.camZ = -10.8 - speedNorm * 1.1;
}

export function cameraPose(s: RunState, pathOffset: number, _cameraMode: number, aspectPortrait: boolean): CamPose {
  const px = s.x + pathOffset;
  const shakeX = (Math.random() - 0.5) * s.shake * 0.1;
  const lookAhead = Math.sin(s.steer) * 1.6;
  return {
    pos: { x: s.camX + shakeX * 0.5, y: s.camY || 3.55, z: s.camZ || -10.8 },
    target: { x: px + lookAhead, y: 1.1, z: 18 },
    fovMul: (aspectPortrait ? 0.96 : 0.76) * (1 - s.fovBoost * 0.8),
  };
}
