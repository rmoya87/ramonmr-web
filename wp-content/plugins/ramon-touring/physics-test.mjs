import { createInitialTraffic, stepTraffic } from './assets/game/TrafficManager.js';
import { createRun } from './assets/game/GameManager.js';
import { stepVehicle } from './assets/game/VehicleController.js';
import { resolveCollisions, contactingIds } from './assets/game/CollisionManager.js';

let fails = 0;
const check = (name, ok, detail='') => { console.log((ok?'PASS':'FAIL')+' '+name+(detail?' — '+detail:'')); if(!ok) fails++; };
const car = (id,d,x,type='slow',speed=60) => ({ id, d, x, targetX:x, color:'#fff', passed:false, type, speed, state:'cruise', changeTimer:0, yaw:0, width:1.65, length:3.8 });

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
  for (let i=0;i<120 && !s.ended;i++) { // first 2 s (invulnerability window)
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

// S6: no unpassable three-lane wall, any level, 5 min each
{
  const S = 14; let worst = 0;
  for (const [t0, spd] of [[0,160],[200,220],[400,250]]) {
    const s = createRun('arcade'); s.time = t0; s.speed = spd;
    for (let i=0;i<3600*5;i++) {
      stepTraffic(s, 1/60); s.d += spd/3.6/60; s.time += 1/60;
      const cars = s.traffic.filter(c => c.d - s.d > 8 && c.d - s.d < 160);
      for (const p of cars) {
        // Real free corridor: widest gap between car bodies (and road edges) across the carriageway.
        const iv = cars.filter(c => c.d >= p.d && c.d <= p.d + S).map(c => [c.x - c.width/2, c.x + c.width/2]).sort((a,b)=>a[0]-b[0]);
        let edge = -6, gap = 0;
        for (const [a,b] of iv) { gap = Math.max(gap, a - edge); edge = Math.max(edge, b); }
        gap = Math.max(gap, 6 - edge);
        if (gap < 1.84 + 0.4) { worst++; break; }
      }
    }
  }
  check('S6: siempre hay pasillo libre >= ancho del coche + 0.4 m (5 min x 3 niveles)', worst === 0, 'frames con muro='+worst);
}

// S7: collisions use real body geometry, also between lanes
{
  const mk = (x) => { const s = createRun('arcade'); s.d = 100; s.x = x; s.inv = 0; s.hits = 0; s.yaw = 0; s.speed = 100;
    s.traffic = [car(1, 100, 0, 'sedan', 100), car(2, 100, 4, 'sedan', 100)]; s.traffic.forEach(c => { c.width = 1.82; c.length = 4.5; });
    return s; };
  const gap = mk(2); const a = resolveCollisions(gap);
  check('S7a: entre dos coches con hueco real no hay golpe', !a.hit);
  const half = mk(1.2); const b = resolveCollisions(half);
  check('S7b: a caballo de la linea sobre un coche = golpe', b.hit);
  const nose = mk(0); nose.d = 100 - 3.9; const c = resolveCollisions(nose);
  check('S7c: morro contra cola con solape real = golpe', c.hit);
  const near = mk(0); near.d = 100 - 4.6; const d = resolveCollisions(near);
  check('S7d: separado por el largo real no hay golpe', !d.hit);
  const inv = mk(1.2); inv.inv = 1; resolveCollisions(inv);
  check('S7e: con invulnerabilidad el coche sigue siendo solido', Math.abs(inv.x - 0) >= 1.8, 'x='+inv.x.toFixed(2));
}

// S8: hull consistency. Rotated hulls (player yaw and NPC yaw, incl. bus/truck) must agree with an
// independent boundary-sampling overlap test, so what you see overlapping is a contact and vice versa.
{
  const rect = (cx, cz, w, l, yaw) => { const a=[Math.cos(yaw),-Math.sin(yaw)], f=[Math.sin(yaw),Math.cos(yaw)]; return { cx, cz, w, l, a, f }; };
  const inside = (r, x, z) => { const dx=x-r.cx, dz=z-r.cz; return Math.abs(dx*r.a[0]+dz*r.a[1]) <= r.w/2 && Math.abs(dx*r.f[0]+dz*r.f[1]) <= r.l/2; };
  const boundary = (r, step) => { const pts=[]; const n1=Math.ceil(r.w/step), n2=Math.ceil(r.l/step);
    for (let i=0;i<=n1;i++) for (const sl of [-1,1]) { const u=-r.w/2+r.w*i/n1, v=sl*r.l/2; pts.push([r.cx+u*r.a[0]+v*r.f[0], r.cz+u*r.a[1]+v*r.f[1]]); }
    for (let i=0;i<=n2;i++) for (const sw of [-1,1]) { const v=-r.l/2+r.l*i/n2, u=sw*r.w/2; pts.push([r.cx+u*r.a[0]+v*r.f[0], r.cz+u*r.a[1]+v*r.f[1]]); }
    return pts; };
  const overlapRef = (A, B) => boundary(A, 0.02).some(p => inside(B, p[0], p[1])) || boundary(B, 0.02).some(p => inside(A, p[0], p[1]));
  let rnd = 12345; const R = () => (rnd = (rnd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const types = { sedan:[1.82,4.5], van:[2.0,5.3], truck:[2.45,8.4], bus:[2.55,11.5], moto:[0.85,2.2] };
  let bad = 0, hitsN = 0, total = 0; const detail = [];
  for (const [t, [w, l]] of Object.entries(types)) for (let i = 0; i < 400; i++) {
    const s = createRun('arcade'); s.d = 100; s.x = 0; s.inv = 0; s.hits = 0; s.speed = 100; s.yaw = (R()-0.5)*0.56;
    const o = car(1, 100 + (R()-0.5)*(l+6), (R()-0.5)*(w+5), 'sedan', 100); o.width = w; o.length = l; o.yaw = (R()-0.5)*0.28;
    s.traffic = [o];
    const A = rect(s.x, s.d, 1.84, 4.3, s.yaw), B = rect(o.x, o.d, w, l, o.yaw);
    const ref = overlapRef(A, B); const got = resolveCollisions(s).hit;
    total++; if (ref) hitsN++; if (ref !== got) { bad++; if (detail.length < 3) detail.push(t+' ref='+ref+' got='+got); }
  }
  check('S8: casco girado = solape independiente (jugador/NPC con giro, 2000 poses, bus y camion incluidos)', bad === 0, `distintos=${bad}/${total} contactos=${hitsN} ${detail.join(';')}`);
}
// S9: directed lane-change manoeuvres of a bus and a truck next to the player, real traffic step.
// Which vehicle touched is recorded by the independent boundary-sampling test and must match the game's contact.
{
  const rectOf = (cx, cz, w, l, yaw) => ({ cx, cz, w, l, a:[Math.cos(yaw),-Math.sin(yaw)], f:[Math.sin(yaw),Math.cos(yaw)] });
  const inR = (r, x, z) => { const dx=x-r.cx, dz=z-r.cz; return Math.abs(dx*r.a[0]+dz*r.a[1]) <= r.w/2 && Math.abs(dx*r.f[0]+dz*r.f[1]) <= r.l/2; };
  const bnd = (r, st) => { const pts=[]; const n1=Math.ceil(r.w/st), n2=Math.ceil(r.l/st);
    for (let i=0;i<=n1;i++) for (const sl of [-1,1]) { const u=-r.w/2+r.w*i/n1, v=sl*r.l/2; pts.push([r.cx+u*r.a[0]+v*r.f[0], r.cz+u*r.a[1]+v*r.f[1]]); }
    for (let i=0;i<=n2;i++) for (const sw of [-1,1]) { const v=-r.l/2+r.l*i/n2, u=sw*r.w/2; pts.push([r.cx+u*r.a[0]+v*r.f[0], r.cz+u*r.a[1]+v*r.f[1]]); }
    return pts; };
  const ovl = (A, B) => bnd(A, 0.04).some(q => inR(B, q[0], q[1])) || bnd(B, 0.04).some(q => inR(A, q[0], q[1]));
  const defs = { bus: [2.55, 11.5, 70], truck: [2.45, 8.4, 75] };
  let trials = 0, contacts = 0, clear = 0, mismatch = 0, wrongCar = 0, maxYaw = 0; const bad = [];
  for (const [type, [w, l, spd]] of Object.entries(defs)) for (const dir of [1, -1]) for (const px of [-1.5, -0.4, 0.4, 1.2, 2.0, 2.8, 3.6]) for (const fz of [-0.5, -0.25, 0, 0.25, 0.5]) {
    const s = createRun('arcade'); s.d = 100; s.x = px; s.inv = 0; s.hits = 0; s.yaw = 0; s.vx = 0; s.speed = spd; s.time = 0;
    const o = car(7, 100 + fz * l, dir > 0 ? -4 : 4, type, spd); o.width = w; o.length = l; o.targetX = dir > 0 ? 0 : 0; o.changeTimer = 2.4; o.state = 'change';
    const decoy = car(8, 100 + 40, 4 * (dir > 0 ? 1 : -1), 'sedan', 100); decoy.width = 1.82; decoy.length = 4.5;
    s.traffic = [o, decoy];
    let refStep = -1, gameStep = -1, refIds = [], gameIds = [];
    for (let i = 0; i < 200 && refStep < 0 && gameStep < 0; i++) {
      stepTraffic(s, 1/60);
      maxYaw = Math.max(maxYaw, Math.abs(o.yaw));
      const P = rectOf(s.x, s.d, 1.84, 4.3, s.yaw);
      const ids = s.traffic.filter(c => c.d > 0 && ovl(P, rectOf(c.x, c.d, c.width, c.length, c.yaw || 0))).map(c => c.id);
      const gids = contactingIds(s);
      const res = resolveCollisions(s);
      if (ids.length) { refStep = i; refIds = ids; }
      if (res.hit || gids.length) { gameStep = i; gameIds = gids; }
    }
    trials++;
    if (refStep >= 0 || gameStep >= 0) contacts++; else clear++;
    // hull edges are exact in game; reference is sampled at 4 cm, so allow a one-step difference at grazing contact
    const sameStep = Math.abs(refStep - gameStep) <= 1 && (refStep >= 0) === (gameStep >= 0);
    const sameCar = JSON.stringify(refIds) === JSON.stringify(gameIds) || (refStep < 0 && gameStep < 0);
    if (!sameStep) { mismatch++; if (bad.length < 3) bad.push(`${type} dir${dir} px${px} fz${fz} ref@${refStep} game@${gameStep}`); }
    else if (!sameCar) wrongCar++;
  }
  check('S9: bus/camion en cambio de carril: contacto del juego = solape independiente, mismo vehiculo', mismatch === 0 && wrongCar === 0 && contacts > 10 && clear > 10, `pruebas=${trials} contacto=${contacts} sin_contacto=${clear} distinto_paso=${mismatch} otro_coche=${wrongCar} yaw_max=${maxYaw.toFixed(3)} ${bad.join(';')}`);
}

process.exit(fails ? 1 : 0);
