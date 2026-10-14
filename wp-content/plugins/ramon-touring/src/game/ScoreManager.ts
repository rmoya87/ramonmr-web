import { SCORE, SCORE_VERSION } from './config.js';
import type { PassEvent } from './TrafficManager.js';
import type { RunState } from './types.js';

const awardedPasses = new Set<number>();

export function resetPassTracking(): void {
  awardedPasses.clear();
}

export type ScorePopup = { text: string; points: number; at: number };

export function applyPassEvents(s: RunState, events: PassEvent[], now: number): ScorePopup[] {
  if (s.mode !== 'arcade' || s.branch || s.ended) return [];
  const pops: ScorePopup[] = [];
  for (const e of events) {
    if (awardedPasses.has(e.id)) continue;
    awardedPasses.add(e.id);
    const base = e.close ? SCORE.closePass : SCORE.pass;
    const bonus = Math.min(SCORE.comboBonusCap, s.combo * SCORE.comboBonusPer);
    const gain = base + bonus;
    s.score += gain;
    s.combo++;
    s.comboTimer = SCORE.comboExpire;
    pops.push({
      text: e.close ? (s.combo > 1 ? `CLOSE x${s.combo}` : 'CLOSE') : s.combo > 1 ? `PASS x${s.combo}` : 'PASS',
      points: gain,
      at: now,
    });
  }
  return pops;
}

export function award(s: RunState, amount: number, label: string, now: number): ScorePopup | null {
  if (s.mode !== 'arcade' || s.ended) return null;
  s.score += amount;
  return { text: label, points: amount, at: now };
}

export function levelOf(s: RunState): number {
  return 1 + Math.floor(s.time / SCORE.levelSeconds);
}

export function scoreMeta(): { version: number } {
  return { version: SCORE_VERSION };
}

/** Mirror of server ceiling intent for documentation/tests. */
export function estimateCeiling(elapsed: number): number {
  const blocks = Math.floor(elapsed / 30);
  const tail = elapsed % 30;
  const weighted = 30 * (blocks + 0.15 * (blocks * (blocks - 1)) / 2) + tail * (1 + 0.15 * blocks);
  const maxDistance = 305 / 3.6 * elapsed;
  const maxPasses = 9 + Math.ceil(maxDistance / 40);
  return Math.ceil(305 / 3.6 * weighted + 500 * maxPasses + 1000);
}
