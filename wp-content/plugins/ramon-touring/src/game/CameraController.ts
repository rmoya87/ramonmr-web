import { CAMERA } from './config.js';
import type { RunState } from './types.js';

export type CamPose = {
  pos: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fovMul: number;
};

/** Stable third-person chase: car in the lower frame, horizon and road readable. */
export function stepCamera(s: RunState, pathOffset: number, _cameraMode: number, dt: number, reduceMotion: boolean): void {
  const px = s.x + pathOffset;
  s.camX += (px - s.camX) * Math.min(1, dt * CAMERA.damp);
  const speedNorm = Math.min(1, s.speed / 210);
  s.fovBoost += (speedNorm * CAMERA.fovSpeedFactor - s.fovBoost) * Math.min(1, dt * 2.4);
  s.shake = Math.max(0, s.shake - dt * CAMERA.shakeDecay);
  if (reduceMotion) s.shake = 0;
  s.camY = 3.15 + speedNorm * 0.35 + s.shake * 0.06;
  s.camZ = -8.4 - speedNorm * 2.4;
}

export function cameraPose(s: RunState, pathOffset: number, _cameraMode: number, aspectPortrait: boolean): CamPose {
  const px = s.x + pathOffset;
  const shakeX = (Math.random() - 0.5) * s.shake * 0.08;
  const lookZ = 18;
  // Keep look nearly centered so the car doesn't read as skewed vs the lanes.
  const steerLook = s.steer * 0.35;
  return {
    pos: { x: s.camX + shakeX * 0.45, y: s.camY || 3.15, z: s.camZ || -8.4 },
    target: { x: px + steerLook, y: 0.45, z: lookZ },
    fovMul: (aspectPortrait ? 0.88 : 0.68) * (1 - s.fovBoost * 0.85),
  };
}
