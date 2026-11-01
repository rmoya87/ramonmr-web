import { createInitialTraffic, stepTraffic } from './assets/game/TrafficManager.js';
import { createRun } from './assets/game/GameManager.js';
import { stepVehicle } from './assets/game/VehicleController.js';
import { resolveCollisions } from './assets/game/CollisionManager.js';

let fails = 0;
const check = (name, ok, detail='') => { console.log((ok?'PASS':'FAIL')+' '+name+(detail?' — '+detail:'')); if(!ok) fails++; };
const car = (id,d,x,type='slow',speed=60) => ({ id, d, x, targetX:x, color:'#fff', passed:false, type, speed, state:'cruise', changeTimer:0, width:1.65, length:3.8 });

// S1: 60 s stress at high player speed — no overlaps, no teleports, sane speeds
{
  const s = createRun('arcade');
  s.d = 0; s.speed = 250; s.time = 0;
  let minSep = 1e9, worstJump = 0, worstSpeed = 0;
  for (let i=0;i<3600;i++) {
    const prev = new Map(s.traffic.map(c=>[c.id,c.d]));
    stepTraffic(s, 1/60);
    s.d += 250/3.6/60;
    for (const c of s.traffic) {
      if (prev.has(c.id)) worstJump = Math.max(worstJump, c.d - prev.get(c.id));
      worstSpeed = Math.max(worstSpeed, c.speed);
    }
    for (let a=0;a<s.traffic.length;a++) for (let b=a+1;b<s.traffic.length;b++) {
      const A=s.traffic[a], B=s.traffic[b];
      if (Math.abs(A.x-B.x)<1.5) minSep = Math.min(minSep, Math.abs(A.d-B.d) - (A.length+B.length)*0.5);
    }
  }
  check('S1a 60s: NPCs nunca se solapan', minSep >= 1.1, 'minSep='+minSep.toFixed(2)+'m');
  check('S1b 60s: sin teletransportes/cohetes', worstJump <= 1.2, 'worst='+worstJump.toFixed(2)+'m/frame');
  check('S1c 60s: velocidades NPC acotadas', worstSpeed <= 170, 'max='+worstSpeed.toFixed(0)+'km/h');
}

// S2: NPC forced to change lane into a slower car 8m ahead — must not overlap
{
  const s = createRun('arcade');
  s.d = 1000; s.speed = 200; s.time = 10;
  const a = car(1, 1100, 0, 'sport', 110);       // fast, center lane
  const b = car(2, 1092, 0, 'slow', 60);          // slow car in front of it -> triggers overtake
  const c2 = car(3, 1106, 4, 'slow', 55);         // slower car in target lane
  s.traffic = [a,b,c2]; s.nextTrafficId = 4;
  let minSep = 1e9;
  for (let i=0;i<1200;i++) {
    stepTraffic(s, 1/60);
    for (let x=0;x<3;x++) for (let y=x+1;y<3;y++) {
      const A=s.traffic[x], B=s.traffic[y];
      if (Math.abs(A.x-B.x)<1.5) minSep = Math.min(minSep, Math.abs(A.d-B.d) - (A.length+B.length)*0.5);
    }
  }
  check('S2: cambio de carril hacia coche lento sin solape', minSep >= 1.0, 'minSep='+minSep.toFixed(2)+'m');
}

// S3: player at 300 km/h rear-ends a slow car — exactly one hit, speed penalty, no tunneling
{
  const s = createRun('arcade');
  s.d = 0; s.speed = 300; s.x = 0; s.inv = 0; s.hits = 0;
  s.traffic = [car(1, 50, 0, 'slow', 60)]; s.nextTrafficId = 2;
  let hits = 0, tunneled = false;
  for (let i=0;i<600 && !s.ended;i++) {
    stepVehicle(s, 0, false, 1/60);
    stepTraffic(s, 1/60);
    const r = resolveCollisions(s);
    if (r.hit) hits++;
    if (s.d > 200 && s.hits === 0) { tunneled = true; break; }
  }
  check('S3a: colisión a 300 km/h registra exactamente 1 golpe', hits === 1 && s.hits === 1, 'hits='+hits);
  check('S3b: sin tunneling a 300 km/h', !tunneled && s.speed < 300*0.6, 'speed='+Math.round(s.speed));
}

// S4: recycle burst — after falling far behind, respawns never overlap
{
  const s = createRun('arcade');
  s.d = 0; s.speed = 120; s.time = 0;
  let minSep = 1e9;
  for (let i=0;i<1800;i++) {
    stepTraffic(s, 1/60);
    s.d += 120/3.6/60;
    for (let a=0;a<s.traffic.length;a++) for (let b=a+1;b<s.traffic.length;b++) {
      const A=s.traffic[a], B=s.traffic[b];
      if (Math.abs(A.x-B.x)<1.5) minSep = Math.min(minSep, Math.abs(A.d-B.d) - (A.length+B.length)*0.5);
    }
  }
  check('S4: 30s con reciclaje continuo sin solapes', minSep >= 1.1, 'minSep='+minSep.toFixed(2)+'m');
}

// S5: vehicle physics sanity — accel asymptote, brake floor, x clamp
{
  const s = createRun('arcade');
  for (let i=0;i<3600;i++) stepVehicle(s, 0, false, 1/60);
  const topOk = s.speed > 150 && s.speed <= 300;
  for (let i=0;i<3600;i++) stepVehicle(s, 0, true, 1/60);
  const brakeOk = s.speed === 0;
  for (let i=0;i<600;i++) stepVehicle(s, -1, false, 1/60);
  const clampOk = s.x >= -8.01 && s.x <= 8.01;
  check('S5a: aceleración converge a tope', topOk, 'top='+Math.round(s.speed===0?0:s.speed));
  check('S5b: freno hasta 0 sin negativos', brakeOk);
  check('S5c: x nunca sale de la carretera', clampOk, 'x='+s.x.toFixed(2));
}
process.exit(fails ? 1 : 0);
