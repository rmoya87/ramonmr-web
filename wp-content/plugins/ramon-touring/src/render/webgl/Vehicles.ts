import * as THREE from 'three';

export type CarVariant = 'sport' | 'sedan' | 'van' | 'truck' | 'slow';

const glassMat = () =>
  new THREE.MeshStandardMaterial({
    color: 0x2a5060,
    metalness: 0.15,
    roughness: 0.2,
    transparent: true,
    opacity: 0.55,
    depthWrite: true,
  });

function bodyMat(color: string) {
  const c = new THREE.Color(color);
  c.offsetHSL(0, 0.02, 0.1);
  return new THREE.MeshStandardMaterial({
    color: c,
    metalness: 0.1,
    roughness: 0.45,
    emissive: c.clone().multiplyScalar(0.06),
    emissiveIntensity: 0.25,
  });
}

function addWheel(group: THREE.Group, x: number, z: number, r: number): void {
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, 0.34, 16),
    new THREE.MeshStandardMaterial({ color: 0x1a1e22, roughness: 0.92 }),
  );
  tire.rotation.z = Math.PI / 2;
  tire.position.set(x, r * 0.92, z);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0xd8dee4, metalness: 0.4, roughness: 0.35 }),
  );
  rim.rotation.z = Math.PI / 2;
  rim.position.copy(tire.position);
  group.add(tire, rim);
}

/**
 * Sealed arcade coupe: solid hull + roof so the chase camera never sees through the cabin.
 */
export function createVehicle(variant: CarVariant, color: string): THREE.Group {
  const g = new THREE.Group();
  g.name = `car-${variant}`;
  const paint = bodyMat(color);
  const dark = new THREE.MeshStandardMaterial({ color: 0x1e282e, roughness: 0.7 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe4eaee, metalness: 0.5, roughness: 0.32 });
  const glass = glassMat();

  let bodyL = 4.4;
  let bodyW = 1.9;
  let bodyH = 0.58;
  let cabinH = 0.55;
  let cabinL = 1.7;
  let cabinZ = -0.1;
  let wheelZ = 1.35;
  let wheelR = 0.42;

  switch (variant) {
    case 'van':
      bodyL = 4.7;
      bodyH = 0.72;
      cabinH = 0.95;
      cabinL = 2.15;
      cabinZ = 0.05;
      wheelZ = 1.25;
      break;
    case 'truck':
      bodyL = 5.0;
      bodyW = 2.05;
      bodyH = 0.68;
      cabinH = 0.8;
      cabinL = 1.35;
      cabinZ = 0.9;
      wheelZ = 1.4;
      wheelR = 0.48;
      break;
    case 'slow':
      bodyL = 3.7;
      bodyW = 1.75;
      bodyH = 0.52;
      cabinH = 0.52;
      cabinL = 1.45;
      wheelZ = 1.1;
      wheelR = 0.38;
      break;
    case 'sedan':
      bodyL = 4.55;
      cabinH = 0.58;
      cabinL = 1.8;
      break;
    case 'sport':
      bodyL = 4.5;
      bodyH = 0.5;
      cabinH = 0.5;
      cabinL = 1.55;
      cabinZ = -0.15;
      wheelR = 0.44;
      break;
    default: {
      const _e: never = variant;
      void _e;
    }
  }

  const floorY = wheelR * 0.55;
  const bodyY = wheelR + bodyH * 0.5;
  const cabinY = wheelR + bodyH + cabinH * 0.5;

  // Closed undertray + floor (blocks seeing the road through the car).
  const floor = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.95, 0.16, bodyL * 0.96), dark);
  floor.position.y = floorY;
  g.add(floor);

  // Main hull — solid volume
  const hull = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), paint);
  hull.position.y = bodyY;
  hull.castShadow = true;
  g.add(hull);

  // Hood / trunk lids as solid lids on the hull
  const hood = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.9, 0.1, bodyL * 0.26), paint);
  hood.position.set(0, bodyY + bodyH * 0.42, bodyL * 0.28);
  g.add(hood);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.9, 0.1, bodyL * 0.22), paint);
  deck.position.set(0, bodyY + bodyH * 0.4, -bodyL * 0.3);
  g.add(deck);

  // Cabin volume — fully opaque (roof included)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.82, cabinH, cabinL), paint);
  cabin.position.set(0, cabinY, cabinZ);
  cabin.castShadow = true;
  g.add(cabin);

  // Roof cap thicker so the silhouette reads closed from behind
  const roof = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.84, 0.14, cabinL * 0.98), paint);
  roof.position.set(0, cabinY + cabinH * 0.42, cabinZ);
  g.add(roof);

  // Window recesses: dark glass insets (not hollow openings)
  const wind = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.7, cabinH * 0.62, 0.08), glass);
  wind.position.set(0, cabinY + 0.04, cabinZ + cabinL * 0.48);
  wind.rotation.x = -0.35;
  g.add(wind);
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.68, cabinH * 0.55, 0.08), glass);
  rearGlass.position.set(0, cabinY + 0.06, cabinZ - cabinL * 0.48);
  rearGlass.rotation.x = 0.28;
  g.add(rearGlass);
  for (const side of [-1, 1]) {
    const sideG = new THREE.Mesh(new THREE.BoxGeometry(0.06, cabinH * 0.5, cabinL * 0.55), glass);
    sideG.position.set(side * bodyW * 0.42, cabinY + 0.05, cabinZ);
    g.add(sideG);
  }

  // Rear bulkhead so the cockpit never opens to the road
  const bulk = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.78, cabinH * 0.85, 0.12), paint);
  bulk.position.set(0, cabinY, cabinZ - cabinL * 0.35);
  g.add(bulk);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.48, 0.22, 0.1), dark);
  grille.position.set(0, wheelR + 0.36, bodyL * 0.5);
  g.add(grille);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.7, 0.05, 0.07), chrome);
  lip.position.set(0, wheelR + 0.2, bodyL * 0.52);
  g.add(lip);

  for (const side of [-1, 1]) {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), paint);
    mirror.position.set(side * bodyW * 0.5, cabinY - 0.05, cabinZ + cabinL * 0.3);
    g.add(mirror);
  }

  if (variant === 'sport') {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.88, 0.08, 0.26), paint);
    spoiler.position.set(0, cabinY + cabinH * 0.35, -bodyL * 0.42);
    g.add(spoiler);
  }

  if (variant === 'truck') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.9, 0.45, 1.85), paint);
    bed.position.set(0, wheelR + 0.6, -1.15);
    g.add(bed);
  }

  for (const side of [-1, 1]) {
    addWheel(g, side * (bodyW * 0.48), wheelZ, wheelR);
    addWheel(g, side * (bodyW * 0.48), -wheelZ, wheelR);
    const lightF = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xaa8844, emissiveIntensity: 0.85 }),
    );
    lightF.position.set(side * bodyW * 0.34, wheelR + 0.4, bodyL * 0.5);
    lightF.userData.kind = 'head';
    g.add(lightF);
    const lightR = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xff5a48, emissive: 0x661818, emissiveIntensity: 0.55 }),
    );
    lightR.position.set(side * bodyW * 0.34, wheelR + 0.4, -bodyL * 0.48);
    lightR.userData.kind = 'tail';
    g.add(lightR);
  }

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
  });
}
