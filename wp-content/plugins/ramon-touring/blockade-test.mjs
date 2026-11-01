import { createInitialTraffic, stepTraffic } from './assets/game/TrafficManager.js';
import { createRun } from './assets/game/GameManager.js';

// Build a run and force a 3-lane wall 20m ahead (level < 6 -> preventBlockade active)
const s = createRun('arcade');
s.d = 1000; s.speed = 160; s.time = 10;
s.traffic = [
  { id:1, d:1020, x:-4, targetX:-4, color:'#fff', passed:false, type:'slow', speed:60, state:'cruise', changeTimer:0, width:1.65, length:3.8 },
  { id:2, d:1022, x:0,  targetX:0,  color:'#fff', passed:false, type:'slow', speed:60, state:'cruise', changeTimer:0, width:1.65, length:3.8 },
  { id:3, d:1021, x:4,  targetX:4,  color:'#fff', passed:false, type:'slow', speed:60, state:'cruise', changeTimer:0, width:1.65, length:3.8 },
];
s.nextTrafficId = 4;
const before = s.traffic.map(c=>({...c}));
for (let i=0;i<120;i++) stepTraffic(s, 1/60); // 2 seconds
let maxJump = 0, teleport = false;
for (const c of s.traffic) {
  const b = before.find(x=>x.id===c.id);
  const jump = c.d - b.d;
  maxJump = Math.max(maxJump, jump);
  // a teleport would show ~28m in one frame; over 2s at ~17-25 m/s the max legit is ~50m; check per-frame instead
}
// per-frame check: no single-step jump > 1m (fast car at 45m/s moves 0.75m per 1/60 step)
const s2 = createRun('arcade');
s2.d = 1000; s2.speed = 160; s2.time = 10;
s2.traffic = JSON.parse(JSON.stringify(s.traffic.length ? before : before)).map(c=>({...c, color:'#fff', passed:false, state:'cruise', changeTimer:0, targetX:c.x, width:1.65, length:3.8}));
s2.nextTrafficId = 4;
let worst = 0;
for (let i=0;i<120;i++) {
  const prev = s2.traffic.map(c=>c.d);
  stepTraffic(s2, 1/60);
  s2.traffic.forEach((c,j)=>{ worst = Math.max(worst, c.d - prev[j]); });
}
console.log('2s total advance per car:', s.traffic.map((c,i)=>+(c.d-before[i].d).toFixed(1)).join(','));
console.log('worst single-frame jump (m):', worst.toFixed(3));
console.log(worst < 1.0 ? 'PASS: no teleport' : 'FAIL: teleport still present');
