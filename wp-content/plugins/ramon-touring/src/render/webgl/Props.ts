import * as THREE from 'three';
import { BIOMES } from '../../game/EnvironmentManager.js';
import { LOOK } from '../../look.js';
import { curve, inExitClearance, ramp } from './path.js';
import type { RunState } from '../../game/types.js';
import type { EnvironmentId } from '../../game/config.js';

type PropKind = 'pine' | 'palm' | 'bush' | 'rock' | 'building';

function makePine(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.28, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: LOOK.bark }),
  );
  trunk.position.y = 0.7;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.1 - i * 0.25, 1.4, 7),
      new THREE.MeshStandardMaterial({ color: LOOK.foliage[i % 3], flatShading: true }),
    );
    cone.position.y = 1.6 + i * 0.85;
    g.add(cone);
  }
  return g;
}

function makePalm(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.3, 2.8, 7),
    new THREE.MeshStandardMaterial({ color: LOOK.wood }),
  );
  trunk.position.y = 1.4;
  g.add(trunk);
  for (const [ox, oy, oz, s] of [
    [0, 3.1, 0, 1.2],
    [0.55, 2.9, 0.2, 0.85],
    [-0.5, 2.95, -0.15, 0.8],
  ] as const) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(s, 8, 6),
      new THREE.MeshStandardMaterial({ color: LOOK.foliage[1], flatShading: true }),
    );
    leaf.position.set(ox, oy, oz);
    g.add(leaf);
  }
  return g;
}

function makeBush(): THREE.Group {
  const g = new THREE.Group();
  for (const [ox, s, c] of [
    [0, 0.7, LOOK.foliage[0]],
    [0.35, 0.5, LOOK.foliage[1]],
    [-0.3, 0.45, LOOK.foliage[2]],
  ] as const) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s, 8, 6), new THREE.MeshStandardMaterial({ color: c, flatShading: true }));
    m.position.set(ox, s * 0.7, 0);
    g.add(m);
  }
  return g;
}

function makeRock(): THREE.Group {
  const g = new THREE.Group();
  const a = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), new THREE.MeshStandardMaterial({ color: LOOK.rock, flatShading: true }));
  a.position.y = 0.4;
  const b = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), new THREE.MeshStandardMaterial({ color: LOOK.rockDark, flatShading: true }));
  b.position.set(0.4, 0.25, 0.1);
  g.add(a, b);
  return g;
}

function makeBuilding(): THREE.Group {
  const g = new THREE.Group();
  const h = 4 + Math.random() * 3;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, h, 1.8),
    new THREE.MeshStandardMaterial({ color: LOOK.building, flatShading: true }),
  );
  body.position.y = h / 2;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 1.9), new THREE.MeshStandardMaterial({ color: LOOK.buildingRoof }));
  roof.position.y = h + 0.1;
  g.add(body, roof);
  return g;
}

const templates: Record<PropKind, () => THREE.Group> = {
  pine: makePine,
  palm: makePalm,
  bush: makeBush,
  rock: makeRock,
  building: makeBuilding,
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
    } else {
      // Replace geometry cheaply by hiding mismatch — rebuild if kind tag differs
      if (g.userData.kind !== kind) {
        this.root.remove(g);
        g = templates[kind]();
        this.pool[this.active] = g;
        this.root.add(g);
      }
    }
    g.userData.kind = kind;
    g.visible = true;
    this.active++;
    return g;
  }

  sync(s: RunState, env: EnvironmentId, drawDistance: number, propStep: number): void {
    this.active = 0;
    const base = curve(s.d);
    const beach = env === 'beach' || env === 'coast';
    const step = Math.max(24, propStep);
    for (let n = Math.floor((s.d - 4) / step); n * step < s.d + drawDistance - 10; n++) {
      const world = n * step;
      const z = world - s.d;
      if (z < 6 || z > drawDistance - 8) continue;
      const x = curve(s.d + z) - base;
      const t = world - s.fork;
      const right = Math.max(13 + ((n % 4 + 4) % 4) * 2.5, t > -20 && t < 330 ? ramp(Math.max(0, t)) + 6 : 0);
      const biomeId = Math.floor(world / 1600) % BIOMES.length;

      if (beach) {
        const rock = this.take('rock');
        rock.position.set(x + right, 0, z);
        rock.scale.setScalar(1);
        if (n % 2 === 0) {
          const bush = this.take('bush');
          bush.position.set(x + right + 2.2, 0, z);
        }
        if (n % 3 === 0) {
          const palm = this.take('palm');
          palm.position.set(x - 11.2, 0, z);
        }
      } else if (biomeId === 2) {
        const b = this.take('building');
        b.position.set(x + right, 0, z);
      } else if (biomeId === 3) {
        const rock = this.take('rock');
        rock.position.set(x + right, 0, z);
      } else {
        const pine = this.take('pine');
        pine.position.set(x + right, 0, z);
        pine.scale.setScalar(1 + (n % 3) * 0.12);
        if (n % 3 === 0) {
          const pineL = this.take('pine');
          pineL.position.set(x - 12, 0, z);
          pineL.scale.setScalar(0.9);
        }
      }
    }

    // Bollards
    for (let n = Math.floor((s.d - 32) / 36); n * 36 < s.d + drawDistance - 24; n++) {
      const world = n * 36;
      const z = world - s.d;
      if (z < 12 || z > 160) continue;
      const x = curve(s.d + z) - base;
      const t = world - s.fork;
      const exitZone = inExitClearance(t);
      for (const side of [-1, 1] as const) {
        if (side > 0 && exitZone) continue;
        const post = this.take('rock');
        post.scale.set(0.25, 0.55, 0.25);
        post.position.set(x + side * 6.85, 0, z);
      }
    }

    for (let i = this.active; i < this.pool.length; i++) this.pool[i].visible = false;
  }
}
