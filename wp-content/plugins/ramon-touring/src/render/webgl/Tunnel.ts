import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TUNNEL, tunnelStart } from '../../game/tunnel.js';
import { curve, roadYaw } from './path.js';
import type { RunState } from '../../game/types.js';

const SLICE = 14;
const IN = 9.3; // inner half width: clear of the shoulder and the right exit edge
const H = 7.4;

function box(w: number, h: number, d: number, x: number, y: number, z: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  return g;
}

/** Pooled tunnel segments that follow the road curve and wrap it in concrete. */
export class TunnelField {
  readonly root = new THREE.Group();
  private pool: THREE.Group[] = [];
  private active = 0;
  private concrete = new THREE.MeshStandardMaterial({ color: 0x9aa0a2, roughness: 0.9 });
  private tile = new THREE.MeshStandardMaterial({ color: 0x3f5f66, roughness: 0.6 });
  private strip = new THREE.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffe9b0, emissiveIntensity: 1.6 });
  private warn = new THREE.MeshStandardMaterial({ color: 0xff9a2a, emissive: 0xff7a10, emissiveIntensity: 0.9 });
  private hillMat = new THREE.MeshStandardMaterial({ color: 0x66795a, roughness: 1, flatShading: true });
  private geo: { concrete: THREE.BufferGeometry; tile: THREE.BufferGeometry; strip: THREE.BufferGeometry; warn: THREE.BufferGeometry; hill: THREE.BufferGeometry };

  constructor() {
    const L = SLICE + 0.7;
    const concrete = mergeGeometries([
      box(1.0, H, L, -IN - 0.5, H / 2, 0),
      box(1.0, H, L, IN + 0.5, H / 2, 0),
      box(IN * 2 + 2, 0.9, L, 0, H + 0.45, 0),
      box(0.6, 0.45, L, -IN + 0.2, 0.22, 0),
      box(0.6, 0.45, L, IN - 0.2, 0.22, 0),
    ])!;
    const tile = mergeGeometries([
      box(0.1, 2.4, L, -IN + 0.02, 1.9, 0),
      box(0.1, 2.4, L, IN - 0.02, 1.9, 0),
    ])!;
    const strip = mergeGeometries([
      box(0.55, 0.1, 3.2, -3.2, H - 0.05, 0),
      box(0.55, 0.1, 3.2, 3.2, H - 0.05, 0),
    ])!;
    const warn = mergeGeometries([
      box(0.1, 0.14, L, -IN + 0.02, 3.4, 0),
      box(0.1, 0.14, L, IN - 0.02, 3.4, 0),
    ])!;
    // Hill over the tube: half ellipse, open-ended, one slice long.
    const hill = new THREE.CylinderGeometry(1, 1, L, 18, 1, true, Math.PI / 2, Math.PI);
    hill.rotateX(Math.PI / 2);
    hill.scale(30, 15, 1);
    this.geo = { concrete, tile, strip, warn, hill };
  }

  private mkSlice(): THREE.Group {
    const g = new THREE.Group();
    const parts: [THREE.BufferGeometry, THREE.Material][] = [
      [this.geo.concrete, this.concrete],
      [this.geo.tile, this.tile],
      [this.geo.strip, this.strip],
      [this.geo.warn, this.warn],
      [this.geo.hill, this.hillMat],
    ];
    for (const [geo, mat] of parts) {
      const m = new THREE.Mesh(geo, mat);
      g.add(m);
    }
    this.root.add(g);
    return g;
  }

  private mkPortal(): THREE.Group {
    const g = new THREE.Group();
    const face = mergeGeometries([
      box(IN * 2 + 14, 9, 1.6, 0, H + 4.5, 0),
      box(7, H + 9, 1.6, -IN - 3.5 - 0.5, (H + 9) / 2, 0),
      box(7, H + 9, 1.6, IN + 3.5 + 0.5, (H + 9) / 2, 0),
      box(IN * 2 + 2, 0.6, 1.9, 0, H + 0.3, 0.1),
    ])!;
    g.add(new THREE.Mesh(face, this.concrete));
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(5, 1.1, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x1d4f8c, emissive: 0x0b2a50, emissiveIntensity: 0.5 }),
    );
    sign.position.set(0, H + 1.4, 0.9);
    g.add(sign);
    this.root.add(g);
    return g;
  }

  private portals: THREE.Group[] = [];

  sync(s: RunState, drawDistance: number): void {
    const base = curve(s.d);
    const far = drawDistance + 20;
    this.active = 0;
    let portalIdx = 0;
    const kMin = Math.max(0, Math.floor((s.d - TUNNEL.offset - TUNNEL.length - 40) / TUNNEL.period));
    const kMax = Math.floor((s.d + far - TUNNEL.offset) / TUNNEL.period);
    for (let k = kMin; k <= kMax; k++) {
      const a = tunnelStart(k);
      const b = a + TUNNEL.length;
      for (const edge of [a, b]) {
        const z = edge - s.d;
        if (z < -20 || z > far) continue;
        let p = this.portals[portalIdx];
        if (!p) {
          p = this.mkPortal();
          this.portals[portalIdx] = p;
        }
        portalIdx++;
        p.visible = true;
        p.position.set(curve(edge) - base, 0, z);
        p.rotation.y = roadYaw(edge, 0);
      }
      for (let w = a; w < b; w += SLICE) {
        const z = w + SLICE / 2 - s.d;
        if (z < -SLICE - 6 || z > far) continue;
        let g = this.pool[this.active];
        if (!g) {
          g = this.mkSlice();
          this.pool.push(g);
        }
        this.active++;
        g.visible = true;
        g.position.set(curve(w + SLICE / 2) - base, 0, z);
        g.rotation.y = roadYaw(w + SLICE / 2, 0, 9);
      }
    }
    for (let i = this.active; i < this.pool.length; i++) this.pool[i].visible = false;
    for (let i = portalIdx; i < this.portals.length; i++) if (this.portals[i]) this.portals[i].visible = false;
  }

  setHillColor(c: string): void {
    this.hillMat.color.set(c);
  }
}
