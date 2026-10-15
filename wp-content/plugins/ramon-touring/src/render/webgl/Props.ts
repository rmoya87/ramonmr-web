import * as THREE from 'three';
import { BIOMES } from '../../game/EnvironmentManager.js';
import { LOOK } from '../../look.js';
import { curve, depthPresence, inExitClearance, ramp } from './path.js';
import type { RunState } from '../../game/types.js';
import type { EnvironmentId } from '../../game/config.js';

type PropKind = 'pine' | 'palm' | 'bush' | 'rock' | 'building' | 'bollard' | 'fence' | 'guard';

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
  palm: makePalm,
  bush: makeBush,
  rock: makeRock,
  building: makeBuilding,
  bollard: makeBollard,
  fence: makeFence,
  guard: makeGuard,
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

  private place(kind: PropKind, x: number, z: number, baseScale: number, farZ: number, rotY = 0): void {
    const presence = depthPresence(z, farZ, -12, 70, 18);
    if (presence < 0.02) return;
    const g = this.take(kind);
    g.position.set(x, 0, z);
    g.rotation.y = rotY;
    // Grow up from the ground while fading in/out so pop-in never reads as a hard cut.
    const s = baseScale * presence;
    g.scale.set(s, s * (0.55 + 0.45 * presence), s);
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
      const biomeId = Math.floor(world / 1600) % BIOMES.length;
      const jitter = ((n * 17) % 7) * 0.35;

      if (beach) {
        this.place('rock', x + rightOff, z, 0.9 + (n % 3) * 0.15, farZ);
        if (n % 2 === 0) this.place('bush', x + rightOff + 2.4, z + jitter, 1, farZ);
        if (n % 2 === 0) this.place('palm', x - leftOff - 0.5, z, 0.95 + (n % 4) * 0.08, farZ);
        if (n % 4 === 0) this.place('palm', x + rightOff + 4, z + 3, 0.8, farZ);
      } else if (biomeId === 2) {
        this.place('building', x + rightOff + 1, z, 0.9 + (n % 3) * 0.12, farZ);
        if (n % 2 === 0) this.place('building', x - leftOff - 2, z + 2, 0.75, farZ);
      } else if (biomeId === 3) {
        this.place('rock', x + rightOff, z, 1, farZ);
        if (n % 2 === 0) this.place('rock', x - leftOff, z + 1, 0.7, farZ);
        if (n % 3 === 0) this.place('bush', x + rightOff - 2, z, 1, farZ);
      } else {
        this.place('pine', x + rightOff, z, 1 + (n % 4) * 0.14, farZ);
        this.place('pine', x - leftOff, z + jitter, 0.85 + (n % 3) * 0.1, farZ);
        if (n % 2 === 0) this.place('pine', x + rightOff + 3.5, z + 2, 0.7, farZ);
        if (n % 3 === 0) this.place('bush', x + rightOff - 2.5, z + 1.5, 1, farZ);
        if (n % 4 === 0) this.place('fence', x + 8.2, z, 1, farZ, 0.1);
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
      for (const side of [-1, 1] as const) {
        if (side > 0 && exitZone) continue;
        this.place('bollard', x + side * 6.85, z, 1, postFar);
      }
    }

    for (let i = this.active; i < this.pool.length; i++) this.pool[i].visible = false;
  }
}
