import { PHYSICS, SCORE } from './config.js';
import type { RunState } from './types.js';

export function targetTopSpeed(s: RunState): number {
  if (s.branch) return 65;
  if (s.mode === 'explore') return PHYSICS.exploreTop;
  return Math.min(PHYSICS.maxSpeed - 5, PHYSICS.arcadeTopBase + s.time * PHYSICS.arcadeTopRamp);
}

/** Arcade vehicle integration for one fixed dt step. */
export function stepVehicle(s: RunState, steerAxis: number, brake: boolean, dt: number, rain = false): void {
  s.time += dt;
  s.inv = Math.max(0, s.inv - dt);
  if (s.comboTimer > 0) {
    s.comboTimer -= dt;
    if (s.comboTimer <= 0) s.combo = 0;
  }

  const shoulder = Math.abs(s.x) > PHYSICS.shoulderAbsX && !s.branch;
  const top = targetTopSpeed(s);
  let accel = brake ? -PHYSICS.brakeDecel : Math.min(PHYSICS.accelCap, (top - s.speed) * PHYSICS.accelGain);
  if (shoulder) accel -= PHYSICS.shoulderPenalty;
  const grip = rain ? PHYSICS.rainGripMul : 1;

  s.speed = Math.max(0, Math.min(PHYSICS.maxSpeed, s.speed + accel * dt));
  const targetSteer = steerAxis / (1 + s.speed / PHYSICS.steerSpeedFactor);
  s.steer += (targetSteer - s.steer) * Math.min(1, dt * PHYSICS.steerLerp);

  const drift = brake && s.speed > PHYSICS.driftSpeedMin && Math.abs(s.steer) > PHYSICS.driftSteerMin;
  s.slip += (Number(drift) - s.slip) * Math.min(1, dt * PHYSICS.slipLerp);

  const vxLerp = drift ? PHYSICS.driftVxLerp : PHYSICS.vxLerp;
  const lateral = s.steer * (8 + s.speed * 0.015) * (shoulder ? 0.52 : 1) * grip;
  s.vx += (lateral - s.vx) * Math.min(1, dt * vxLerp);
  s.yaw += (Math.atan2(s.vx, Math.max(1, s.speed / 3.6)) * (0.9 + s.slip * 0.7) - s.yaw) * Math.min(1, dt * PHYSICS.yawLerp);

  const minX = s.branch ? -PHYSICS.branchHalfWidth : -PHYSICS.roadHalfWidth;
  const maxX = s.branch ? PHYSICS.branchHalfWidth : 8;
  s.x = Math.max(minX, Math.min(maxX, s.x + s.vx * dt));
  s.d += (s.speed / 3.6) * dt;

  if (!s.branch && s.mode === 'arcade') {
    const level = Math.floor(s.time / SCORE.levelSeconds);
    s.score += (s.speed / 3.6) * dt * (1 + level * SCORE.distanceMulPerLevel);
  }

  if (!brake && Math.abs(steerAxis) < 0.05) {
    s.vx *= 1 - Math.min(1, dt * 2.5);
  }

  if (s.hits === 0 && !s.branch) s.cleanTimer += dt;
  else if (s.hits > 0) s.cleanTimer = 0;
}

export function applyHitImpulse(s: RunState, fromLeft: boolean): void {
  s.speed *= PHYSICS.hitSpeedMul;
  s.inv = PHYSICS.invulnerability;
  s.vx += (fromLeft ? 1 : -1) * 2;
  s.shake = Math.min(1, s.shake + 0.55);
  s.combo = 0;
  s.comboTimer = 0;
  s.cleanTimer = 0;
}
