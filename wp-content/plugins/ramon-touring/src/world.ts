import { v, box, car, column, quad, renderer, shade, type Face } from './mesh.js';
import { BIOMES, effectiveNight } from './game/EnvironmentManager.js';
import { cameraPose } from './game/CameraController.js';
import type { QualitySettings } from './game/PerformanceManager.js';
import type { RunState } from './game/types.js';
import type { EnvironmentId, WeatherId } from './game/config.js';

export let sectionLabels = ['Servicios', 'Curriculum', 'Portfolio', 'Blog', 'Contacto'];
export function setSectionLabels(labels: string[]): void {
  sectionLabels = labels;
}
export const curve = (d: number) => Math.sin(d / 210) * 30 + Math.sin(d / 620) * 45 + Math.sin(d / 1050) * 35;
export function ramp(t: number): number {
  return 4.6 + Math.max(0, t) * 0.12 + Math.sin(Math.max(0, t) / 180) * 2;
}

/** True while the exit ramp occupies the right verge (posts must stay clear). */
function inExitClearance(t: number): boolean {
  return t > -40 && t < 340;
}

function pine(a: Face[], x: number, z: number, size: number): void {
  column(a, x, size * 0.3, z, Math.max(0.2, size * 0.055), size * 0.6, '#6e5844', 7);
  for (let j = 0; j < 5; j++) {
    const y = size * (0.36 + j * 0.15);
    const r = size * (0.58 - j * 0.085);
    const tip = y + size * 0.38;
    const greens = ['#2a5040', '#345c48', '#3f6a52', '#2e5642'];
    for (let k = 0; k < 8; k++) {
      const a0 = (k * Math.PI) / 4;
      const a1 = ((k + 1) * Math.PI) / 4;
      a.push({
        c: greens[(j + k) % greens.length],
        v: [
          v(x + Math.cos(a0) * r, y, z + Math.sin(a0) * r),
          v(x + Math.cos(a1) * r, y, z + Math.sin(a1) * r),
          v(x, tip, z),
        ],
      });
    }
  }
}

function bush(a: Face[], x: number, z: number, size: number): void {
  column(a, x, size * 0.38, z, size * 0.42, size * 0.7, '#3a6048', 8);
  column(a, x + size * 0.22, size * 0.48, z - size * 0.08, size * 0.32, size * 0.55, '#4a7058', 7);
  column(a, x - size * 0.18, size * 0.42, z + size * 0.1, size * 0.28, size * 0.48, '#355848', 7);
}

function building(a: Face[], x: number, z: number, h: number, w: number): void {
  const facade = h > 5 ? '#7a7880' : '#8a8274';
  box(a, x, h / 2, z, w, h, w * 0.72, facade);
  // Soft roof cap
  box(a, x, h + 0.08, z, w * 0.96, 0.16, w * 0.7, '#5a585e');
  column(a, x, h + 0.22, z, w * 0.38, 0.18, '#68666c', 6);
  for (let row = 0; row < Math.min(4, Math.floor(h / 1.2)); row++) {
    for (const sx of [-1, 1]) {
      box(a, x + sx * w * 0.2, 1.0 + row * 1.2, z + w * 0.36, 0.28, 0.38, 0.03, row % 2 ? '#d8e4ec' : '#f0e8c0');
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
  const night = effectiveNight(opts.environment) || opts.environment === 'night';
  const beach = opts.environment === 'beach';
  const weather = opts.weather || s.weather || 'clear';
  const quality = opts.quality || {
    drawDistance: 320,
    propStep: 28,
    shadows: true,
    particles: true,
    resolutionScale: 1,
    maxTrafficDraw: 12,
  };

  const biomeA = BIOMES[Math.floor(s.d / 1600) % BIOMES.length];
  const biomeB = BIOMES[Math.floor(s.d / 1600 + 1) % BIOMES.length];
  const blend = s.biomeBlend || 0;
  const ground = blend > 0.5 ? biomeB.ground : biomeA.ground;
  const skyColors = night
    ? (['#091626', '#26364b', '#44516a'] as [string, string, string])
    : weather === 'sunset'
      ? (['#c07050', '#e8a878', '#f0c8a0'] as [string, string, string])
      : weather === 'cloudy' || weather === 'rain'
        ? (['#6a7a88', '#9aa8b0', '#b8c0c4'] as [string, string, string])
        : beach
          ? (['#61b6d4', '#bfe9ed', '#e9d8b6'] as [string, string, string])
          : biomeA.sky;

  const sky = c.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, skyColors[0]);
  sky.addColorStop(0.55, skyColors[1]);
  sky.addColorStop(1, skyColors[2]);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);

  // Soft sun glow
  if (!night) {
    const sunX = w * 0.76;
    const sunY = h * 0.16;
    const glow = c.createRadialGradient(sunX, sunY, 2, sunX, sunY, h * 0.14);
    glow.addColorStop(0, weather === 'sunset' ? '#ffc080aa' : '#fff2c0aa');
    glow.addColorStop(1, '#fff2c000');
    c.fillStyle = glow;
    c.fillRect(sunX - h * 0.16, sunY - h * 0.16, h * 0.32, h * 0.32);
    c.fillStyle = weather === 'sunset' ? '#ffc090' : biomeA.sun;
    c.beginPath();
    c.arc(sunX, sunY, h * 0.028, 0, Math.PI * 2);
    c.fill();
  } else {
    c.fillStyle = '#e8eef8';
    c.beginPath();
    c.arc(w * 0.74, h * 0.18, h * 0.022, 0, Math.PI * 2);
    c.fill();
  }

  if (!night && !opts.reduceEffects && weather !== 'rain') {
    c.fillStyle = weather === 'cloudy' ? '#d0d8e099' : '#ffffff44';
    for (let i = 0; i < 6; i++) {
      const cloudX = ((i * 151 + s.d * 0.06) % (w + 160)) - 80;
      const cloudY = h * (0.1 + (i % 3) * 0.045);
      c.beginPath();
      c.ellipse(cloudX, cloudY, w * 0.09, h * 0.016, 0, 0, Math.PI * 2);
      c.ellipse(cloudX + w * 0.045, cloudY - h * 0.006, w * 0.055, h * 0.013, 0, 0, Math.PI * 2);
      c.ellipse(cloudX - w * 0.03, cloudY + h * 0.004, w * 0.04, h * 0.01, 0, 0, Math.PI * 2);
      c.fill();
    }
  }

  // Full-bleed ground first so laterals never open to void / unfinished edges.
  const g0 = beach ? '#d4c294' : ground[0];
  const gDeep = night ? '#2a3238' : shade(g0, 0.78);
  const horizonY = h * 0.5;
  const groundWash = c.createLinearGradient(0, horizonY - h * 0.08, 0, h);
  groundWash.addColorStop(0, shade(g0, night ? 0.88 : 1.05));
  groundWash.addColorStop(0.35, shade(g0, night ? 0.8 : 0.95));
  groundWash.addColorStop(0.75, shade(g0, night ? 0.72 : 0.86));
  groundWash.addColorStop(1, gDeep);
  c.fillStyle = groundWash;
  c.fillRect(0, horizonY - h * 0.08, w, h - horizonY + h * 0.08);

  // Continuous hillside ribbons that spill past both edges (no hard lateral cut).
  const hillCols = [
    shade(ground[2] || ground[0], night ? 0.75 : 0.92),
    shade(ground[1] || ground[0], night ? 0.82 : 0.98),
    shade(ground[0], night ? 0.9 : 1.04),
    shade(g0, night ? 0.85 : 0.96),
  ];
  for (let k = 0; k < 4; k++) {
    c.beginPath();
    const pad = w * 0.18;
    const foot = h * (0.54 + k * 0.028);
    c.moveTo(-pad, foot);
    for (let i = 0; i <= 80; i++) {
      const nx = i / 80;
      const x = -pad + nx * (w + pad * 2);
      const roll =
        Math.sin(nx * 4.2 + k * 1.7 + s.d * 0.0018) * h * 0.036 +
        Math.sin(nx * 1.7 + k * 0.9) * h * 0.05 +
        Math.sin(nx * 9.5 + k * 0.4 + s.d * 0.0007) * h * 0.014;
      c.lineTo(x, h * (0.34 + k * 0.028) - roll);
    }
    c.lineTo(w + pad, foot);
    c.lineTo(-pad, foot);
    c.closePath();
    c.fillStyle = hillCols[k];
    c.globalAlpha = 0.88 + k * 0.03;
    c.fill();
  }
  c.globalAlpha = 1;

  // Horizon haze softens the hill/sky seam into one continuous landscape
  const haze = c.createLinearGradient(0, h * 0.28, 0, h * 0.54);
  haze.addColorStop(0, '#ffffff00');
  haze.addColorStop(0.45, biomeA.haze || '#d0dce099');
  haze.addColorStop(1, shade(g0, night ? 0.9 : 1) + '00');
  c.fillStyle = haze;
  c.fillRect(0, h * 0.28, w, h * 0.26);

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
  // Shorter strips = smoother curves; extend under the car (cam ~ -9.4) without going behind it.
  const strip = 3;
  const far = Math.floor((s.d + quality.drawDistance) / strip) * strip;
  const asphalt = night ? '#3c444c' : '#575f65';
  const verge = beach ? '#c8b888' : '#6a7a58';

  for (let world = far; world >= s.d - 6; world -= strip) {
    const z = world - s.d;
    const z2 = z + strip;
    // Stay clearly ahead of the camera near-plane.
    if (z2 < -7.2) continue;
    const zNear = Math.max(z, -7.0);
    const x = cx(zNear);
    const x2 = cx(z2);
    const t = world - s.fork;
    const exitZone = inExitClearance(t);
    const mid = (zNear + z2) * 0.5;
    // Wide terrain skirts so left/right never look cut off; keep near strips safer.
    const skirt = mid < 8 ? Math.min(60, 32 + (mid + 8) * 2.4) : Math.min(140, 56 + mid * 0.4);
    quad(a, x, zNear, x2, z2, skirt, g0, -0.1);
    // Outer fade bands (slightly darker) to seal screen edges
    if (mid > 6) {
      quad(a, x - skirt * 0.48, zNear, x2 - skirt * 0.48, z2, skirt * 0.38, shade(g0, night ? 0.68 : 0.84), -0.11);
      quad(a, x + skirt * 0.48, zNear, x2 + skirt * 0.48, z2, skirt * 0.38, shade(g0, night ? 0.68 : 0.84), -0.11);
    }
    // Water far left only — never under roadside props (palms / lamps)
    if (mid > 55 && (beach || opts.environment === 'coast' || biomeA.water)) {
      const waterC = night ? '#2a4852' : biomeA.water || '#4a8aa0';
      quad(a, x - skirt * 0.72, zNear, x2 - skirt * 0.72, z2, skirt * 0.16, waterC, -0.06);
      quad(a, x - skirt * 0.62, zNear, x2 - skirt * 0.62, z2, skirt * 0.08, shade(waterC, 1.12), -0.055);
    }
    quad(a, x, zNear, x2, z2, 12.8, asphalt);
    // Soft centre lane wear so asphalt feels continuous, not a flat slab
    if (mid > -1) quad(a, x, zNear, x2, z2, 3.2, shade(asphalt, night ? 0.92 : 1.06), 0.012);
    for (const side of [-1, 1]) {
      if (side > 0 && exitZone) continue;
      quad(a, x + side * 6.55, zNear, x2 + side * 6.55, z2, 0.85, verge);
      quad(a, x + side * 5.95, zNear, x2 + side * 5.95, z2, 0.2, '#ebe4cc', 0.018);
    }
    // Lane dashes — denser near, skip when almost under the camera
    if (mid > -2 && ((world % 18) + 18) % 18 < 9) {
      for (const l of [-2, 2]) quad(a, x + l, zNear, x2 + l, z2, 0.14, '#f4f0dc', 0.024);
    }
    const t2 = t + strip;
    if (t2 > 0 && t < 310) {
      const rx = x + ramp(Math.max(0, t));
      const rx2 = x2 + ramp(Math.max(0, t2));
      quad(a, rx, zNear, rx2, z2, 4.2, '#53595a', 0.023);
      quad(a, rx - 1.9, zNear, rx2 - 1.9, z2, 0.14, '#eee5ca', 0.028);
      quad(a, rx + 1.9, zNear, rx2 + 1.9, z2, 0.14, '#eee5ca', 0.028);
    }

    const event = Math.floor(world / 900) % 7;
    if (event === 3 && t < -40 && mid > 8) {
      box(objects, x, 4, zNear, 16, 8, 6, night ? '#1a2228' : '#3a454c');
    }
    if (event === 5 && !exitZone && mid > 8) {
      box(objects, x, 3.5, zNear, 14, 0.4, 8, '#6a7278');
      column(objects, x - 6, 2, zNear, 0.22, 4, '#5a6268', 6);
      column(objects, x + 6, 2, zNear, 0.22, 4, '#5a6268', 6);
    }

    cam.draw(a, true);
    a.length = 0;
  }

  for (const offset of [-150, -100, -50, 10]) {
    const z = s.fork + offset - s.d;
    if (z > 8 && z < 240) {
      const x = cx(z) + 4;
      objects.push({
        c: '#eedaa1',
        v: [v(x - 0.35, 0.04, z), v(x + 0.35, 0.04, z), v(x + 0.35, 0.04, z + 5), v(x + 1.05, 0.04, z + 5), v(x, 0.04, z + 8), v(x - 1.05, 0.04, z + 5), v(x - 0.35, 0.04, z + 5)],
      });
    }
  }

  const step = quality.propStep;
  for (let n = Math.floor((s.d - 4) / step); n * step < s.d + quality.drawDistance - 10; n++) {
    const world = n * step;
    const z = world - s.d;
    if (z < -2) continue;
    const x = cx(z);
    const t = world - s.fork;
    const right = Math.max(14 + ((n % 4 + 4) % 4) * 3, t > -20 && t < 330 ? ramp(Math.max(0, t)) + 6 : 0);
    const biomeId = Math.floor(world / 1600) % BIOMES.length;
    if (beach || opts.environment === 'coast') {
      column(objects, x + right, 0.28, z, 0.55, 0.55, '#d2be8e', 7);
      bush(objects, x + right + 2.2, z, 1.1 + (n % 2) * 0.3);
      // Palms on the left verge — inland of the far-left water band
      if (n % 2 === 0 && z > 14) {
        const pxPalm = x - 11.5;
        column(objects, pxPalm, 3.0, z, 0.18, 6.0, '#6e5638', 7);
        for (let j = 0; j < 6; j++) {
          const ang = (j * Math.PI) / 3;
          column(
            objects,
            pxPalm + Math.cos(ang) * 1.45,
            5.9,
            z + Math.sin(ang) * 1.45,
            0.26,
            0.14,
            '#3f7450',
            5,
          );
        }
      }
    } else if (biomeId === 2) {
      building(objects, x + right, z, 4.5 + (n % 5), 2.6 + (n % 3) * 0.45);
      if (n % 5 === 0 && z > 18) {
        column(objects, x - 10.5, 2.2, z, 0.14, 4.4, '#7a8890', 6);
        column(objects, x - 10.5, 4.45, z, 0.34, 0.2, '#c8d0d4', 6);
      }
    } else if (biomeId === 3) {
      column(objects, x + right, 0.65, z, 0.7, 1.3, '#c4a060', 7);
      column(objects, x + right + 2.5, 0.35, z, 0.42, 0.7, '#b89254', 6);
    } else if (biomeId === 4) {
      pine(objects, x + right, z, 3.2 + (n % 3));
      column(objects, x + right + 2.2, 0.16, z, 0.95, 0.28, '#eef4f8', 8);
    } else {
      pine(objects, x + right, z, 5.2 + ((n % 3 + 3) % 3));
      if (n % 3 === 0) pine(objects, x - 12.5, z, 4.6);
      if (n % 3 === 0) bush(objects, x + right - 3, z + 2, 1.2);
    }
  }

  // Wider-spaced verge markers — never on the right during exit clearance
  for (let n = Math.floor((s.d - 28) / 28); n * 28 < s.d + quality.drawDistance - 20; n++) {
    const world = n * 28;
    const z = world - s.d;
    if (z < 10 || z > 180) continue;
    const x = cx(z);
    const t = world - s.fork;
    const exitZone = inExitClearance(t);
    for (const side of [-1, 1] as const) {
      if (side > 0 && exitZone) continue;
      column(objects, x + side * 6.9, 0.38, z, 0.09, 0.72, '#d8d2bc', 6);
      column(objects, x + side * 6.9, 0.74, z, 0.12, 0.16, side < 0 ? '#ebe6d0' : '#c24a38', 6);
    }
  }

  let drawn = 0;
  for (const t of s.traffic) {
    const z = t.d - s.d;
    if (z > -10 && z < quality.drawDistance * 0.5 && drawn < quality.maxTrafficDraw) {
      car(objects, cx(z) + t.x, z, t.color, {
        angle: Math.atan2(cx(z + 3) - cx(z - 3), 6),
        lights: night,
        spin: (s.time * 85) / 3.6 / 0.44,
      });
      drawn++;
    }
  }

  // Anticipation signs at 300m and 100m (rounded posts)
  for (const dist of [300, 100]) {
    const signZ = s.fork - s.d - dist;
    if (signZ > -10 && signZ < quality.drawDistance) {
      const x = cx(signZ) + 7.2;
      column(objects, x, 2.9, signZ, 0.1, 5.8, '#9caaa5', 6);
      box(objects, x - 3.1, 5.35, signZ, 8.6, dist === 100 ? 2.8 : 2.4, 0.15, '#235548');
    }
  }

  // Ground shadow under the player car for depth.
  if (quality.shadows) {
    box(objects, px, 0.04, -0.2, 2.2, 0.05, 4.4, '#1a2228');
  }
  // Player car last so it stays visible over road props.
  car(objects, px, 0.02, opts.color, {
    angle: s.yaw || 0,
    roll: -s.vx * 0.007 + (curve(s.d + 12) - 2 * curve(s.d) + curve(s.d - 12)) * 0.008,
    spin: s.d / 0.44,
    brake: opts.brake,
    lights: opts.lights || night,
    steer: s.steer * 0.35,
  });

  cam.draw(a);
  cam.draw(objects);

  // Soft lateral seals — light vignette, not muddy curtains
  const edgeW = w * 0.1;
  c.save();
  for (const side of [0, 1] as const) {
    const grad = c.createLinearGradient(side ? w : 0, 0, side ? w - edgeW : edgeW, 0);
    grad.addColorStop(0, shade(g0, night ? 0.75 : 0.9));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = grad;
    c.globalAlpha = 0.28;
    c.fillRect(side ? w - edgeW : 0, horizonY, edgeW, h - horizonY);
  }
  c.restore();

  // Soft contact shadow projected in screen space under the car.
  const shadow = cam.project(v(px, 0.05, 0));
  if (shadow.z > 0.4) {
    c.fillStyle = '#0a121888';
    c.beginPath();
    c.ellipse(shadow.x, shadow.y + h * 0.01, w * 0.09, h * 0.018, 0, 0, Math.PI * 2);
    c.fill();
  }

  const signZ = s.fork - s.d - 100;
  if (signZ > 5 && signZ < 280) {
    const x = cx(signZ) + 4.1;
    const half = 4.1;
    const y = 5.35;
    const corners = [v(x - half, y + 1.15, signZ - 0.09), v(x + half, y + 1.15, signZ - 0.09), v(x + half, y - 1.15, signZ - 0.09), v(x - half, y - 1.15, signZ - 0.09)].map(cam.project);
    if (corners.every((p) => p.z > 0.2)) {
      const tex = document.createElement('canvas');
      tex.width = 640;
      tex.height = 180;
      const tc = tex.getContext('2d')!;
      tc.fillStyle = '#235548';
      tc.fillRect(0, 0, 640, 180);
      tc.strokeStyle = '#fff9df';
      tc.lineWidth = 6;
      tc.strokeRect(10, 10, 620, 160);
      tc.fillStyle = '#fff9df';
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
      const tris = [[0, 1, 2], [0, 2, 3]];
      const uv = [[0, 0], [640, 0], [640, 180], [0, 180]];
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

  if (night) {
    c.fillStyle = '#07102055';
    c.fillRect(0, 0, w, h);
    const glow = c.createRadialGradient(w * 0.5, h * 0.7, 8, w * 0.5, h * 0.6, w * 0.5);
    glow.addColorStop(0, '#fff2bc20');
    glow.addColorStop(1, '#fff2bc00');
    c.fillStyle = glow;
    c.beginPath();
    c.moveTo(w * 0.38, h * 0.7);
    c.lineTo(w * 0.2, h * 0.48);
    c.lineTo(w * 0.8, h * 0.48);
    c.lineTo(w * 0.62, h * 0.7);
    c.fill();
  }

  if (weather === 'rain' && quality.particles && !opts.reduceEffects) {
    c.strokeStyle = '#c8d4dc55';
    c.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const rx = ((i * 97 + s.d * 3) % w);
      const ry = ((i * 53 + s.time * 400) % h);
      c.beginPath();
      c.moveTo(rx, ry);
      c.lineTo(rx + 2, ry + 10);
      c.stroke();
    }
  }
  if (weather === 'fog') {
    c.fillStyle = '#c8d0d655';
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

  // Gentle horizon mist only — keep the road and car clear.
  const depth = c.createLinearGradient(0, h * 0.22, 0, h * 0.48);
  depth.addColorStop(0, night ? '#0a152033' : '#d0dce022');
  depth.addColorStop(1, '#ffffff00');
  c.fillStyle = depth;
  c.fillRect(0, h * 0.2, w, h * 0.28);
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
  bg.addColorStop(0, '#1c2a34');
  bg.addColorStop(1, '#121a22');
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
      quad(a, x + 1, z, x + 1, z + 2, 1.97, (x + z) % 4 === 0 ? '#596369' : '#505b61', -0.04);
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
  box(objects, -6, 0.65, 4, 2.1, 1.3, 1.1, '#984744');
  for (let j = 0; j < 4; j++) box(objects, -6, 0.25 + j * 0.28, 3.43, 1.9, 0.04, 0.02, '#bd9487');
  box(objects, 5, 1.1, 5, 3, 2.2, 0.6, '#456170');
  for (let j = 0; j < 6; j++) box(objects, 5, 1.5, 4.65, 2.9, 0.035, 0.04, '#6e878e');
  for (const x of [-3, 3]) {
    box(objects, x, 5.1, 0, 0.6, 0.05, 6, '#fff6d5');
    box(objects, x, 5.16, 0, 0.8, 0.07, 6.1, '#8d989a');
  }
  box(objects, 0, 2.4, 15.7, 5.7, 3.3, 0.1, '#2c343b');
  for (let j = 0; j < 10; j++) box(objects, 0, 0.9 + j * 0.3, 15.6, 5.6, 0.035, 0.03, '#7b898c');
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
  const spots = [v(-0.8, 1.4, -1), v(0.8, 1.4, 0), v(0, 1.4, 1.5)];
  return spots.map((p, i) => {
    const q = cam.project(p);
    return { x: (q.x / w) * 100, y: (q.y / h) * 100, visible: q.z > 0, index: i };
  });
}
