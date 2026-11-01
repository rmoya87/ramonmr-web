import { SCORE, TRAFFIC, VEHICLE_TYPES, type VehicleTypeId } from './config.js';
import type { RunState, TrafficCar } from './types.js';

const COLORS = ['#f0e8d8', '#5a9ab0', '#d4c07a', '#6a7a8c', '#c07858', '#7a9aac', '#e8a0a8', '#88b878'];
const TYPE_WEIGHTS: VehicleTypeId[] = ['sedan', 'sedan', 'sport', 'van', 'moto', 'slow', 'sedan', 'truck', 'sport', 'bus', 'moto', 'sedan'];

function pickType(level: number): VehicleTypeId {
  const idx = Math.min(TYPE_WEIGHTS.length - 1, Math.floor(Math.random() * (6 + Math.min(6, level))));
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
    yaw: 0,
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
  const step = mode === 'explore' ? 24 : 11;
  for (let i = 0; i < n; i++) {
    const type = TYPE_WEIGHTS[i % TYPE_WEIGHTS.length];
    const def = VEHICLE_TYPES[type];
    const slot = findSlot(traffic, 70 + i * step, Math.floor(Math.random() * 3), def.w, def.l, -1);
    const car = makeCar(nextId++, slot.d, slot.lane, type);
    traffic.push(car);
  }
  return { traffic, nextId };
}

/** Does this car stop the player from using lane i? (body or its lane-change target) */
function blocksLane(c: { x: number; targetX: number; width: number }, i: number): boolean {
  const lx = TRAFFIC.lanes[i];
  return Math.abs(c.x - lx) < c.width / 2 + 0.95 || Math.abs(c.targetX - lx) < 0.6;
}

/**
 * Would a car at (x, d) complete a wall: all three lanes blocked inside one
 * stretch of road shorter than TRAFFIC.wallSpan? Used for spawns and lane
 * changes so the player always keeps a reachable gap.
 */
function formsWall(
  traffic: TrafficCar[],
  probe: { x: number; targetX: number; width: number; d: number },
  exceptId: number,
  S: number = TRAFFIC.wallSpan,
): boolean {
  const others = traffic.filter((c) => c.id !== exceptId && Math.abs(c.d - probe.d) < S);
  const members = [probe, ...others];
  for (const m of members) {
    if (m.d < probe.d - S || m.d > probe.d) continue; // window starts at m, must contain probe
    const lanes = [false, false, false];
    for (const c of members) {
      if (c.d < m.d || c.d > m.d + S) continue;
      for (let i = 0; i < 3; i++) if (blocksLane(c, i)) lanes[i] = true;
    }
    if (lanes[0] && lanes[1] && lanes[2]) return true;
  }
  return false;
}

/** First lane/depth at or beyond d0 with clear road and no wall. */
function findSlot(
  traffic: TrafficCar[],
  d0: number,
  startLane: number,
  width: number,
  length: number,
  exceptId: number,
): { lane: number; d: number } {
  for (let nudge = 0; nudge < 40; nudge++) {
    const d = d0 + nudge * 5;
    for (let k = 0; k < 3; k++) {
      const lane = (startLane + k) % 3;
      const lx = TRAFFIC.lanes[lane];
      if (!gapClear(traffic, lx, d, exceptId, length)) continue;
      if (formsWall(traffic, { x: lx, targetX: lx, width, d }, exceptId)) continue;
      return { lane, d };
    }
  }
  return { lane: startLane % 3, d: d0 + 200 };
}

function carsInLane(traffic: TrafficCar[], laneX: number, exceptId: number): TrafficCar[] {
  return traffic.filter(
    (c) =>
      c.id !== exceptId &&
      (Math.abs(c.x - laneX) < c.width / 2 + 1.0 || Math.abs(c.targetX - laneX) < 0.6),
  );
}

function gapClear(traffic: TrafficCar[], laneX: number, d: number, exceptId: number, myLength = 4.5): boolean {
  for (const c of carsInLane(traffic, laneX, exceptId)) {
    if (Math.abs(c.d - d) < TRAFFIC.safeGap + (c.length + myLength) * 0.5) return false;
  }
  return true;
}

/** Nearest car ahead that overlaps my body sideways (real widths, mid-change cars included). */
function frontCar(traffic: TrafficCar[], me: TrafficCar): TrafficCar | null {
  let best: TrafficCar | null = null;
  for (const c of traffic) {
    if (c.id === me.id) continue;
    if (Math.abs(c.x - me.x) > (c.width + me.width) * 0.5 + 0.15) continue;
    if (c.d <= me.d) continue;
    if (!best || c.d < best.d) best = c;
  }
  return best;
}

const WALL_LOOKAHEAD = [0.4, 0.8, 1.2, 1.6, 2, 2.4, 2.8, 3.2, 3.6, 4, 4.5, 5, 5.5];

export type PassEvent = { id: number; close: boolean };

/** Advance NPCs, lane AI, recycle. Returns overtake events. */
export function stepTraffic(s: RunState, dt: number): PassEvent[] {
  const level = 1 + Math.floor(s.time / SCORE.levelSeconds);
  // Keep relative closing rate high: traffic lags the player more as levels climb.
  const lag =
    s.mode === 'explore' ? 1 : Math.max(0.72, 1 - Math.min(0.28, (level - 1) * 0.025 + s.time * 0.00035));
  const events: PassEvent[] = [];
  const bias = wallBias(s);

  for (const o of s.traffic) {
    const def = VEHICLE_TYPES[o.type];
    const front = frontCar(s.traffic, o);
    let desired =
      def.preferred +
      (s.mode === 'arcade' ? Math.min(40, (level - 1) * 3.5 + s.time * 0.04) : Math.min(18, s.time * 0.08));
    desired *= lag;
    desired += bias.get(o.id) ?? 0;

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
            if (
              gapClear(s.traffic, lx, o.d, o.id, o.length) &&
              gapClear(s.traffic, lx, o.d + 12, o.id, o.length) &&
              !formsWall(s.traffic, { x: lx, targetX: lx, width: o.width, d: o.d }, o.id)
            ) {
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

    // Do not drift into a three-lane wall: if moving at this speed would line
    // me up with cars in the other lanes inside wallSpan, ease off to their pace.
    if (s.mode === 'arcade' && !formsWall(s.traffic, o, o.id)) {
      for (const tau of WALL_LOOKAHEAD) {
        const proxies = s.traffic.map((c) => ({
          id: c.id,
          x: c.x,
          targetX: c.targetX,
          width: c.width,
          length: c.length,
          d: c.d + (c.speed / 3.6) * tau,
        })) as unknown as TrafficCar[];
        const me = proxies.find((c) => c.id === o.id)!;
        if (formsWall(proxies, me, o.id)) {
          const slower = Math.min(...s.traffic.filter((c) => c.id !== o.id && Math.abs(c.d - o.d) < 40).map((c) => c.speed), o.speed);
          desired = Math.min(desired, slower - 2);
          break;
        }
      }
    }

    o.speed += (desired - o.speed) * Math.min(1, dt * (def.accel / 10));
    if (desired < o.speed - 6) o.speed = Math.max(desired, o.speed - 28 * dt);
    const prevD = o.d;
    o.d += (o.speed / 3.6) * dt;
    // Hard hold: a move that would complete a tight three-lane wall is undone
    // and the car takes the pace of its neighbours instead.
    if (s.mode === 'arcade' && formsWall(s.traffic, o, o.id, TRAFFIC.wallHold)) {
      const wasD = o.d;
      o.d = prevD;
      if (!formsWall(s.traffic, o, o.id, TRAFFIC.wallHold)) {
        const near = s.traffic.filter((c) => c.id !== o.id && Math.abs(c.d - o.d) < TRAFFIC.wallHold + 6);
        const pace = near.length ? Math.min(...near.map((c) => c.speed)) : o.speed;
        o.speed = Math.min(o.speed, pace);
        o.d = prevD + Math.min(wasD - prevD, (o.speed / 3.6) * dt);
        // The slower step may still close the wall: then do not move at all.
        if (formsWall(s.traffic, o, o.id, TRAFFIC.wallHold)) o.d = prevD;
      } else {
        o.d = wasD; // already walled before moving: let the resolver handle it
      }
    }

    // Hard separation: an NPC may never overlap the car in front of it,
    // no matter how its speed was set (spawns, blockade gaps, boosts).
    // Without this, fast cars visibly drove through slower ones.
    if (front) {
      const minSep = (o.length + front.length) * 0.5 + 1.2;
      if (front.d - o.d < minSep) {
        o.d = front.d - minSep;
        o.speed = Math.min(o.speed, front.speed);
      }
    }

    {
      // Heading follows the lateral motion of a lane change; the hull uses the same angle.
      const lat = o.changeTimer > 0 ? (o.targetX - o.x) * 3.4 : 0;
      const yt = Math.max(-0.14, Math.min(0.14, Math.atan2(lat, Math.max(18, o.speed / 3.6))));
      o.yaw += (yt - o.yaw) * Math.min(1, dt * 6);
      if (Math.abs(o.yaw) < 0.002 && yt === 0) o.yaw = 0;
    }
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

  return events;
}

function recycleCar(s: RunState, o: TrafficCar, level: number): void {
  const maxD = Math.max(...s.traffic.map((x) => x.d), s.d);
  const gap = packGap(level, s.mode);
  let d = maxD + gap * 0.6 + Math.random() * (6 + Math.max(0, 10 - level));
  // Keep the pack near the player so the road stays busy.
  const aheadCap = TRAFFIC.spawnAheadMin + 20 + Math.random() * 55;
  if (d - s.d > TRAFFIC.spawnAheadMax) d = s.d + aheadCap;
  if (d - s.d < TRAFFIC.spawnAheadMin) d = s.d + TRAFFIC.spawnAheadMin + Math.random() * 24;

  const type = pickType(level);
  const def = VEHICLE_TYPES[type];
  // Lane and depth with real road clear and no three-lane wall; if the pack is
  // too dense, slide further out (fog zone) rather than overlap or wall.
  const others = s.traffic.filter((x) => x.id !== o.id);
  const slot = findSlot(others, d, Math.floor(Math.random() * 3), def.w, def.l, o.id);

  o.id = s.nextTrafficId++;
  o.d = slot.d;
  o.x = TRAFFIC.lanes[slot.lane];
  o.targetX = o.x;
  o.passed = false;
  o.type = type;
  o.speed = def.preferred;
  o.width = def.w;
  o.length = def.l;
  o.state = 'cruise';
  o.changeTimer = 0;
  o.yaw = 0;
  o.color = COLORS[o.id % COLORS.length];
}

/** Cars (one per lane) that currently form a wall inside TRAFFIC.wallSpan. */
function findWall(s: RunState, tau: number): TrafficCar[] | null {
  const S = TRAFFIC.wallSpan;
  const proj = s.traffic
    .filter((c) => c.d - s.d > -6 && c.d - s.d < 300)
    .map((c) => ({ c, d: c.d + (c.speed / 3.6) * tau }))
    .sort((a, b) => a.d - b.d);
  for (const p of proj) {
    const pick: (TrafficCar | undefined)[] = [undefined, undefined, undefined];
    for (const q of proj) {
      if (q.d < p.d || q.d > p.d + S) continue;
      for (let i = 0; i < 3; i++) if (!pick[i] && blocksLane(q.c, i)) pick[i] = q.c;
    }
    if (pick[0] && pick[1] && pick[2]) return Array.from(new Set(pick as TrafficCar[]));
  }
  return null;
}

/**
 * Dissolve walls instead of preventing them only at spawn: cars drift at
 * different speeds, so a wall can form later. Resolve it dt-scaled (no
 * teleports near the player): the member with the most road ahead pulls away
 * while the member with the most room behind eases off. Far in the fog
 * (beyond view) a clear slot is taken directly.
 */
function wallBias(s: RunState): Map<number, number> {
  const bias = new Map<number, number>();
  if (s.mode !== 'arcade') return bias;
  for (const tau of [0, 1, 2, 3, 4, 5, 6]) {
    const wall = findWall(s, tau);
    if (!wall) continue;
    const rank = wall.map((c) => {
      const front = frontCar(s.traffic, c);
      const ahead = front ? front.d - front.length / 2 - (c.d + c.length / 2) : 1e9;
      let behind = 1e9;
      for (const r of s.traffic) {
        if (r.id === c.id || r.d >= c.d) continue;
        if (Math.abs(r.x - c.x) > (r.width + c.width) * 0.5 + 0.15) continue;
        behind = Math.min(behind, c.d - c.length / 2 - (r.d + r.length / 2));
      }
      return { c, ahead, behind };
    });
    const far = rank.filter((r) => r.c.d - s.d > 440);
    if (far.length) {
      // Invisible zone: relocate the car with most room to a wall-free slot.
      const m = far.sort((a, b) => b.ahead - a.ahead)[0].c;
      const rest = s.traffic.filter((x) => x.id !== m.id);
      const slot = findSlot(rest, m.d + 6, TRAFFIC.lanes.indexOf(m.targetX as (typeof TRAFFIC.lanes)[number]), m.width, m.length, m.id);
      if (slot.d - s.d > 440) {
        m.d = slot.d;
        m.x = m.targetX = TRAFFIC.lanes[slot.lane];
        m.changeTimer = 0;
        m.yaw = 0;
        break;
      }
    }
    const fwd = rank.slice().sort((a, b) => b.ahead - a.ahead)[0];
    const back = rank.filter((r) => r !== fwd).sort((a, b) => b.behind - a.behind)[0];
    if (fwd.ahead >= 18) bias.set(fwd.c.id, 30);
    if (back && back.behind >= 18) bias.set(back.c.id, -40);
    break;
  }
  return bias;
}
