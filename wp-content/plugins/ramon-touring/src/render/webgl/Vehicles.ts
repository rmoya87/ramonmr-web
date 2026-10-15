import * as THREE from 'three';

export type CarVariant = 'sport' | 'sedan' | 'van' | 'truck' | 'slow';

const glassMat = () =>
  new THREE.MeshPhysicalMaterial({
    color: 0x4a7a90,
    metalness: 0.05,
    roughness: 0.12,
    transmission: 0.45,
    thickness: 0.3,
    transparent: true,
    opacity: 0.78,
  });

/** Arcade paint: low metalness so cars stay readable without an env map. */
function bodyMat(color: string) {
  const c = new THREE.Color(color);
  c.offsetHSL(0, 0.02, 0.08);
  return new THREE.MeshStandardMaterial({
    color: c,
    metalness: 0.14,
    roughness: 0.42,
    emissive: c.clone().multiplyScalar(0.07),
    emissiveIntensity: 0.3,
  });
}

function addWheel(group: THREE.Group, x: number, z: number, r: number): void {
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, 0.32, 18),
    new THREE.MeshStandardMaterial({ color: 0x22282e, roughness: 0.92 }),
  );
  tire.rotation.z = Math.PI / 2;
  tire.position.set(x, r * 0.92, z);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.58, r * 0.58, 0.2, 14),
    new THREE.MeshStandardMaterial({ color: 0xe0e6ea, metalness: 0.45, roughness: 0.35 }),
  );
  rim.rotation.z = Math.PI / 2;
  rim.position.copy(tire.position);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.22, r * 0.22, 0.22, 10),
    new THREE.MeshStandardMaterial({ color: 0x5a646c, metalness: 0.35, roughness: 0.45 }),
  );
  hub.rotation.z = Math.PI / 2;
  hub.position.copy(tire.position);
  group.add(tire, rim, hub);
}

/**
 * Cabin with opaque roof + pillars and glass only in window openings.
 * Chase camera looks at the rear: without a solid roof the car reads as a convertible.
 */
function addCabin(
  g: THREE.Group,
  paint: THREE.MeshStandardMaterial,
  bodyW: number,
  wheelR: number,
  bodyH: number,
  cabinH: number,
  cabinL: number,
  cabinZ: number,
): void {
  const cabinY = wheelR + bodyH * 0.85 + cabinH * 0.45;
  const glass = glassMat();
  const pillar = new THREE.MeshStandardMaterial({ color: paint.color.clone().offsetHSL(0, 0, -0.06), roughness: 0.5 });

  // Opaque cabin shell (sides + rear bulk) under the roof
  const shell = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.8, cabinH * 0.55, cabinL * 0.92), paint);
  shell.position.set(0, cabinY - cabinH * 0.12, cabinZ);
  g.add(shell);

  // Solid roof — must read clearly from behind
  const roof = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.76, 0.12, cabinL * 0.88), paint);
  roof.position.set(0, cabinY + cabinH * 0.42, cabinZ - 0.02);
  roof.castShadow = true;
  g.add(roof);

  // Roof rails
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, cabinL * 0.82), pillar);
    rail.position.set(side * bodyW * 0.34, cabinY + cabinH * 0.5, cabinZ);
    g.add(rail);
  }

  // A / C pillars
  for (const side of [-1, 1]) {
    const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, cabinH * 0.95, 0.14), pillar);
    aPillar.position.set(side * bodyW * 0.36, cabinY, cabinZ + cabinL * 0.38);
    aPillar.rotation.x = -0.2;
    g.add(aPillar);
    const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.1, cabinH * 0.9, 0.16), pillar);
    cPillar.position.set(side * bodyW * 0.36, cabinY, cabinZ - cabinL * 0.38);
    g.add(cPillar);
  }

  // Windshield (front)
  const wind = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.68, cabinH * 0.72, 0.06), glass);
  wind.position.set(0, cabinY + 0.02, cabinZ + cabinL * 0.42);
  wind.rotation.x = -0.48;
  g.add(wind);

  // Rear glass
  const rear = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.66, cabinH * 0.62, 0.06), glass);
  rear.position.set(0, cabinY + 0.04, cabinZ - cabinL * 0.42);
  rear.rotation.x = 0.35;
  g.add(rear);

  // Side windows
  for (const side of [-1, 1]) {
    const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, cabinH * 0.55, cabinL * 0.55), glass);
    sideGlass.position.set(side * bodyW * 0.4, cabinY + 0.06, cabinZ + 0.02);
    g.add(sideGlass);
  }
}

/** Arcade-soft vehicle group for player and traffic. */
export function createVehicle(variant: CarVariant, color: string): THREE.Group {
  const g = new THREE.Group();
  g.name = `car-${variant}`;
  const paint = bodyMat(color);
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a343c, roughness: 0.65 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe8eef2, metalness: 0.55, roughness: 0.3 });
  const black = new THREE.MeshStandardMaterial({ color: 0x1e262c, roughness: 0.85 });

  let bodyL = 4.4;
  let bodyW = 1.85;
  let bodyH = 0.55;
  let cabinH = 0.62;
  let cabinL = 1.65;
  let cabinZ = -0.12;
  let wheelZ = 1.35;
  let wheelR = 0.42;

  switch (variant) {
    case 'van':
      bodyL = 4.6;
      bodyH = 0.7;
      cabinH = 1.05;
      cabinL = 2.2;
      cabinZ = 0.05;
      wheelZ = 1.25;
      break;
    case 'truck':
      bodyL = 5.0;
      bodyW = 2.0;
      bodyH = 0.65;
      cabinH = 0.85;
      cabinL = 1.35;
      cabinZ = 0.85;
      wheelZ = 1.4;
      wheelR = 0.48;
      break;
    case 'slow':
      bodyL = 3.6;
      bodyW = 1.7;
      bodyH = 0.5;
      cabinH = 0.58;
      cabinL = 1.45;
      wheelZ = 1.1;
      wheelR = 0.38;
      break;
    case 'sedan':
      bodyL = 4.5;
      cabinH = 0.64;
      cabinL = 1.75;
      cabinZ = -0.05;
      break;
    case 'sport':
      bodyL = 4.55;
      bodyH = 0.48;
      cabinH = 0.58;
      cabinL = 1.5;
      cabinZ = -0.18;
      wheelR = 0.44;
      break;
    default: {
      const _e: never = variant;
      void _e;
    }
  }

  const under = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.92, 0.12, bodyL * 0.95), black);
  under.position.y = wheelR * 0.55;
  g.add(under);

  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), paint);
  body.position.y = wheelR + bodyH * 0.45;
  body.castShadow = true;
  g.add(body);

  // Hood / deck lids (opaque body panels)
  const hood = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.88, 0.08, bodyL * 0.28), paint);
  hood.position.set(0, wheelR + bodyH * 0.95, bodyL * 0.28);
  g.add(hood);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.86, 0.08, bodyL * 0.22), paint);
  trunk.position.set(0, wheelR + bodyH * 0.92, -bodyL * 0.32);
  g.add(trunk);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.92, bodyH * 0.55, 0.35), paint);
  nose.position.set(0, wheelR + bodyH * 0.35, bodyL * 0.48);
  g.add(nose);

  addCabin(g, paint, bodyW, wheelR, bodyH, cabinH, cabinL, cabinZ);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.5, 0.24, 0.1), dark);
  grille.position.set(0, wheelR + 0.35, bodyL * 0.52);
  g.add(grille);
  const frontChrome = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.7, 0.05, 0.07), chrome);
  frontChrome.position.set(0, wheelR + 0.2, bodyL * 0.53);
  g.add(frontChrome);

  const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.2), paint);
  mirrorL.position.set(-bodyW * 0.48, wheelR + bodyH + cabinH * 0.35, cabinZ + cabinL * 0.25);
  const mirrorR = mirrorL.clone();
  mirrorR.position.x *= -1;
  g.add(mirrorL, mirrorR);

  if (variant === 'sport') {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.85, 0.07, 0.28), paint);
    spoiler.position.set(0, wheelR + bodyH + cabinH * 0.55, -bodyL * 0.42);
    g.add(spoiler);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 1.02, 0.08, bodyL * 0.7), dark);
    skirt.position.set(0, wheelR * 0.7, 0);
    g.add(skirt);
  }

  if (variant === 'truck') {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.9, 0.4, 1.9), bodyMat(color));
    bed.position.set(0, wheelR + 0.58, -1.15);
    g.add(bed);
  }

  for (const side of [-1, 1]) {
    addWheel(g, side * (bodyW * 0.48), wheelZ, wheelR);
    addWheel(g, side * (bodyW * 0.48), -wheelZ, wheelR);
    const lightF = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xaa8844, emissiveIntensity: 0.85 }),
    );
    lightF.position.set(side * bodyW * 0.34, wheelR + 0.4, bodyL * 0.52);
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
