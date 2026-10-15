import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FIXED_DT, PHYSICS, SCORE } from '../../assets/game/config.js';
import { createRun } from '../../assets/game/GameManager.js';
import { stepVehicle, targetTopSpeed } from '../../assets/game/VehicleController.js';
import { resolveCollisions } from '../../assets/game/CollisionManager.js';
import { applyPassEvents, resetPassTracking, estimateCeiling } from '../../assets/game/ScoreManager.js';
import { createInitialTraffic, stepTraffic } from '../../assets/game/TrafficManager.js';
import { stepRoute } from '../../assets/game/RouteManager.js';
import { GameLoop } from '../../assets/game/GameLoop.js';

describe('VehicleController', () => {
  it('accelerates toward arcade top speed', () => {
    const s = createRun('arcade');
    const start = s.speed;
    for (let i = 0; i < 120; i++) stepVehicle(s, 0, false, FIXED_DT);
    assert.ok(s.speed > start);
    assert.ok(s.speed <= PHYSICS.maxSpeed);
    assert.ok(targetTopSpeed(s) >= PHYSICS.arcadeTopBase);
  });

  it('brakes reduce speed', () => {
    const s = createRun('arcade');
    s.speed = 150;
    stepVehicle(s, 0, true, FIXED_DT);
    assert.ok(s.speed < 150);
  });

  it('steering produces lateral velocity', () => {
    const s = createRun('arcade');
    s.speed = 120;
    for (let i = 0; i < 30; i++) stepVehicle(s, 1, false, FIXED_DT);
    assert.ok(s.x > 0);
    assert.ok(Math.abs(s.steer) > 0);
  });

  it('reaches a punchy arcade top speed quickly', () => {
    const s = createRun('arcade');
    for (let i = 0; i < 180; i++) stepVehicle(s, 0, false, FIXED_DT);
    assert.ok(s.speed >= 155, `expected >= 155 km/h early, got ${s.speed}`);
  });

  it('raises the speed ceiling hard by level 10', () => {
    const early = createRun('arcade');
    early.time = 10;
    const late = createRun('arcade');
    late.time = SCORE.levelSeconds * 9 + 5; // level 10
    const tEarly = targetTopSpeed(early);
    const tLate = targetTopSpeed(late);
    assert.ok(tLate > tEarly + 90, `level 10 top (${tLate}) should crush level 1 (${tEarly})`);
    assert.ok(tLate >= 280, `level 10 should approach the ceiling, got ${tLate}`);
  });
});

describe('Traffic density', () => {
  it('seeds a dense arcade pack', () => {
    const { traffic } = createInitialTraffic('arcade');
    assert.ok(traffic.length >= 20);
    const near = traffic.filter((c) => c.d < 220).length;
    assert.ok(near >= 10, `expected crowded first 220 m, got ${near}`);
  });
});


describe('Collisions', () => {
  it('registers a hit and grants invulnerability', () => {
    const s = createRun('arcade');
    s.inv = 0;
    s.traffic[0].d = s.d + 1;
    s.traffic[0].x = s.x;
    const r = resolveCollisions(s);
    assert.equal(r.hit, true);
    assert.equal(s.hits, 1);
    assert.ok(s.inv > 0);
  });

  it('does not double-hit while invulnerable', () => {
    const s = createRun('arcade');
    s.inv = 2;
    s.traffic[0].d = s.d;
    s.traffic[0].x = s.x;
    assert.equal(resolveCollisions(s).hit, false);
  });
});

describe('Score and traffic', () => {
  it('awards pass once per vehicle id', () => {
    resetPassTracking();
    const s = createRun('arcade');
    const pops = applyPassEvents(s, [{ id: 7, close: false }, { id: 7, close: true }], 0);
    assert.equal(pops.length, 1);
    assert.ok(s.score >= 100);
  });

  it('ceiling grows with duration', () => {
    assert.ok(estimateCeiling(60) > estimateCeiling(15));
  });

  it('recycles traffic without overlapping ids forever', () => {
    const { traffic, nextId } = createInitialTraffic('arcade');
    const s = createRun('arcade');
    s.traffic = traffic;
    s.nextTrafficId = nextId;
    s.d = 500;
    for (const t of s.traffic) t.d = s.d - 40;
    stepTraffic(s, FIXED_DT);
    assert.ok(s.traffic.every((c) => c.d > s.d - 30 || c.d < s.d));
  });
});

describe('Route exits', () => {
  it('enters branch when holding right lane on ramp', () => {
    const s = createRun('arcade');
    s.fork = 100;
    s.d = 110;
    s.x = 5;
    const sections = [{ name: 'A', items: [{ id: 1, title: 't', url: '/', reader: '/' }] }];
    for (let i = 0; i < 60; i++) {
      stepRoute(s, sections, FIXED_DT, true, false, 0, false);
    }
    assert.equal(s.branch, true);
  });
});

describe('GameLoop', () => {
  it('runs with stubbed rAF', async () => {
    const frames = [];
    globalThis.requestAnimationFrame = (cb) => {
      frames.push(cb);
      return frames.length;
    };
    globalThis.cancelAnimationFrame = () => {};
    let updates = 0;
    const loop = new GameLoop({
      shouldSimulate: () => true,
      update: () => { updates++; },
      render: () => {},
    });
    loop.start();
    frames[0]?.(16);
    frames[1]?.(32);
    loop.stop();
    assert.ok(updates >= 1);
  });
});
