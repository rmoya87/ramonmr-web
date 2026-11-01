import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { stepTraffic } from '../../assets/game/TrafficManager.js';
import { createRun } from '../../assets/game/GameManager.js';
import { TRAFFIC } from '../../assets/game/config.js';

const inLane = (c, i) => Math.abs(c.x - TRAFFIC.lanes[i]) < c.width / 2 + 0.85;

describe('traffic keeps one lane open and no lane stays bare', () => {
  for (const [t0, spd] of [[0, 160], [200, 220], [400, 250]]) {
    it(`t0=${t0} speed=${spd}`, () => {
      const s = createRun('arcade');
      s.time = t0;
      s.speed = spd;
      let triples = 0;
      const run = [0, 0, 0];
      const worst = [0, 0, 0];
      for (let i = 0; i < 3600 * 2; i++) {
        stepTraffic(s, 1 / 60);
        s.d += spd / 3.6 / 60;
        s.time += 1 / 60;
        const cars = s.traffic.filter((c) => c.d - s.d > 8 && c.d - s.d < 120);
        for (let l = 0; l < 3; l++) {
          if (!cars.some((c) => inLane(c, l))) worst[l] = Math.max(worst[l], ++run[l]);
          else run[l] = 0;
        }
        for (const p of cars) {
          const seen = new Set();
          for (const c of cars) if (c.d >= p.d && c.d <= p.d + 24) for (let l = 0; l < 3; l++) if (inLane(c, l)) seen.add(l);
          if (seen.size === 3) { triples++; break; }
        }
      }
      assert.equal(triples, 0, 'three lanes occupied inside 24 m');
      for (const w of worst) assert.ok(w / 60 < 10, `a lane stayed bare for ${(w / 60).toFixed(1)} s`);
    });
  }
});
