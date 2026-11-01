import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { VEHICLE_TYPES } from '../../game/config.js';

export type CarVariant = 'sport' | 'sedan' | 'van' | 'truck' | 'slow' | 'bus' | 'moto';

type Pt = [number, number]; // [z (forward), y (up)]

/** Opaque dark glass. Never transparent. */
function glassMat() {
  return new THREE.MeshStandardMaterial({
    color: 0x3b566b,
    metalness: 0.15,
    roughness: 0.22,
    emissive: 0x16303f,
    emissiveIntensity: 0.55,
    // thin panes are seen from either side depending on slope and camera
    side: THREE.DoubleSide,
  });
}

function paintMat(color: THREE.ColorRepresentation, gloss = 0.32) {
  const c = new THREE.Color(color);
  c.offsetHSL(0, 0.03, 0.09);
  return new THREE.MeshStandardMaterial({
    color: c,
    metalness: 0.06,
    roughness: gloss + 0.12,
    emissive: c.clone().multiplyScalar(0.12),
    emissiveIntensity: 0.35,
  });
}

const DARK = () => new THREE.MeshStandardMaterial({ color: 0x15191d, roughness: 0.8 });
const LIGHT_HEAD = () =>
  new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xaa8844, emissiveIntensity: 0.85 });
const LIGHT_TAIL = () =>
  new THREE.MeshStandardMaterial({ color: 0xd8402c, emissive: 0x8a1a10, emissiveIntensity: 0.9 });

/** Polygon with every corner rounded by a quadratic curve. */
function roundedShape(pts: Pt[], r: number): THREE.Shape {
  const sh = new THREE.Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i + n - 1) % n];
    const b = pts[(i + 1) % n];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]);
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ra = Math.min(r, la * 0.45);
    const rb = Math.min(r, lb * 0.45);
    const pa: Pt = [p[0] + ((a[0] - p[0]) / la) * ra, p[1] + ((a[1] - p[1]) / la) * ra];
    const pb: Pt = [p[0] + ((b[0] - p[0]) / lb) * rb, p[1] + ((b[1] - p[1]) / lb) * rb];
    if (i === 0) sh.moveTo(pa[0], pa[1]);
    else sh.lineTo(pa[0], pa[1]);
    sh.quadraticCurveTo(p[0], p[1], pb[0], pb[1]);
  }
  sh.closePath();
  return sh;
}

/** Side profile (z,y) extruded across the car's width with rounded bevelled edges. */
function solid(pts: Pt[], width: number, mat: THREE.Material, corner = 0.25, bevel = 0.1): THREE.Mesh {
  const geo = new THREE.ExtrudeGeometry(roundedShape(pts, corner), {
    depth: Math.max(0.05, width - bevel * 2),
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 2,
    curveSegments: 3,
  });
  geo.translate(0, 0, -(width - bevel * 2) / 2);
  geo.rotateY(-Math.PI / 2); // shape x -> world +z, extrusion -> world x
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  return m;
}

/** Slim rounded glass panel in the plane of the rake (a, b are (z,y) endpoints). */
function pane(a: Pt, b: Pt, width: number, mat: THREE.Material, lift = 0.015): THREE.Mesh {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const shape = roundedShape(
    [
      [-width / 2, -len / 2],
      [width / 2, -len / 2],
      [width / 2 - width * 0.06, len / 2],
      [-width / 2 + width * 0.06, len / 2],
    ],
    0.08,
  );
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false, curveSegments: 3 });
  const m = new THREE.Mesh(geo, mat);
  const ang = Math.atan2(b[0] - a[0], b[1] - a[1]); // tilt from vertical toward +z
  m.position.set(0, (a[1] + b[1]) / 2, (a[0] + b[0]) / 2);
  m.rotation.set(0, 0, 0);
  // plane normal initially +z; rake it about x so its up-edge leans toward +z by ang
  m.rotation.x = ang;
  // push out along the surface normal (pointing outward) so it sits proud of the paint
  const nz = Math.cos(ang);
  const ny = -Math.sin(ang);
  // outward is +z/up for a windshield (leans back going up) and -z/up for a rear glass
  const out = b[0] - a[0] <= 0 ? 1 : -1;
  m.position.z += out * nz * lift;
  m.position.y += out * ny * lift;
  return m;
}

function wheel(g: THREE.Group, x: number, z: number, r: number, w = 0.3): void {
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, w, 14),
    new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.9 }),
  );
  tire.rotation.z = Math.PI / 2;
  tire.position.set(x, r, z);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.62, r * 0.62, 0.03, 10),
    new THREE.MeshStandardMaterial({ color: 0x9aa3aa, metalness: 0.3, roughness: 0.4 }),
  );
  rim.rotation.z = Math.PI / 2;
  rim.position.copy(tire.position);
  rim.position.x += Math.sign(x || 1) * (w / 2 - 0.005);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.05, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a4046, metalness: 0.6, roughness: 0.4 }),
  );
  hub.rotation.z = Math.PI / 2;
  hub.position.copy(tire.position);
  hub.position.x += Math.sign(x || 1) * (w / 2 - 0.005);
  g.add(tire, rim, hub);
}

function lights(g: THREE.Group, W: number, L: number, yHead: number, yTail: number, bar = true): void {
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), LIGHT_HEAD());
    h.scale.set(1, 0.8, 0.6);
    h.position.set(s * W * 0.34, yHead, L / 2 - 0.04);
    h.userData.kind = 'head';
    g.add(h);
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), LIGHT_TAIL());
    t.scale.set(1.1, 0.7, 0.5);
    t.position.set(s * W * 0.36, yTail, -L / 2 + 0.03);
    t.userData.kind = 'tail';
    g.add(t);
  }
  if (bar) {
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.4, 0.06, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xa8281c, emissive: 0x7a1408, emissiveIntensity: 0.8 }),
    );
    b.position.set(0, yTail, -L / 2 + 0.02);
    b.userData.kind = 'tailbar';
    g.add(b);
  }
}

const SEDAN_BODY = (L: number): Pt[] => [
  [-L / 2, 0.34],
  [L / 2 - 0.1, 0.3],
  [L / 2, 0.55],
  [L * 0.36, 0.74],
  [-L * 0.42, 0.8],
  [-L / 2, 0.7],
];

interface Spec {
  W: number;
  L: number;
  body: Pt[];
  cabin: Pt[];
  wheelR: number;
  wheelZ: [number, number];
  /** [front windshield bottom, top] and [rear bottom, top] in (z,y) */
  wind: [Pt, Pt];
  rear: [Pt, Pt];
  side: Pt[];
  headY: number;
  tailY: number;
  cabinW?: number;
  extras?: (g: THREE.Group, paint: THREE.Material, spec: Spec) => void;
}

function build(name: string, spec: Spec, color: string): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  const paint = paintMat(color);
  const glass = glassMat();
  const { W, L } = spec;
  g.add(solid(spec.body, W, paint, 0.28, 0.12));
  const cabW = spec.cabinW ?? W * 0.86;
  g.add(solid(spec.cabin, cabW, paint, 0.2, 0.08));
  // side windows: a glass band standing proud of the cabin sides
  const sg = solid(spec.side, cabW + 0.03, glass, 0.1, 0.03);
  g.add(sg);
  g.add(pane(spec.wind[0], spec.wind[1], cabW * 0.9, glass));
  g.add(pane(spec.rear[0], spec.rear[1], cabW * 0.9, glass));
  // under-skirt so the car never looks hollow between wheels
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(W * 0.74, 0.1, L * 0.74), DARK());
  skirt.position.y = 0.3;
  g.add(skirt);
  for (const z of spec.wheelZ) for (const s of [-1, 1]) wheel(g, s * (W / 2 - 0.19), z, spec.wheelR);
  lights(g, W, L, spec.headY, spec.tailY);
  // front grille + bumper strip
  const grille = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, 0.16, 0.06), DARK());
  grille.position.set(0, spec.headY - 0.12, L / 2 - 0.02);
  g.add(grille);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.13, 0.03), new THREE.MeshStandardMaterial({ color: 0xe0e4e6 }));
  plate.position.set(0, spec.tailY - 0.18, -L / 2 - 0.005);
  g.add(plate);
  spec.extras?.(g, paint, spec);
  return g;
}

function sedan(color: string): THREE.Group {
  const d = VEHICLE_TYPES.sedan;
  const L = d.l, W = d.w;
  return build('car-sedan', {
    W, L, body: SEDAN_BODY(L),
    cabin: [[-L * 0.27, 0.78], [-L * 0.14, 1.28], [L * 0.1, 1.3], [L * 0.27, 0.78]],
    side: [[-L * 0.24, 0.86], [-L * 0.13, 1.2], [L * 0.09, 1.22], [L * 0.23, 0.86]],
    wind: [[L * 0.255, 0.82], [L * 0.1, 1.27]],
    rear: [[-L * 0.265, 0.82], [-L * 0.14, 1.25]],
    wheelR: 0.34, wheelZ: [L * 0.31, -L * 0.3], headY: 0.62, tailY: 0.7,
  }, color);
}

function sport(color: string): THREE.Group {
  const d = VEHICLE_TYPES.sport;
  const L = d.l, W = d.w;
  return build('car-sport', {
    W, L,
    body: [[-L / 2, 0.32], [L / 2 - 0.1, 0.3], [L / 2, 0.5], [L * 0.3, 0.62], [-L * 0.4, 0.72], [-L / 2, 0.66]],
    cabin: [[-L * 0.3, 0.68], [-L * 0.1, 1.08], [L * 0.06, 1.1], [L * 0.26, 0.66]],
    side: [[-L * 0.26, 0.74], [-L * 0.09, 1.02], [L * 0.05, 1.04], [L * 0.21, 0.74]],
    wind: [[L * 0.25, 0.7], [L * 0.07, 1.06]],
    rear: [[-L * 0.29, 0.72], [-L * 0.1, 1.04]],
    wheelR: 0.28, wheelZ: [L * 0.31, -L * 0.3], headY: 0.52, tailY: 0.68,
    extras: (g, paint, sp) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(sp.W * 0.86, 0.06, 0.34), paint);
      w.position.set(0, 0.98, -sp.L / 2 + 0.2);
      g.add(w);
      for (const s of [-1, 1]) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.2), paint);
        st.position.set(s * sp.W * 0.3, 0.88, -sp.L / 2 + 0.2);
        g.add(st);
      }
    },
  }, color);
}

function compact(color: string): THREE.Group {
  const d = VEHICLE_TYPES.slow;
  const L = d.l, W = d.w;
  return build('car-slow', {
    W, L,
    body: [[-L / 2, 0.34], [L / 2 - 0.1, 0.32], [L / 2, 0.6], [L * 0.34, 0.78], [-L * 0.44, 0.84], [-L / 2, 0.7]],
    cabin: [[-L * 0.42, 0.8], [-L * 0.36, 1.34], [L * 0.06, 1.38], [L * 0.28, 0.8]],
    side: [[-L * 0.38, 0.88], [-L * 0.34, 1.28], [L * 0.04, 1.31], [L * 0.22, 0.88]],
    wind: [[L * 0.27, 0.84], [L * 0.05, 1.35]],
    rear: [[-L * 0.425, 0.84], [-L * 0.36, 1.3]],
    wheelR: 0.31, wheelZ: [L * 0.3, -L * 0.28], headY: 0.64, tailY: 0.74,
  }, color);
}

function van(color: string): THREE.Group {
  const d = VEHICLE_TYPES.van;
  const L = d.l, W = d.w;
  const g = build('car-van', {
    W, L,
    body: [[-L / 2, 0.36], [L / 2 - 0.1, 0.34], [L / 2, 0.7], [L * 0.4, 0.95], [-L / 2, 0.98]],
    cabin: [[-L / 2 + 0.05, 0.9], [-L / 2 + 0.1, 2.0], [L * 0.2, 2.02], [L * 0.38, 1.2], [L * 0.4, 0.9]],
    side: [[L * 0.06, 1.1], [L * 0.06, 1.75], [L * 0.2, 1.78], [L * 0.33, 1.2]],
    wind: [[L * 0.4, 1.0], [L * 0.2, 1.8]],
    rear: [[-L / 2 + 0.02, 1.9], [-L / 2 + 0.03, 1.9]],
    wheelR: 0.38, wheelZ: [L * 0.31, -L * 0.3], headY: 0.74, tailY: 1.0,
    cabinW: W * 0.94,
  }, color);
  return g;
}

function truck(color: string): THREE.Group {
  const d = VEHICLE_TYPES.truck;
  const L = d.l, W = d.w;
  const g = new THREE.Group();
  g.name = 'car-truck';
  const cab = paintMat(color);
  const glass = glassMat();
  const trailer = paintMat('#d8dde0', 0.5);
  const cabL = 2.5;
  const zc = L / 2 - cabL / 2; // cab centre
  g.add(solid([[-cabL / 2, 0.55], [cabL / 2, 0.5], [cabL / 2, 1.2], [cabL * 0.38, 2.5], [-cabL * 0.45, 2.55], [-cabL / 2, 1.2]], W * 0.96, cab, 0.3, 0.12));
  g.children[0].position.z = zc;
  const w = pane([L / 2 - 0.03, 1.45], [L / 2 - 0.24, 2.35], W * 0.8, glass, 0.04);
  w.position.z += 0.0;
  g.add(w);
  for (const s of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 1.0), glass);
    sw.position.set(s * (W * 0.48 + 0.0), 1.85, zc + 0.15);
    g.add(sw);
  }
  // trailer: long rounded box with chassis strip
  const tl = L - cabL - 0.2;
  const tb = solid([[-tl / 2, 0.9], [tl / 2, 0.9], [tl / 2, 3.2], [-tl / 2, 3.2]], W * 0.98, trailer, 0.12, 0.1);
  tb.position.z = -L / 2 + tl / 2;
  g.add(tb);
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(W * 0.8, 0.3, L * 0.95), DARK());
  chassis.position.set(0, 0.6, 0);
  g.add(chassis);
  for (const z of [L / 2 - 1.0, -L / 2 + 1.0, -L / 2 + 2.3]) for (const s of [-1, 1]) wheel(g, s * (W / 2 - 0.2), z, 0.5, 0.34);
  lights(g, W, L, 0.95, 1.0);
  return g;
}

function bus(color: string): THREE.Group {
  const d = VEHICLE_TYPES.bus;
  const L = d.l, W = d.w;
  const g = new THREE.Group();
  g.name = 'car-bus';
  const paint = paintMat(color, 0.4);
  const glass = glassMat();
  g.add(solid([[-L / 2, 0.55], [L / 2 - 0.1, 0.5], [L / 2, 1.0], [L / 2 - 0.1, 3.0], [-L / 2 + 0.1, 3.1], [-L / 2, 2.8]], W, paint, 0.35, 0.14));
  // window band along both sides (glass boxes proud of the body) + windshield
  for (const s of [-1, 1]) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, L - 2.2), glass);
    band.position.set(s * (W / 2 + 0.005), 2.15, -0.4);
    g.add(band);
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.45, 0.8), glass);
    door.position.set(s * (W / 2 + 0.005), 1.45, L / 2 - 2.0);
    if (s === 1) g.add(door);
  }
  g.add(pane([L / 2 - 0.02, 1.2], [L / 2 - 0.1, 2.85], W * 0.88, glass));
  g.add(pane([-L / 2 + 0.05, 1.7], [-L / 2 + 0.1, 2.75], W * 0.8, glass));
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(W + 0.01, 0.14, L * 0.98), paintMat('#f2f2ee', 0.5));
  stripe.position.y = 1.0;
  g.add(stripe);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W * 0.5, 0.18, 1.6), paintMat('#e6e8e8', 0.5));
  roof.position.set(0, 3.15, -1);
  g.add(roof);
  for (const z of [L / 2 - 2.0, -L / 2 + 2.2]) for (const s of [-1, 1]) wheel(g, s * (W / 2 - 0.2), z, 0.52, 0.36);
  lights(g, W, L, 0.8, 1.1);
  return g;
}

function moto(color: string): THREE.Group {
  const d = VEHICLE_TYPES.moto;
  const L = d.l;
  const g = new THREE.Group();
  g.name = 'car-moto';
  const paint = paintMat(color, 0.3);
  const dark = DARK();
  for (const z of [L * 0.34, -L * 0.34]) wheel(g, 0, z, 0.33, 0.16);
  // frame / tank / seat
  const tank = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 6), paint);
  tank.scale.set(0.9, 0.85, 1.5);
  tank.position.set(0, 0.85, L * 0.1);
  g.add(tank);
  const seat = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.5, 2, 7), dark);
  seat.rotation.x = Math.PI / 2;
  seat.position.set(0, 0.78, -L * 0.14);
  g.add(seat);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.3, 2, 7), paint);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0.82, -L * 0.36);
  g.add(tail);
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8), new THREE.MeshStandardMaterial({ color: 0xb7bec4, metalness: 0.8, roughness: 0.3 }));
  fork.position.set(0, 0.65, L * 0.34);
  fork.rotation.x = 0.35;
  g.add(fork);
  const bars = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8), dark);
  bars.rotation.z = Math.PI / 2;
  bars.position.set(0, 1.08, L * 0.27);
  g.add(bars);
  const engine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.5), dark);
  engine.position.set(0, 0.5, 0);
  g.add(engine);
  // rider (opaque): torso, helmet, arms
  const jacket = paintMat('#2d3640', 0.7);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.42, 2, 7), jacket);
  torso.position.set(0, 1.28, -L * 0.1);
  torso.rotation.x = 0.35;
  g.add(torso);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 7), paintMat('#e8e8e4', 0.25));
  helmet.position.set(0, 1.72, L * 0.02);
  g.add(helmet);
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.35), glassMat());
  visor.rotation.x = Math.PI / 2 - 0.1;
  visor.position.set(0, 1.72, L * 0.06);
  g.add(visor);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.45, 2, 7), jacket);
    arm.position.set(s * 0.26, 1.2, L * 0.1);
    arm.rotation.set(1.1, 0, s * 0.35);
    g.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.4, 2, 7), jacket);
    leg.position.set(s * 0.2, 0.85, -L * 0.05);
    leg.rotation.x = 0.6;
    g.add(leg);
  }
  const h = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 5), LIGHT_HEAD());
  h.position.set(0, 0.98, L * 0.42);
  h.userData.kind = 'head';
  g.add(h);
  const t = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 5), LIGHT_TAIL());
  t.scale.set(1.6, 0.8, 0.6);
  t.position.set(0, 0.84, -L / 2 + 0.02);
  t.userData.kind = 'tail';
  g.add(t);
  return g;
}

/** Player: rounded hatchback. Big sloped rear glass, round tail lights, thin bar. */
function hatch(color: string): THREE.Group {
  const W = 1.86, L = 4.3;
  const g = build('car-hatch', {
    W, L,
    body: [[-L / 2, 0.34], [L / 2 - 0.1, 0.3], [L / 2, 0.55], [L * 0.34, 0.76], [-L * 0.44, 0.84], [-L / 2, 0.72]],
    cabin: [[-L * 0.42, 0.8], [-L * 0.17, 1.34], [L * 0.08, 1.36], [L * 0.27, 0.8]],
    side: [[-L * 0.36, 0.88], [-L * 0.16, 1.27], [L * 0.07, 1.29], [L * 0.22, 0.88]],
    wind: [[L * 0.26, 0.84], [L * 0.07, 1.33]],
    rear: [[-L * 0.425, 0.84], [-L * 0.18, 1.32]],
    wheelR: 0.34, wheelZ: [L * 0.3, -L * 0.3], headY: 0.64, tailY: 0.74,
  }, color);
  return g;
}

function createVehicleRaw(variant: CarVariant, color: string): THREE.Group {
  switch (variant as string) {
    case 'hatch':
      return hatch(color);
    case 'sport':
      return sport(color);
    case 'slow':
      return compact(color);
    case 'van':
      return van(color);
    case 'truck':
      return truck(color);
    case 'bus':
      return bus(color);
    case 'moto':
      return moto(color);
    default:
      return sedan(color);
  }
}

/** Merge static parts that share a material so each car is a handful of draw calls, not ~25. */
function mergeStatic(g: THREE.Group): THREE.Group {
  g.updateMatrixWorld(true);
  const buckets = new Map<string, { mat: THREE.Material; geos: THREE.BufferGeometry[]; shadow: boolean }>();
  const drop: THREE.Mesh[] = [];
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || m.userData.kind) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    const key = [mat.type, mat.color.getHex(), mat.emissive.getHex(), mat.emissiveIntensity, mat.roughness, mat.metalness, m.castShadow].join('|');
    let geo = m.geometry.clone();
    geo.applyMatrix4(m.matrixWorld);
    if (geo.index) geo = geo.toNonIndexed();
    for (const name of Object.keys(geo.attributes)) if (name !== 'position' && name !== 'normal') geo.deleteAttribute(name);
    let b = buckets.get(key);
    if (!b) buckets.set(key, (b = { mat, geos: [], shadow: m.castShadow }));
    b.geos.push(geo);
    drop.push(m);
  });
  for (const m of drop) m.removeFromParent();
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.castShadow = b.shadow;
    g.add(mesh);
  }
  return g;
}

/**
 * The road camera mirrors X in its projection so the arrows match the screen. That reverses
 * the on-screen winding of every triangle, so an opaque FrontSide car showed its inside faces
 * (wheels and glass seen through the paint). Reverse the winding once for that camera and keep
 * the outward normals, so the visible faces are the outside ones and light correctly.
 */
function reverseWinding(geo: THREE.BufferGeometry): void {
  const swap = (a: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined, i: number, j: number) => {
    if (!a) return;
    for (let k = 0; k < a.itemSize; k++) {
      const t = a.getComponent(i, k);
      a.setComponent(i, k, a.getComponent(j, k));
      a.setComponent(j, k, t);
    }
    (a as THREE.BufferAttribute).needsUpdate = true;
  };
  if (geo.index) {
    const ix = geo.index;
    for (let i = 0; i + 2 < ix.count; i += 3) {
      const t = ix.getX(i + 1);
      ix.setX(i + 1, ix.getX(i + 2));
      ix.setX(i + 2, t);
    }
    ix.needsUpdate = true;
    return;
  }
  const n = geo.attributes.position.count;
  for (let i = 0; i + 2 < n; i += 3) for (const name of Object.keys(geo.attributes)) swap(geo.attributes[name] as THREE.BufferAttribute, i + 1, i + 2);
}

export function createVehicle(variant: CarVariant, color: string, mirroredView = false): THREE.Group {
  const g = mergeStatic(createVehicleRaw(variant, color));
  if (mirroredView) g.traverse((o) => { if ((o as THREE.Mesh).isMesh) reverseWinding((o as THREE.Mesh).geometry); });
  return g;
}

export function setVehicleLights(group: THREE.Group, on: boolean, brake: boolean): void {
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const m = obj.material as THREE.MeshStandardMaterial;
    if (!m || !m.emissive) return;
    if (obj.userData.kind === 'head') {
      m.emissive.setHex(on ? 0xccaa55 : 0x443311);
      m.emissiveIntensity = on ? 1.5 : 0.45;
    }
    if (obj.userData.kind === 'tail') {
      m.emissive.setHex(brake ? 0xff2200 : 0x661818);
      m.emissiveIntensity = brake ? 2 : 0.55;
    }
    if (obj.userData.kind === 'tailbar') {
      m.emissive.setHex(brake ? 0xff2812 : on ? 0xcc2214 : 0x551208);
      m.emissiveIntensity = brake ? 2.0 : on ? 0.95 : 0.45;
    }
  });
}
