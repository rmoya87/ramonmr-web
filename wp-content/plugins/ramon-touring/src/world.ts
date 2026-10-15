import { v, box, car, column, quad, renderer, shade, type Face } from './mesh.js';
import { BIOMES, effectiveNight } from './game/EnvironmentManager.js';
import { cameraPose } from './game/CameraController.js';
import type { QualitySettings } from './game/PerformanceManager.js';
import type { RunState } from './game/types.js';
import type { EnvironmentId, WeatherId } from './game/config.js';
import {
  LOOK,
  depthMist,
  fogToward,
  mixHex,
  paintAtmosphere,
  warmGrade,
  type Atmosphere,
} from './look.js';

export let sectionLabels = ['Servicios', 'Curriculum', 'Portfolio', 'Blog', 'Contacto'];
export function setSectionLabels(labels: string[]): void {
  sectionLabels = labels;
}
export const curve = (d: number) => Math.sin(d / 210) * 30 + Math.sin(d / 620) * 45 + Math.sin(d / 1050) * 35;
export function ramp(t: number): number {
  return 4.6 + Math.max(0, t) * 0.12 + Math.sin(Math.max(0, t) / 180) * 2;
}

function inExitClearance(t: number): boolean {
  return t > -40 && t < 340;
}

function resolveAtmosphere(
  s: RunState,
  opts: { environment: EnvironmentId; weather?: WeatherId },
): Atmosphere {
  const night = effectiveNight(opts.environment) || opts.environment === 'night';
  const beach = opts.environment === 'beach';
  const weather = opts.weather || s.weather || 'clear';
  const biomeA = BIOMES[Math.floor(s.d / 1600) % BIOMES.length];
  const biomeB = BIOMES[Math.floor(s.d / 1600 + 1) % BIOMES.length];
  const blend = s.biomeBlend || 0;
  const groundArr = blend > 0.5 ? biomeB.ground : biomeA.ground;
  const g0 = beach ? LOOK.sand : groundArr[0];

  let sky = biomeA.sky;
  if (night) sky = ['#0a1828', '#1e3044', '#3a4a5a'];
  else if (weather === 'sunset') sky = ['#c07050', '#e8a070', '#f4d0a0'];
  else if (weather === 'cloudy' || weather === 'rain') sky = ['#6a8494', '#a8b8c0', '#d0c8b4'];
  else if (beach) sky = ['#4aa8c8', '#b8e0e8', '#f0d8b0'];

  const hazeHex = (biomeA.haze || '#e8dcc888').slice(0, 7);
  return {
    sky,
    ground: g0,
    groundDeep: night ? '#243038' : shade(g0, 0.72),
    hillFar: night ? shade(groundArr[2] || g0, 0.55) : mixHex(groundArr[2] || g0, hazeHex, 0.35),
    hillMid: night ? shade(groundArr[1] || g0, 0.7) : mixHex(groundArr[1] || g0, hazeHex, 0.18),
    hillNear: night ? shade(g0, 0.85) : g0,
    water: night ? '#2a4852' : biomeA.water,
    haze: biomeA.haze || '#e8dcc888',
    sun: weather === 'sunset' ? '#ffc090' : biomeA.sun || LOOK.sun,
    verge: beach ? LOOK.sand : mixHex(g0, LOOK.vergeWarm, 0.35),
    asphalt: night ? LOOK.asphalt.night : LOOK.asphalt.day,
    asphaltWear: night ? shade(LOOK.asphalt.night, 1.08) : LOOK.asphalt.wear,
    night,
  };
}

/** Soft pine — chunky cones, shared foliage palette */
function softPine(a: Face[], x: number, z: number, size: number, haze: string, mid: number): void {
  const bark = fogToward(LOOK.bark, haze, mid);
  column(a, x, size * 0.28, z, Math.max(0.28, size * 0.07), size * 0.55, bark, 7);
  for (let j = 0; j < 4; j++) {
    const y = size * (0.4 + j * 0.16);
    const r = size * (0.52 - j * 0.09);
    const tip = y + size * 0.32;
    const green = fogToward(LOOK.foliage[j % LOOK.foliage.length], haze, mid);
    for (let k = 0; k < 6; k++) {
      const a0 = (k * Math.PI) / 3;
      const a1 = ((k + 1) * Math.PI) / 3;
      a.push({
        c: green,
        v: [
          v(x + Math.cos(a0) * r, y, z + Math.sin(a0) * r),
          v(x + Math.cos(a1) * r, y, z + Math.sin(a1) * r),
          v(x, tip, z),
        ],
      });
    }
  }
}

/** Soft bush — rounded blobs, no thin sticks */
function softBush(a: Face[], x: number, z: number, size: number, haze: string, mid: number): void {
  column(a, x, size * 0.4, z, size * 0.45, size * 0.72, fogToward(LOOK.foliage[0], haze, mid), 8);
  column(a, x + size * 0.2, size * 0.48, z - size * 0.06, size * 0.34, size * 0.55, fogToward(LOOK.foliage[1], haze, mid), 7);
  column(a, x - size * 0.16, size * 0.42, z + size * 0.08, size * 0.3, size * 0.5, fogToward(LOOK.foliage[2], haze, mid), 7);
}

/** Soft palm — thick trunk + canopy balls (reads as tree, not utility pole) */
function softPalm(a: Face[], x: number, z: number, haze: string, mid: number): void {
  column(a, x, 2.6, z, 0.32, 5.2, fogToward(LOOK.wood, haze, mid), 8);
  const canopy = fogToward(LOOK.foliage[1], haze, mid);
  column(a, x, 5.4, z, 1.15, 1.1, canopy, 8);
  column(a, x + 0.55, 5.15, z + 0.2, 0.7, 0.75, fogToward(LOOK.foliage[0], haze, mid), 7);
  column(a, x - 0.5, 5.2, z - 0.15, 0.65, 0.7, fogToward(LOOK.foliage[2], haze, mid), 7);
}

function softRock(a: Face[], x: number, z: number, haze: string, mid: number): void {
  column(a, x, 0.55, z, 0.72, 1.1, fogToward(LOOK.rock, haze, mid), 7);
  column(a, x + 0.55, 0.32, z + 0.1, 0.4, 0.64, fogToward(LOOK.rockDark, haze, mid), 6);
}

function softBuilding(a: Face[], x: number, z: number, h: number, w: number, haze: string, mid: number): void {
  const facade = fogToward(h > 5 ? shade(LOOK.building, 0.92) : LOOK.building, haze, mid);
  box(a, x, h / 2, z, w, h, w * 0.7, facade);
  box(a, x, h + 0.1, z, w * 0.94, 0.18, w * 0.68, fogToward(LOOK.buildingRoof, haze, mid));
  for (let row = 0; row < Math.min(3, Math.floor(h / 1.4)); row++) {
    for (const sx of [-1, 1]) {
      box(a, x + sx * w * 0.22, 1.1 + row * 1.35, z + w * 0.34, 0.32, 0.4, 0.04, row % 2 ? LOOK.glass.sky : '#f0e4b8');
    }
  }
}

export type DrawOpts = {
  color: string;
  camera: number;
  brake: boolean;
  lights: boolean;
  environment: EnvironmentId;
  weather?: WeatherId;
  quality?: QualitySettings;
  reduceEffects?: boolean;
};

export function drawRoad(c: CanvasRenderingContext2D, s: RunState, w: number, h: number, opts: DrawOpts): void {
  c.clearRect(0, 0, w, h);
  const weather = opts.weather || s.weather || 'clear';
  const quality = opts.quality || {
    drawDistance: 320,
    propStep: 28,
    shadows: true,
    particles: true,
    resolutionScale: 1,
    maxTrafficDraw: 12,
  };
  const beach = opts.environment === 'beach';
  const atm = resolveAtmosphere(s, opts);
  const hazeSolid = atm.haze.slice(0, 7);

  paintAtmosphere(c, w, h, atm, s.d, {
    reduceEffects: opts.reduceEffects,
    cloudy: weather === 'cloudy' || weather === 'rain',
  });

  const base = curve(s.d);
  const path = s.branch ? ramp(s.d - s.fork) : 0;
  const px = s.x + path;
  const pose = cameraPose(s, path, opts.camera, w / h < 1);
  const cam = renderer(c, w, h, {
    pos: v(pose.pos.x, pose.pos.y, pose.pos.z),
    target: v(pose.target.x, pose.target.y, pose.target.z),
    fov: w * pose.fovMul,
  });
  const a: Face[] = [];
  const objects: Face[] = [];
  const cx = (z: number) => curve(s.d + z) - base;
  const strip = 3;
  const far = Math.floor((s.d + quality.drawDistance) / strip) * strip;
  const showWater = beach || opts.environment === 'coast' || Math.floor(s.d / 1600) % BIOMES.length === 0;

  for (let world = far; world >= s.d - 6; world -= strip) {
    const z = world - s.d;
    const z2 = z + strip;
    if (z2 < -7.2) continue;
    const zNear = Math.max(z, -7.0);
    const x = cx(zNear);
    const x2 = cx(z2);
    const t = world - s.fork;
    const exitZone = inExitClearance(t);
    const mid = (zNear + z2) * 0.5;
    const skirt = mid < 8 ? Math.min(60, 32 + (mid + 8) * 2.4) : Math.min(140, 56 + mid * 0.4);

    const gNear = fogToward(atm.ground, hazeSolid, mid);
    const gOuter = fogToward(shade(atm.ground, atm.night ? 0.78 : 0.88), hazeSolid, mid);
    quad(a, x, zNear, x2, z2, skirt, gNear, -0.1);
    if (mid > 6) {
      quad(a, x - skirt * 0.48, zNear, x2 - skirt * 0.48, z2, skirt * 0.38, gOuter, -0.11);
      quad(a, x + skirt * 0.48, zNear, x2 + skirt * 0.48, z2, skirt * 0.38, gOuter, -0.11);
    }
    if (showWater && mid > 60) {
      const waterC = fogToward(atm.water, hazeSolid, mid);
      quad(a, x - skirt * 0.74, zNear, x2 - skirt * 0.74, z2, skirt * 0.14, waterC, -0.06);
      quad(a, x - skirt * 0.64, zNear, x2 - skirt * 0.64, z2, skirt * 0.07, shade(waterC, 1.1), -0.055);
    }

    const asphalt = fogToward(atm.asphalt, hazeSolid, mid, 80, 280);
    quad(a, x, zNear, x2, z2, 12.8, asphalt);
    if (mid > -1) quad(a, x, zNear, x2, z2, 3.2, fogToward(atm.asphaltWear, hazeSolid, mid, 80, 280), 0.012);

    const verge = fogToward(atm.verge, hazeSolid, mid);
    for (const side of [-1, 1]) {
      if (side > 0 && exitZone) continue;
      quad(a, x + side * 6.55, zNear, x2 + side * 6.55, z2, 0.9, verge);
      quad(a, x + side * 5.95, zNear, x2 + side * 5.95, z2, 0.2, LOOK.chalk, 0.018);
    }
    if (mid > -2 && ((world % 18) + 18) % 18 < 9) {
      for (const l of [-2, 2]) quad(a, x + l, zNear, x2 + l, z2, 0.14, LOOK.chalk, 0.024);
    }
    const t2 = t + strip;
    if (t2 > 0 && t < 310) {
      const rx = x + ramp(Math.max(0, t));
      const rx2 = x2 + ramp(Math.max(0, t2));
      quad(a, rx, zNear, rx2, z2, 4.2, fogToward(LOOK.asphalt.ramp, hazeSolid, mid), 0.023);
      quad(a, rx - 1.9, zNear, rx2 - 1.9, z2, 0.14, LOOK.chalk, 0.028);
      quad(a, rx + 1.9, zNear, rx2 + 1.9, z2, 0.14, LOOK.chalk, 0.028);
    }

    // Rare soft overpass — chunky pillars only
    const event = Math.floor(world / 1100) % 8;
    if (event === 5 && !exitZone && mid > 20 && mid < 120) {
      box(objects, x, 3.6, zNear, 14, 0.45, 7, fogToward('#6a7278', hazeSolid, mid));
      column(objects, x - 5.5, 1.9, zNear, 0.38, 3.8, fogToward('#5a6268', hazeSolid, mid), 7);
      column(objects, x + 5.5, 1.9, zNear, 0.38, 3.8, fogToward('#5a6268', hazeSolid, mid), 7);
    }

    cam.draw(a, true);
    a.length = 0;
  }

  for (const offset of [-150, -100, -50, 10]) {
    const z = s.fork + offset - s.d;
    if (z > 8 && z < 240) {
      const x = cx(z) + 4;
      objects.push({
        c: mixHex(LOOK.chalk, '#e8c878', 0.35),
        v: [
          v(x - 0.35, 0.04, z),
          v(x + 0.35, 0.04, z),
          v(x + 0.35, 0.04, z + 5),
          v(x + 1.05, 0.04, z + 5),
          v(x, 0.04, z + 8),
          v(x - 1.05, 0.04, z + 5),
          v(x - 0.35, 0.04, z + 5),
        ],
      });
    }
  }

  const step = Math.max(24, quality.propStep);
  for (let n = Math.floor((s.d - 4) / step); n * step < s.d + quality.drawDistance - 10; n++) {
    const world = n * step;
    const z = world - s.d;
    if (z < 4) continue;
    const x = cx(z);
    const t = world - s.fork;
    const right = Math.max(13 + ((n % 4 + 4) % 4) * 2.5, t > -20 && t < 330 ? ramp(Math.max(0, t)) + 6 : 0);
    const biomeId = Math.floor(world / 1600) % BIOMES.length;
    const mid = z;

    if (beach || opts.environment === 'coast') {
      softRock(objects, x + right, z, hazeSolid, mid);
      softBush(objects, x + right + 2.4, z, 1.15 + (n % 2) * 0.25, hazeSolid, mid);
      if (n % 3 === 0 && z > 18) softPalm(objects, x - 11.2, z, hazeSolid, mid);
    } else if (biomeId === 2) {
      softBuilding(objects, x + right, z, 4.2 + (n % 4), 2.5 + (n % 3) * 0.4, hazeSolid, mid);
    } else if (biomeId === 3) {
      softRock(objects, x + right, z, hazeSolid, mid);
      if (n % 2 === 0) softRock(objects, x + right + 2.2, z + 1, hazeSolid, mid);
    } else if (biomeId === 4) {
      softPine(objects, x + right, z, 3.0 + (n % 3) * 0.4, hazeSolid, mid);
      column(objects, x + right + 2.0, 0.14, z, 0.9, 0.24, fogToward('#eef4f8', hazeSolid, mid), 8);
    } else {
      softPine(objects, x + right, z, 4.6 + ((n % 3 + 3) % 3) * 0.35, hazeSolid, mid);
      if (n % 3 === 0) softPine(objects, x - 12, z, 4.2, hazeSolid, mid);
      if (n % 3 === 0) softBush(objects, x + right - 2.8, z + 1.5, 1.15, hazeSolid, mid);
    }
  }

  // Chunky bollards — same chalk language as lane paint
  for (let n = Math.floor((s.d - 32) / 36); n * 36 < s.d + quality.drawDistance - 24; n++) {
    const world = n * 36;
    const z = world - s.d;
    if (z < 12 || z > 160) continue;
    const x = cx(z);
    const t = world - s.fork;
    const exitZone = inExitClearance(t);
    for (const side of [-1, 1] as const) {
      if (side > 0 && exitZone) continue;
      column(objects, x + side * 6.85, 0.32, z, 0.14, 0.58, fogToward(LOOK.chalk, hazeSolid, z), 7);
      column(objects, x + side * 6.85, 0.64, z, 0.16, 0.14, side < 0 ? LOOK.chalk : '#c24a38', 6);
    }
  }

  let drawn = 0;
  for (const tr of s.traffic) {
    const z = tr.d - s.d;
    if (z > -10 && z < quality.drawDistance * 0.5 && drawn < quality.maxTrafficDraw) {
      car(objects, cx(z) + tr.x, z, tr.color, {
        angle: Math.atan2(cx(z + 3) - cx(z - 3), 6),
        lights: atm.night,
        spin: (s.time * 85) / 3.6 / 0.44,
      });
      drawn++;
    }
  }

  for (const dist of [300, 100]) {
    const signZ = s.fork - s.d - dist;
    if (signZ > -10 && signZ < quality.drawDistance) {
      const x = cx(signZ) + 7.2;
      column(objects, x, 2.7, signZ, 0.16, 5.4, fogToward(LOOK.sign.post, hazeSolid, signZ), 7);
      box(objects, x - 3.0, 5.2, signZ, 8.2, dist === 100 ? 2.6 : 2.2, 0.16, fogToward(LOOK.sign.face, hazeSolid, signZ));
    }
  }

  // Player car — contact shadow is screen-space only (avoids triangular mesh artifact)
  car(objects, px, 0.02, opts.color, {
    angle: s.yaw || 0,
    roll: -s.vx * 0.007 + (curve(s.d + 12) - 2 * curve(s.d) + curve(s.d - 12)) * 0.008,
    spin: s.d / 0.44,
    brake: opts.brake,
    lights: opts.lights || atm.night,
    steer: s.steer * 0.35,
  });

  cam.draw(a);
  cam.draw(objects);

  // Soft rear glass — same LOOK.glass language
  {
    const gA = cam.project(v(px - 0.58, 1.38, -0.55));
    const gB = cam.project(v(px + 0.58, 1.38, -0.55));
    const gC = cam.project(v(px + 0.66, 1.02, -1.28));
    const gD = cam.project(v(px - 0.66, 1.02, -1.28));
    if (gA.z > 0.35 && gB.z > 0.35 && gC.z > 0.35 && gD.z > 0.35) {
      c.save();
      c.beginPath();
      c.moveTo(gA.x, gA.y);
      c.lineTo(gB.x, gB.y);
      c.lineTo(gC.x, gC.y);
      c.lineTo(gD.x, gD.y);
      c.closePath();
      const glassGrad = c.createLinearGradient(gA.x, gA.y, gD.x, gC.y);
      glassGrad.addColorStop(0, atm.night ? LOOK.glass.tint + '99' : LOOK.glass.sky + 'aa');
      glassGrad.addColorStop(0.4, atm.night ? '#88a8c0aa' : LOOK.glass.hi + 'cc');
      glassGrad.addColorStop(1, LOOK.glass.tint + 'aa');
      c.fillStyle = glassGrad;
      c.fill();
      c.restore();
    }
  }

  if (quality.shadows) {
    const shadow = cam.project(v(px, 0.05, 0));
    if (shadow.z > 0.4) {
      c.fillStyle = LOOK.shadow;
      c.beginPath();
      c.ellipse(shadow.x, shadow.y + h * 0.008, w * 0.075, h * 0.014, 0, 0, Math.PI * 2);
      c.fill();
    }
  }

  const signZ = s.fork - s.d - 100;
  if (signZ > 5 && signZ < 280) {
    const x = cx(signZ) + 4.1;
    const half = 4.1;
    const y = 5.2;
    const corners = [
      v(x - half, y + 1.1, signZ - 0.09),
      v(x + half, y + 1.1, signZ - 0.09),
      v(x + half, y - 1.1, signZ - 0.09),
      v(x - half, y - 1.1, signZ - 0.09),
    ].map(cam.project);
    if (corners.every((p) => p.z > 0.2)) {
      const tex = document.createElement('canvas');
      tex.width = 640;
      tex.height = 180;
      const tc = tex.getContext('2d')!;
      tc.fillStyle = LOOK.sign.face;
      tc.fillRect(0, 0, 640, 180);
      tc.strokeStyle = LOOK.sign.ink;
      tc.lineWidth = 6;
      tc.strokeRect(10, 10, 620, 160);
      tc.fillStyle = LOOK.sign.ink;
      tc.textAlign = 'center';
      tc.textBaseline = 'middle';
      const meters = Math.max(0, Math.round(s.fork - s.d));
      const name = (sectionLabels[s.exit] || '').trim();
      let nameFont = 48;
      tc.font = `700 ${nameFont}px sans-serif`;
      while (tc.measureText(name).width > 560 && nameFont > 22) {
        nameFont--;
        tc.font = `700 ${nameFont}px sans-serif`;
      }
      tc.fillText(name, 320, 68);
      tc.font = '600 36px sans-serif';
      tc.fillText(`↗  ${meters} m`, 320, 128);
      const tris = [
        [0, 1, 2],
        [0, 2, 3],
      ];
      const uv = [
        [0, 0],
        [640, 0],
        [640, 180],
        [0, 180],
      ];
      for (const tri of tris) {
        const [A, B, C] = tri.map((i) => corners[i]);
        const [u0, vv, q] = tri.map((i) => uv[i]);
        const det = (vv[0] - u0[0]) * (q[1] - u0[1]) - (q[0] - u0[0]) * (vv[1] - u0[1]);
        const aa = ((B.x - A.x) * (q[1] - u0[1]) - (C.x - A.x) * (vv[1] - u0[1])) / det;
        const bb = ((B.y - A.y) * (q[1] - u0[1]) - (C.y - A.y) * (vv[1] - u0[1])) / det;
        const cc = ((C.x - A.x) * (vv[0] - u0[0]) - (B.x - A.x) * (q[0] - u0[0])) / det;
        const dd = ((C.y - A.y) * (vv[0] - u0[0]) - (B.y - A.y) * (q[0] - u0[0])) / det;
        c.save();
        c.beginPath();
        c.moveTo(A.x, A.y);
        c.lineTo(B.x, B.y);
        c.lineTo(C.x, C.y);
        c.closePath();
        c.clip();
        c.setTransform(aa, bb, cc, dd, A.x - aa * u0[0] - cc * u0[1], A.y - bb * u0[0] - dd * u0[1]);
        c.drawImage(tex, 0, 0);
        c.restore();
      }
    }
  }

  if (atm.night) {
    c.fillStyle = '#07102044';
    c.fillRect(0, 0, w, h);
    const glow = c.createRadialGradient(w * 0.5, h * 0.72, 8, w * 0.5, h * 0.62, w * 0.45);
    glow.addColorStop(0, '#fff2bc18');
    glow.addColorStop(1, '#fff2bc00');
    c.fillStyle = glow;
    c.beginPath();
    c.moveTo(w * 0.38, h * 0.72);
    c.lineTo(w * 0.22, h * 0.5);
    c.lineTo(w * 0.78, h * 0.5);
    c.lineTo(w * 0.62, h * 0.72);
    c.fill();
  }

  if (weather === 'rain' && quality.particles && !opts.reduceEffects) {
    c.strokeStyle = '#c8d4dc55';
    c.lineWidth = 1;
    for (let i = 0; i < 36; i++) {
      const rx = (i * 97 + s.d * 3) % w;
      const ry = (i * 53 + s.time * 400) % h;
      c.beginPath();
      c.moveTo(rx, ry);
      c.lineTo(rx + 2, ry + 10);
      c.stroke();
    }
  }
  if (weather === 'fog') {
    c.fillStyle = atm.haze.slice(0, 7) + '55';
    c.fillRect(0, 0, w, h);
  }

  if (s.slip > 0.2 && quality.particles) {
    const p = cam.project(v(px, 0.25, -1.7));
    c.fillStyle = '#ccd5d04a';
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.ellipse(p.x + (i - 1.5) * w * 0.015, p.y + i * h * 0.007, w * 0.014, h * 0.01, 0, 0, Math.PI * 2);
      c.fill();
    }
  }

  depthMist(c, w, h, atm);
  warmGrade(c, w, h, atm.night);
}

export function drawGarage(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  angle: number,
  zoom: number,
  color: string,
  hood: number,
  lights: boolean,
  _focus: number,
): { x: number; y: number; visible: boolean; index: number }[] {
  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#243848');
  bg.addColorStop(0.55, '#1a2834');
  bg.addColorStop(1, '#121c24');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);
  const a: Face[] = [];
  const objects: Face[] = [];
  const cam = renderer(
    c,
    w,
    h,
    { pos: v(Math.sin(angle) * zoom, 3.4, Math.cos(angle) * zoom), target: v(0, w / h < 1 ? 1.9 : 0.8, 0), fov: w * (w / h < 1 ? 0.95 : 0.65) },
    true,
  );
  for (let x = -10; x < 10; x += 2) {
    for (let z = -10; z < 10; z += 2) {
      quad(a, x + 1, z, x + 1, z + 2, 1.97, (x + z) % 4 === 0 ? '#5c666c' : '#525c62', -0.04);
    }
  }
  box(objects, 0, 2.8, 16, 32, 5.6, 0.2, '#333f48');
  box(objects, -16, 2.8, 0, 0.2, 5.6, 32, '#3f4d55');
  box(objects, 16, 2.8, 0, 0.2, 5.6, 32, '#3f4d55');
  for (const x of [-8, -4, 4, 8]) {
    box(objects, x, 2.7, 15.8, 0.2, 5.4, 0.3, '#869493');
    box(objects, x, 5.5, 0, 0.2, 0.15, 24, '#7c8988');
  }
  box(objects, 0, 0.12, 0, 3.6, 0.22, 6.7, '#242e35');
  for (const x of [-1.6, 1.6]) box(objects, x, 0.25, 0, 0.12, 0.12, 6.8, '#d5b774');
  car(objects, 0, 0, color, { hood, lights });
  cam.draw(a);
  cam.draw(objects);
  if (lights) {
    const p = cam.project(v(0, 0.7, 2.2));
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, w * 0.16);
    g.addColorStop(0, '#fff1bd40');
    g.addColorStop(1, '#fff1bd00');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }
  warmGrade(c, w, h, false);
  const spots = [v(-0.8, 1.4, -1), v(0.8, 1.4, 0), v(0, 1.4, 1.5)];
  return spots.map((p, i) => {
    const q = cam.project(p);
    return { x: (q.x / w) * 100, y: (q.y / h) * 100, visible: q.z > 0, index: i };
  });
}
