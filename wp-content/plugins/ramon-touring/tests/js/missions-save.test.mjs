import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../../assets/game/GameManager.js';
import { assignMission, checkMissionComplete, MISSIONS } from '../../assets/game/MissionManager.js';
import { loadProgress, saveProgress, updateProgressFromRun } from '../../assets/game/SaveManager.js';

describe('Missions', () => {
  it('completes a pass mission', () => {
    const s = createRun('arcade');
    assignMission(s, []);
    s.missionId = 'pass5';
    s.missionTarget = 5;
    s.missionProgress = 5;
    const r = checkMissionComplete(s, [], 0, false);
    assert.ok(r.completed.includes('pass5'));
    assert.ok(r.popup);
    assert.ok(MISSIONS.length >= 5);
  });
});

describe('SaveManager', () => {
  it('updates personal bests', () => {
    const mem = new Map();
    globalThis.localStorage = {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    };
    const s = createRun('arcade');
    s.score = 2500;
    s.d = 3500;
    s.combo = 6;
    s.discovered = [0, 1];
    let p = loadProgress();
    p = updateProgressFromRun(p, s);
    saveProgress(p);
    const again = loadProgress();
    assert.equal(again.bestScore, 2500);
    assert.ok(again.bestDistance >= 3500);
    assert.equal(again.bestCombo, 6);
  });
});
