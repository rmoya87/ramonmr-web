import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BIOMES, biomeForEnv } from '../../game/EnvironmentManager.js';
import { LOOK } from '../../look.js';
import { curve, depthPresence, inExitClearance, ramp } from './path.js';
import type { RunState } from '../../game/types.js';
import type { EnvironmentId } from '../../game/config.js';

type PropKind =
  | 'pine' | 'pineSnow' | 'palm' | 'bush' | 'rock' | 'building' | 'bollard' | 'fence' | 'guard'
  | 'tower0' | 'tower1' | 'tower2' | 'tower3' | 'tower4' | 'tower5' | 'lamp' | 'streetTree'
  | 'cactus' | 'mesa' | 'cabin' | 'lighthouse';

function makePine(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.26, 1.6, 7),
    new THREE.MeshStandardMaterial({ color: LOOK.bark, flatShading: true }),
  );
  trunk.position.y = 0.8;
  trunk.castShadow = true;
  g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.25 - i * 0.22, 1.55, 8),
      new THREE.MeshStandardMaterial({ color: LOOK.foliage[i % 3], flatShading: true }),
    );
    cone.position.y = 1.55 + i * 0.72;
    cone.castShadow = true;
    g.add(cone);
  }
  return g;
}

/** Dark snow-capped pine for the night-snow look. */
function makePineSnow(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.24, 1.5, 7),
    new THREE.MeshStandardMaterial({ color: '#2a2118', flatShading: true }),
  );
  trunk.position.y = 0.75;
  g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.2 - i * 0.22, 1.5, 8),
      new THREE.MeshStandardMaterial({ color: i === 3 ? '#c9d6de' : '#1e3038', flatShading: true }),
    );
    cone.position.y = 1.5 + i * 0.7;
    g.add(cone);
  }
  return g;
}

function makePalm(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 3.2, 8),
    new THREE.MeshStandardMaterial({ color: LOOK.wood, flatShading: true }),
  );
  trunk.position.y = 1.6;
  trunk.rotation.z = 0.08;
  trunk.castShadow = true;
  g.add(trunk);
  for (const [ox, oy, oz, s] of [
    [0, 3.4, 0, 1.15],
    [0.7, 3.15, 0.25, 0.9],
    [-0.65, 3.2, -0.2, 0.85],
    [0.2, 3.05, -0.65, 0.75],
    [-0.15, 3.1, 0.7, 0.8],
  ] as const) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(s, 8, 6),
      new THREE.MeshStandardMaterial({ color: LOOK.foliage[1], flatShading: true }),
    );
    leaf.position.set(ox, oy, oz);
    leaf.scale.set(1.2, 0.55, 1);
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

function makeBush(): THREE.Group {
  const g = new THREE.Group();
  for (const [ox, oz, s, c] of [
    [0, 0, 0.75, LOOK.foliage[0]],
    [0.4, 0.1, 0.55, LOOK.foliage[1]],
    [-0.35, -0.08, 0.5, LOOK.foliage[2]],
    [0.1, 0.2, 0.4, LOOK.foliage[1]],
  ] as const) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(s, 8, 6),
      new THREE.MeshStandardMaterial({ color: c, flatShading: true }),
    );
    m.position.set(ox, s * 0.65, oz);
    g.add(m);
  }
  return g;
}

function makeRock(): THREE.Group {
  const g = new THREE.Group();
  const a = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.6, 0),
    new THREE.MeshStandardMaterial({ color: LOOK.rock, flatShading: true }),
  );
  a.position.y = 0.4;
  a.rotation.set(0.2, 0.4, 0.1);
  const b = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.38, 0),
    new THREE.MeshStandardMaterial({ color: LOOK.rockDark, flatShading: true }),
  );
  b.position.set(0.45, 0.28, 0.12);
  g.add(a, b);
  return g;
}

function makeBuilding(): THREE.Group {
  const g = new THREE.Group();
  const h = 4.8 + (Math.sin(g.id * 12.9898) * 0.5 + 0.5) * 3.5;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, h, 2.0),
    new THREE.MeshStandardMaterial({ color: LOOK.building, flatShading: true }),
  );
  body.position.y = h / 2;
  body.castShadow = true;
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 0.25, 2.15),
    new THREE.MeshStandardMaterial({ color: LOOK.buildingRoof }),
  );
  roof.position.y = h + 0.12;
  g.add(body, roof);
  for (let row = 0; row < 3; row++) {
    for (const side of [-1, 1]) {
      const win = new THREE.Mesh(
        new THREE.PlaneGeometry(0.35, 0.45),
        new THREE.MeshStandardMaterial({
          color: 0xc8dce8,
          emissive: 0x88a0b0,
          emissiveIntensity: 0.35,
        }),
      );
      win.position.set(side * 1.31, 1.2 + row * 1.1, 0);
      win.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      g.add(win);
    }
  }
  return g;
}


const FACADES = [
  { wall: '#b9a58c', win: '#27394a', lit: '#f6d98a', cols: 4, h: 22, w: 12 },
  { wall: '#8c98a4', win: '#1d2b3a', lit: '#e8ecc0', cols: 5, h: 38, w: 11 },
  { wall: '#a8574a', win: '#2a2f38', lit: '#f6cf80', cols: 4, h: 17, w: 13 },
  { wall: '#d6d2c6', win: '#33495c', lit: '#f2e6b0', cols: 6, h: 30, w: 12 },
  { wall: '#5d7f93', win: '#142536', lit: '#cfe8f4', cols: 6, h: 46, w: 10 },
  { wall: '#c8b38a', win: '#3a3f46', lit: '#f6dc98', cols: 5, h: 26, w: 12 },
];
const facadeTex = new Map<number, THREE.CanvasTexture>();
const facadeBump = new Map<number, THREE.CanvasTexture>();

/** Relief map: walls high, windows recessed, floor bands as ledges. */
function facadeBumpTexture(i: number): THREE.CanvasTexture {
  let tex = facadeBump.get(i);
  if (tex) return tex;
  const f = FACADES[i];
  const rows = Math.round(f.h / 3.2);
  const cw = 24, ch = 28;
  const c = document.createElement('canvas');
  c.width = f.cols * cw;
  c.height = rows * ch;
  const x = c.getContext('2d')!;
  x.fillStyle = '#c8c8c8';
  x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = '#ffffff';
  for (let r = 0; r < rows; r++) x.fillRect(0, r * ch + ch - 4, c.width, 4);
  x.fillStyle = '#202020';
  for (let r = 1; r < rows; r++) for (let col = 0; col < f.cols; col++) x.fillRect(col * cw + 5, r * ch + 5, cw - 10, ch - 13);
  x.fillStyle = '#303030';
  x.fillRect(0, 0, c.width, ch);
  tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  facadeBump.set(i, tex);
  return tex;
}

/** Window grid painted once per facade; lit windows scattered so it reads as a real street. */
function facadeTexture(i: number): THREE.CanvasTexture {
  let tex = facadeTex.get(i);
  if (tex) return tex;
  const f = FACADES[i];
  const rows = Math.round(f.h / 3.2);
  const cw = 24, ch = 28;
  const c = document.createElement('canvas');
  c.width = f.cols * cw;
  c.height = rows * ch;
  const x = c.getContext('2d')!;
  x.fillStyle = f.wall;
  x.fillRect(0, 0, c.width, c.height);
  // floor bands
  x.fillStyle = 'rgba(0,0,0,0.10)';
  for (let r = 0; r < rows; r++) x.fillRect(0, r * ch + ch - 3, c.width, 3);
  let seed = 17 + i * 31;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let r = 1; r < rows; r++) {
    for (let col = 0; col < f.cols; col++) {
      const lit = rnd() < 0.28;
      x.fillStyle = lit ? f.lit : f.win;
      x.fillRect(col * cw + 5, r * ch + 5, cw - 10, ch - 13);
      x.fillStyle = 'rgba(255,255,255,0.14)';
      x.fillRect(col * cw + 5, r * ch + 5, cw - 10, 2);
    }
  }
  // shopfront row at street level
  x.fillStyle = '#26303a';
  x.fillRect(0, 0, c.width, ch);
  x.fillStyle = '#e8c070';
  for (let col = 0; col < f.cols; col++) x.fillRect(col * cw + 3, 6, cw - 6, ch - 10);
  tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  facadeTex.set(i, tex);
  return tex;
}

/** Street-front tower with a painted window grid, roof parapet and rooftop gear. Local x 0..depth. */
function makeTower(i: number): THREE.Group {
  const f = FACADES[i];
  const g = new THREE.Group();
  const depth = 12;
  const wallCol = new THREE.Color(f.wall);
  const mapFace = (shade: number, bump: boolean) =>
    new THREE.MeshStandardMaterial({ map: facadeTexture(i), ...(bump ? { bumpMap: facadeBumpTexture(i), bumpScale: 3 } : {}), roughness: 0.85, color: new THREE.Color(shade, shade, shade) });
  const front = mapFace(1, true);
  const lambertFace = (shade: number) => new THREE.MeshLambertMaterial({ map: facadeTexture(i), color: new THREE.Color(shade, shade, shade) });
  const flank = lambertFace(0.62);
  const back = lambertFace(0.45);
  const roofM = new THREE.MeshLambertMaterial({ color: 0x555a5c });
  // +x, -x (road side), +y, -y, +z, -z
  const mats = [back, front, roofM, roofM, flank, flank];
  const body = new THREE.Mesh(new THREE.BoxGeometry(depth, f.h, 13), mats);
  body.position.set(depth / 2, f.h / 2, 0);
  body.castShadow = true;
  g.add(body);
  const trimM = new THREE.MeshLambertMaterial({ color: wallCol.clone().multiplyScalar(0.72) });
  // Real relief on the road-facing side: pilasters between window columns and projecting floor ledges.
  const parts: THREE.BufferGeometry[] = [];
  const box = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const bg = new THREE.BoxGeometry(w, h, d);
    bg.translate(x, y, z);
    parts.push(bg);
  };
  const colW = 13 / f.cols;
  for (let c = 0; c <= f.cols; c++) box(0.3, f.h - 3.2, 0.5, -0.15, 3.2 + (f.h - 3.2) / 2, -6.5 + c * colW);
  const floors = Math.round(f.h / 3.2);
  for (let r = 2; r < floors; r += 3) box(0.35, 0.28, 13.4, -0.17, r * 3.2, 0);
  box(0.6, 0.35, 13.6, -0.3, f.h - 0.1, 0); // cornice
  box(0.8, 0.2, 13.2, -0.4, 3.7, 0); // shopfront canopy
  // Stepped crown so the skyline has depth (merged into the trim mesh: no extra draw call).
  if (f.h > 24) box(depth * 0.7, f.h * 0.14, 9, depth * 0.55, f.h + f.h * 0.07, 0);
  g.add(new THREE.Mesh(mergeGeometries(parts)!, trimM));
  const rim = new THREE.Mesh(new THREE.BoxGeometry(depth + 0.5, 0.7, 13.5), new THREE.MeshStandardMaterial({ color: 0x6a6e70 }));
  rim.position.set(depth / 2, f.h + 0.35, 0);
  g.add(rim);
  const roofY = f.h > 24 ? f.h * 1.14 : f.h;
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 12), new THREE.MeshStandardMaterial({ color: 0x8a6a4c }));
  tank.position.set(depth * 0.3, f.h + 1.8, 2);
  g.add(tank);
  const ac = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.8), new THREE.MeshStandardMaterial({ color: 0x9aa2a6 }));
  ac.position.set(depth * 0.65, f.h + 1.2, -2.5);
  g.add(ac);
  if (i === 1 || i === 4) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 7, 6), new THREE.MeshStandardMaterial({ color: 0xcfd3d6 }));
    mast.position.set(depth * 0.5, roofY + 3.5, 0);
    g.add(mast);
  }
  return g;
}

function makeLamp(): THREE.Group {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x3a4248, metalness: 0.5, roughness: 0.5 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 6.8, 8), steel);
  pole.position.y = 3.4;
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.1), steel);
  arm.position.set(-1.0, 6.7, 0);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.14, 0.34),
    new THREE.MeshStandardMaterial({ color: 0xfff1c8, emissive: 0xffe08a, emissiveIntensity: 1.3 }),
  );
  head.position.set(-2.0, 6.62, 0);
  g.add(pole, arm, head);
  return g;
}

function makeStreetTree(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.2, 8), new THREE.MeshStandardMaterial({ color: LOOK.bark }));
  trunk.position.y = 1.1;
  g.add(trunk);
  for (const [ox, oy, oz, r] of [[0, 3.2, 0, 1.5], [0.7, 2.8, 0.3, 1.0], [-0.6, 2.9, -0.3, 1.1]] as const) {
    const c = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshStandardMaterial({ color: LOOK.foliage[1], flatShading: true }));
    c.position.set(ox, oy, oz);
    g.add(c);
  }
  return g;
}

function makeCactus(): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#5f8a4f', flatShading: true });
  const trunk = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 2.4, 4, 10), m);
  trunk.position.y = 1.5;
  g.add(trunk);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.9, 4, 8), m);
    arm.position.set(s * 0.55, 1.9 + (s > 0 ? 0.3 : 0), 0);
    g.add(arm);
    const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.7, 4, 8), m);
    up.position.set(s * 0.82, 2.55 + (s > 0 ? 0.3 : 0), 0);
    g.add(up);
  }
  return g;
}

function makeMesa(): THREE.Group {
  const g = new THREE.Group();
  const layers = ['#b4693e', '#c47c4a', '#a45a38', '#cf8d58'];
  let y = 0;
  [[9, 4], [8, 3.2], [7, 3], [6, 2.4]].forEach(([r, h], i) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r, h, 9), new THREE.MeshStandardMaterial({ color: layers[i], flatShading: true }));
    l.position.y = y + h / 2;
    y += h;
    g.add(l);
  });
  return g;
}

function makeCabin(): THREE.Group {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.BoxGeometry(4.4, 2.4, 3.6), new THREE.MeshStandardMaterial({ color: '#8a6a4a', flatShading: true }));
  wall.position.y = 1.2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.6, 1.8, 4), new THREE.MeshStandardMaterial({ color: '#8f3b30', flatShading: true }));
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.1, 1, 0.9);
  roof.position.y = 3.3;
  const chim = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.5), new THREE.MeshStandardMaterial({ color: '#6b6560' }));
  chim.position.set(1.3, 3.8, 0.5);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.08), new THREE.MeshStandardMaterial({ color: '#4a3424' }));
  door.position.set(0, 0.75, 1.82);
  const win = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.08), new THREE.MeshStandardMaterial({ color: '#f2d890', emissive: '#c9a050', emissiveIntensity: 0.4 }));
  win.position.set(1.3, 1.4, 1.82);
  g.add(wall, roof, chim, door, win);
  return g;
}

function makeLighthouse(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(1.4 - i * 0.14 - 0.1, 1.4 - i * 0.14, 2.6, 14), new THREE.MeshStandardMaterial({ color: i % 2 ? '#c8402f' : '#f2efe6', flatShading: true }));
    seg.position.y = 1.3 + i * 2.6;
    g.add(seg);
  }
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 12), new THREE.MeshStandardMaterial({ color: '#fff3c0', emissive: '#ffd870', emissiveIntensity: 1.2 }));
  lamp.position.y = 11;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.0, 12), new THREE.MeshStandardMaterial({ color: '#333a40' }));
  cap.position.y = 12.1;
  g.add(lamp, cap);
  return g;
}

function makeBollard(): THREE.Group {
  const g = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.85, 8),
    new THREE.MeshStandardMaterial({ color: LOOK.chalk, roughness: 0.7 }),
  );
  post.position.y = 0.42;
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.12, 8),
    new THREE.MeshStandardMaterial({ color: 0xc24a38, roughness: 0.55 }),
  );
  cap.position.y = 0.9;
  g.add(post, cap);
  return g;
}

function makeFence(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: LOOK.wood, flatShading: true });
  for (const x of [-0.7, 0.7]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.12), mat);
    post.position.set(x, 0.55, 0);
    g.add(post);
  }
  for (const y of [0.35, 0.75]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.08), mat);
    rail.position.set(0, y, 0);
    g.add(rail);
  }
  return g;
}

function makeGuard(): THREE.Group {
  const g = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa4a8, metalness: 0.65, roughness: 0.35 });
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.12), steel);
  post.position.y = 0.35;
  const rail = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.14, 0.08), steel);
  rail.position.y = 0.55;
  const rail2 = rail.clone();
  rail2.position.y = 0.32;
  g.add(post, rail, rail2);
  return g;
}

const templates: Record<PropKind, () => THREE.Group> = {
  pine: makePine,
  pineSnow: makePineSnow,
  palm: makePalm,
  bush: makeBush,
  rock: makeRock,
  building: makeBuilding,
  bollard: makeBollard,
  fence: makeFence,
  guard: makeGuard,
  tower0: () => makeTower(0),
  tower1: () => makeTower(1),
  tower2: () => makeTower(2),
  tower3: () => makeTower(3),
  tower4: () => makeTower(4),
  tower5: () => makeTower(5),
  lamp: makeLamp,
  streetTree: makeStreetTree,
  cactus: makeCactus,
  mesa: makeMesa,
  cabin: makeCabin,
  lighthouse: makeLighthouse,
};

/** Pooled roadside props synced from run distance. */
export class PropField {
  readonly root = new THREE.Group();
  private pool: THREE.Group[] = [];
  private active = 0;

  private take(kind: PropKind): THREE.Group {
    let g = this.pool[this.active];
    if (!g) {
      g = templates[kind]();
      this.pool.push(g);
      this.root.add(g);
    } else if (g.userData.kind !== kind) {
      this.root.remove(g);
      g = templates[kind]();
      this.pool[this.active] = g;
      this.root.add(g);
    }
    g.userData.kind = kind;
    g.visible = true;
    this.active++;
    return g;
  }

  private place(kind: PropKind, x: number, z: number, baseScale: number, farZ: number, rotY = 0, zMul = 1, flatGrow = false): void {
    const presence = depthPresence(z, farZ, -12, 70, 18);
    if (presence < 0.02) return;
    const g = this.take(kind);
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    // Grow up from the ground while fading in/out so pop-in never reads as a hard cut.
    const s = baseScale * presence;
    g.scale.set(s, flatGrow ? s : s * (0.55 + 0.45 * presence), s * zMul);
    g.visible = true;
  }

  sync(s: RunState, env: EnvironmentId, drawDistance: number, propStep: number): void {
    this.active = 0;
    const base = curve(s.d);
    const beach = env === 'beach' || env === 'coast';
    const farZ = drawDistance + 20;
    const step = Math.max(14, propStep * 0.7);
    // Start behind the camera and run past the fog so objects enter from the horizon.
    for (let n = Math.floor((s.d - 40) / step); n * step < s.d + farZ; n++) {
      const world = n * step;
      const z = world - s.d;
      if (z < -14 || z > farZ) continue;
      const x = curve(s.d + z) - base;
      const t = world - s.fork;
      const rightOff = Math.max(12.5 + ((n % 5 + 5) % 5) * 2.2, t > -20 && t < 330 ? ramp(Math.max(0, t)) + 5.5 : 0);
      const leftOff = 11.5 + ((n % 3 + 3) % 3) * 1.8;
      const envBiome = biomeForEnv(env);
      const biomeId = envBiome >= 0 ? envBiome : Math.floor(world / 1600) % BIOMES.length;
      const jitter = ((n * 17) % 7) * 0.35;

      if (beach) {
        this.place('rock', x + rightOff, z, 0.9 + (n % 3) * 0.15, farZ);
        if (n % 2 === 0) this.place('bush', x + rightOff + 2.4, z + jitter, 1, farZ);
        if (n % 2 === 0) this.place('palm', x - leftOff - 0.5, z, 0.95 + (n % 4) * 0.08, farZ);
        if (n % 4 === 0) this.place('palm', x + rightOff + 4, z + 3, 0.8, farZ);
        if (n % 17 === 5) this.place('lighthouse', x + rightOff + 16, z, 1.2, farZ);
      } else if (biomeId === 2) {
        // City: a continuous street front of varied towers, set back from the road.
        const inR = t > -20 && t < 330;
        const cityR = inR ? ramp(Math.max(0, t)) + 6 : 11.5;
        const zMul = (step * 0.97) / 13;
        const kr = (((n * 7 + 3) % 6) + 6) % 6;
        const kl = (((n * 5 + 1) % 6) + 6) % 6;
        this.place(('tower' + kr) as PropKind, x + cityR, z, 1, farZ, 0, zMul, true);
        this.place(('tower' + kl) as PropKind, x - 11, z, 1, farZ, Math.PI, zMul, true);
        if (n % 2 === 0 && !inR) this.place('streetTree', x + 9.6, z + step * 0.5, 1, farZ);
        if (n % 2 === 1) this.place('streetTree', x - 9.4, z + step * 0.5, 1, farZ);
      } else if (biomeId === 3) {
        this.place('rock', x + rightOff, z, 1, farZ);
        if (n % 2 === 0) this.place('rock', x - leftOff, z + 1, 0.7, farZ);
        if (n % 3 === 0) this.place('bush', x + rightOff - 2, z, 1, farZ);
        if (n % 2 === 1) this.place('cactus', x + rightOff - 3, z + jitter, 0.9 + (n % 3) * 0.2, farZ);
        if (n % 5 === 0) this.place('cactus', x - leftOff + 1, z, 1.1, farZ);
        if (n % 6 === 2) this.place('mesa', x + rightOff + 34 + (n % 3) * 8, z, 1.1, farZ);
        if (n % 7 === 3) this.place('mesa', x - leftOff - 38, z, 0.9, farZ);
      } else if (biomeId === 4) {
        // Sober snow fields: sparse dark tree line, no fences or bushes near the road.
        if (n % 2 === 0) this.place('pineSnow', x + rightOff + 2.5, z, 1.1 + (n % 4) * 0.16, farZ);
        if (n % 3 === 0) this.place('pineSnow', x - leftOff - 3.5, z + jitter, 0.95 + (n % 3) * 0.12, farZ);
      } else {
        this.place('pine', x + rightOff, z, 1 + (n % 4) * 0.14, farZ);
        this.place('pine', x - leftOff, z + jitter, 0.85 + (n % 3) * 0.1, farZ);
        if (n % 2 === 0) this.place('pine', x + rightOff + 3.5, z + 2, 0.7, farZ);
        if (n % 3 === 0) this.place('bush', x + rightOff - 2.5, z + 1.5, 1, farZ);
        if (n % 4 === 0) this.place('fence', x + 8.2, z, 1, farZ, 0.1);
        if (n % 11 === 4) this.place('cabin', x - leftOff - 5, z, 1, farZ, -Math.PI / 2);
      }
    }

    const railFar = Math.min(220, farZ);
    for (let n = Math.floor((s.d - 36) / 22); n * 22 < s.d + railFar; n++) {
      const world = n * 22;
      const z = world - s.d;
      if (z < -14 || z > railFar) continue;
      const x = curve(s.d + z) - base;
      const t = world - s.fork;
      const exitZone = inExitClearance(t);
      for (const side of [-1, 1] as const) {
        if (side > 0 && exitZone) continue;
        this.place('guard', x + side * 6.55, z, 1, railFar, side > 0 ? 0.02 : -0.02);
      }
    }

    const postFar = Math.min(200, farZ);
    for (let n = Math.floor((s.d - 40) / 28); n * 28 < s.d + postFar; n++) {
      const world = n * 28;
      const z = world - s.d;
      if (z < -14 || z > postFar) continue;
      const x = curve(s.d + z) - base;
      const t = world - s.fork;
      const exitZone = inExitClearance(t);
      const cityHere = (biomeForEnv(env) >= 0 ? biomeForEnv(env) : Math.floor(world / 1600) % BIOMES.length) === 2;
      for (const side of [-1, 1] as const) {
        if (side > 0 && exitZone) continue;
        if (cityHere) this.place('lamp', x + side * 7.7, z, 1, postFar, side > 0 ? 0 : Math.PI, 1, true);
        else this.place('bollard', x + side * 6.85, z, 1, postFar);
      }
    }

    for (let i = this.active; i < this.pool.length; i++) this.pool[i].visible = false;
  }
}
