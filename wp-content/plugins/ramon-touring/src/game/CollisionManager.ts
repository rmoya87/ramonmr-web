import { COLLISION, PHYSICS } from './config.js';
import { applyHitImpulse } from './VehicleController.js';
import type { RunState } from './types.js';

export type CollisionResult = { hit: boolean; gameOver: boolean };

/** Swept-ish AABB using current positions; invulnerability prevents multi-life drain. */
export function resolveCollisions(s: RunState): CollisionResult {
  if (s.inv > 0 || s.branch || s.ended) return { hit: false, gameOver: false };

  for (const o of s.traffic) {
    const z = o.d - s.d;
    const halfL = (COLLISION.length + o.length) * 0.5 * 0.55;
    const halfW = (COLLISION.width + o.width) * 0.5 * 0.85;
    if (Math.abs(z) < halfL && Math.abs(o.x - s.x) < halfW) {
      s.hits++;
      applyHitImpulse(s, s.x >= o.x);
      const lives = s.mode === 'arcade' ? 3 : Infinity;
      if (s.mode === 'arcade' && s.hits >= lives) {
        s.ended = true;
        return { hit: true, gameOver: true };
      }
      // Soft separation
      s.x += s.x >= o.x ? 0.4 : -0.4;
      return { hit: true, gameOver: false };
    }
  }
  return { hit: false, gameOver: false };
}

export function livesRemaining(s: RunState): number {
  if (s.mode === 'explore') return 99;
  return Math.max(0, 3 - s.hits);
}

export function isShoulder(s: RunState): boolean {
  return Math.abs(s.x) > PHYSICS.shoulderAbsX && !s.branch;
}
