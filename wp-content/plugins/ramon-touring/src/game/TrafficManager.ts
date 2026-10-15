import { SCORE, TRAFFIC, VEHICLE_TYPES, type VehicleTypeId } from './config.js';
import type { RunState, TrafficCar } from './types.js';

const COLORS = ['#f0e8d8', '#5a9ab0', '#d4c07a', '#6a7a8c', '#c07858', '#7a9aac', '#e8a0a8', '#88b878'];
const TYPE_WEIGHTS: VehicleTypeId[] = ['sedan', 'sedan', 'sport', 'van', 'truck', 'slow', 'sedan', 'sport'];

function pickType(level: number): VehicleTypeId {
  const idx = Math.min(TYPE_WEIGHTS.length - 1, Math.floor(Math.random() * (3 + Math.min(4, level))));
  return TYPE_WEIGHTS[idx];
}

function makeCar(id: number, d: number, lane: number, type: VehicleTypeId): TrafficCar {
  const def = VEHICLE_TYPES[type];
  return {
    id,
    d,
    x: TRAFFIC.lanes[lane],
    targetX: TRAFFIC.lanes[lane],
    color: COLORS[id % COLORS.length],
    passed: false,
    type,
    speed: def.preferred,
    state: 'cruise',
    changeTimer: 0,
    width: def.w,
    length: def.l,
  };
}

/** Tighter packs as level climbs — late game should force crashes. */
function packGap(level: number, mode: RunState['mode']): number {
  if (mode === 'explore') return TRAFFIC.minGap * 1.5;
  const shrink = Math.min(12, (level - 1) * 1.35 + level * 0.4);
  return Math.max(11, TRAFFIC.minGap - shrink);
}

export function createInitialTraffic(mode: 'arcade' | 'explore'): { traffic: TrafficCar[]; nextId: number } {
  const n = mode === 'explore' ? TRAFFIC.poolExplore : TRAFFIC.poolArcade;
  const traffic: TrafficCar[] = [];
  let nextId = 1;
  // Staggered dense seed: every lane fills every ~28–36 m.
  const rowGap = mode === 'explore' ? 70 : 32;
  for (let i = 0; i < n; i++) {
    const lane = i % 3;
    const row = Math.floor(i / 3);
    const d = 70 + row * rowGap + (lane - 1) * 8 + (i % 5) * 3;
    traffic.push(makeCar(nextId++, d, lane, TYPE_WEIGHTS[i % TYPE_WEIGHTS.length]));
  }
  return { traffic, nextId };
}

function carsInLane(traffic: TrafficCar[], laneX: number, exceptId: number): TrafficCar[] {
  return traffic.filter((c) => c.id !== exceptId && Math.abs(c.x - laneX) < 1.2);
}

function gapClear(traffic: TrafficCar[], laneX: number, d: number, exceptId: number): boolean {
  for (const c of carsInLane(traffic, laneX, exceptId)) {
    if (Math.abs(c.d - d) < TRAFFIC.safeGap + c.length * 0.5) return false;
  }
  return true;
}

function frontCar(traffic: TrafficCar[], me: TrafficCar): TrafficCar | null {
  let best: TrafficCar | null = null;
  for (const c of traffic) {
    if (c.id === me.id) continue;
    if (Math.abs(c.x - me.x) > 1.5) continue;
    if (c.d <= me.d) continue;
    if (!best || c.d < best.d) best = c;
  }
  return best;
}

export type PassEvent = { id: number; close: boolean };

/** Advance NPCs, lane AI, recycle. Returns overtake events. */
export function stepTraffic(s: RunState, dt: number): PassEvent[] {
  const level = 1 + Math.floor(s.time / SCORE.levelSeconds);
  // Keep relative closing rate high: traffic lags the player more as levels climb.
  const lag =
    s.mode === 'explore' ? 1 : Math.max(0.72, 1 - Math.min(0.28, (level - 1) * 0.025 + s.time * 0.00035));
  const events: PassEvent[] = [];

  for (const o of s.traffic) {
    const def = VEHICLE_TYPES[o.type];
    const front = frontCar(s.traffic, o);
    let desired =
      def.preferred +
      (s.mode === 'arcade' ? Math.min(40, (level - 1) * 3.5 + s.time * 0.04) : Math.min(18, s.time * 0.08));
    desired *= lag;

    if (front) {
      const gap = front.d - o.d;
      if (gap < def.gap) {
        o.state = 'follow';
        desired = Math.min(desired, front.speed - 4);
        if (gap < def.gap * 0.7 && o.changeTimer <= 0 && Math.random() < def.overtake * dt * (1 + level * 0.08)) {
          const myLane = TRAFFIC.lanes.indexOf(o.targetX as (typeof TRAFFIC.lanes)[number]);
          const candidates = [myLane - 1, myLane + 1].filter((l) => l >= 0 && l < 3);
          for (const lane of candidates) {
            const lx = TRAFFIC.lanes[lane];
            if (gapClear(s.traffic, lx, o.d, o.id) && gapClear(s.traffic, lx, o.d + 12, o.id)) {
              o.targetX = lx;
              o.state = 'change';
              o.changeTimer = TRAFFIC.laneChangeCooldown;
              break;
            }
          }
        }
      } else {
        o.state = o.changeTimer > 0 ? 'change' : 'cruise';
      }
    } else {
      o.state = o.changeTimer > 0 ? 'change' : 'cruise';
    }

    o.speed += (desired - o.speed) * Math.min(1, dt * (def.accel / 10));
    o.d += (o.speed / 3.6) * dt;

    if (o.changeTimer > 0) {
      o.changeTimer -= dt;
      o.x += (o.targetX - o.x) * Math.min(1, dt * 3.4);
      if (o.changeTimer <= 0) {
        o.x = o.targetX;
        o.state = 'cruise';
      }
    }

    const z = o.d - s.d;
    if (z < -4 && !o.passed) {
      o.passed = true;
      if (!s.branch && s.mode === 'arcade') {
        const close = Math.abs(o.x - s.x) < TRAFFIC.overtakeCloseDist;
        events.push({ id: o.id, close });
      }
    }

    if (z < -TRAFFIC.recycleBehind) {
      recycleCar(s, o, level);
    }
  }

  // Avoid full triple-lane wall just ahead of the player (early levels only).
  if (level < 6) preventBlockade(s);
  return events;
}

function recycleCar(s: RunState, o: TrafficCar, level: number): void {
  const maxD = Math.max(...s.traffic.map((x) => x.d), s.d);
  const gap = packGap(level, s.mode);
  let d = maxD + gap + Math.random() * (8 + Math.max(0, 14 - level));
  // Keep the pack near the player so the road stays busy.
  const aheadCap = TRAFFIC.spawnAheadMin + 20 + Math.random() * 55;
  if (d - s.d > TRAFFIC.spawnAheadMax) d = s.d + aheadCap;
  if (d - s.d < TRAFFIC.spawnAheadMin) d = s.d + TRAFFIC.spawnAheadMin + Math.random() * 24;

  const type = pickType(level);
  const def = VEHICLE_TYPES[type];
  let lane = Math.floor(Math.random() * 3);
  for (let attempt = 0; attempt < 6; attempt++) {
    const lx = TRAFFIC.lanes[lane];
    if (gapClear(s.traffic, lx, d, o.id)) break;
    lane = (lane + 1) % 3;
  }

  o.id = s.nextTrafficId++;
  o.d = d;
  o.x = TRAFFIC.lanes[lane];
  o.targetX = o.x;
  o.passed = false;
  o.type = type;
  o.speed = def.preferred;
  o.width = def.w;
  o.length = def.l;
  o.state = 'cruise';
  o.changeTimer = 0;
  o.color = COLORS[o.id % COLORS.length];
}

function preventBlockade(s: RunState): void {
  const ahead = s.traffic.filter((c) => {
    const z = c.d - s.d;
    return z > 8 && z < 40;
  });
  const lanes = new Set(ahead.map((c) => Math.round(c.x)));
  if (lanes.size < 3) return;
  const right = ahead.reduce((a, b) => (b.x > a.x ? b : a));
  right.d += 28;
  right.passed = false;
}
