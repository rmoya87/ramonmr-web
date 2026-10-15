import * as THREE from 'three';
/** Opaque “glass” — never transparent (transparency showed cabin seams). */
function glassMat() {
    return new THREE.MeshStandardMaterial({
        color: 0x1a3040,
        metalness: 0.35,
        roughness: 0.18,
        emissive: 0x0a1820,
        emissiveIntensity: 0.2,
    });
}
function bodyMat(color) {
    const c = new THREE.Color(color);
    c.offsetHSL(0, 0.02, 0.1);
    return new THREE.MeshStandardMaterial({
        color: c,
        metalness: 0.08,
        roughness: 0.48,
        emissive: c.clone().multiplyScalar(0.05),
        emissiveIntensity: 0.22,
    });
}
function addWheel(group, x, z, r) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.36, 14), new THREE.MeshStandardMaterial({ color: 0x1a1e22, roughness: 0.92 }));
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, r * 0.92, z);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.24, 10), new THREE.MeshStandardMaterial({ color: 0xd8dee4, metalness: 0.4, roughness: 0.35 }));
    rim.rotation.z = Math.PI / 2;
    rim.position.copy(tire.position);
    group.add(tire, rim);
}
/**
 * Single sealed volume stack: every panel is opaque and overlaps neighbors
 * so the chase camera never sees “inside” through seams.
 */
export function createVehicle(variant, color) {
    const g = new THREE.Group();
    g.name = `car-${variant}`;
    const paint = bodyMat(color);
    const dark = new THREE.MeshStandardMaterial({ color: 0x141a1e, roughness: 0.85 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xe4eaee, metalness: 0.5, roughness: 0.32 });
    const glass = glassMat();
    let bodyL = 4.4;
    let bodyW = 1.9;
    let bodyH = 0.62;
    let cabinH = 0.62;
    let cabinL = 1.85;
    let cabinZ = -0.08;
    let wheelZ = 1.35;
    let wheelR = 0.42;
    switch (variant) {
        case 'van':
            bodyL = 4.7;
            bodyH = 0.78;
            cabinH = 1.05;
            cabinL = 2.3;
            cabinZ = 0.05;
            wheelZ = 1.25;
            break;
        case 'truck':
            bodyL = 5.0;
            bodyW = 2.05;
            bodyH = 0.72;
            cabinH = 0.88;
            cabinL = 1.45;
            cabinZ = 0.9;
            wheelZ = 1.4;
            wheelR = 0.48;
            break;
        case 'slow':
            bodyL = 3.7;
            bodyW = 1.75;
            bodyH = 0.55;
            cabinH = 0.58;
            cabinL = 1.55;
            wheelZ = 1.1;
            wheelR = 0.38;
            break;
        case 'sedan':
            bodyL = 4.55;
            cabinH = 0.64;
            cabinL = 1.95;
            break;
        case 'sport':
            bodyL = 4.5;
            bodyH = 0.55;
            cabinH = 0.56;
            cabinL = 1.7;
            cabinZ = -0.12;
            wheelR = 0.44;
            break;
        default: {
            const _e = variant;
            void _e;
        }
    }
    const floorY = wheelR * 0.5;
    const bodyY = wheelR + bodyH * 0.48;
    const cabinY = wheelR + bodyH * 0.92 + cabinH * 0.42;
    // One continuous underbody (slightly oversized to seal wheel arches visually).
    const floor = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 1.02, 0.22, bodyL * 1.02), dark);
    floor.position.y = floorY;
    g.add(floor);
    // Main hull — oversized so overlays never leave a crack.
    const hull = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), paint);
    hull.position.y = bodyY;
    hull.castShadow = true;
    g.add(hull);
    // Solid cabin block (opaque fill — this is the volume you used to see into).
    const cabinFill = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.9, cabinH, cabinL), paint);
    cabinFill.position.set(0, cabinY, cabinZ);
    cabinFill.castShadow = true;
    g.add(cabinFill);
    // Roof slab sits on top of the fill (overlap ~4 cm).
    const roof = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.92, 0.22, cabinL * 1.02), paint);
    roof.position.set(0, cabinY + cabinH * 0.42, cabinZ);
    g.add(roof);
    // Rear / front cabin walls (opaque bulkheads).
    const rearWall = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.88, cabinH * 0.95, 0.2), paint);
    rearWall.position.set(0, cabinY, cabinZ - cabinL * 0.48);
    g.add(rearWall);
    const frontWall = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.88, cabinH * 0.9, 0.18), paint);
    frontWall.position.set(0, cabinY, cabinZ + cabinL * 0.48);
    g.add(frontWall);
    // Opaque window plates glued on the outside (dark paint, not see-through).
    const wind = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.72, cabinH * 0.55, 0.1), glass);
    wind.position.set(0, cabinY + 0.04, cabinZ + cabinL * 0.5);
    wind.rotation.x = -0.28;
    g.add(wind);
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.7, cabinH * 0.5, 0.1), glass);
    rearGlass.position.set(0, cabinY + 0.05, cabinZ - cabinL * 0.5);
    rearGlass.rotation.x = 0.22;
    g.add(rearGlass);
    for (const side of [-1, 1]) {
        const sideG = new THREE.Mesh(new THREE.BoxGeometry(0.1, cabinH * 0.48, cabinL * 0.62), glass);
        sideG.position.set(side * bodyW * 0.46, cabinY + 0.04, cabinZ);
        g.add(sideG);
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, cabinH * 0.95, 0.16), paint);
        pillar.position.set(side * bodyW * 0.42, cabinY, cabinZ - cabinL * 0.35);
        g.add(pillar);
    }
    const grille = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.5, 0.24, 0.12), dark);
    grille.position.set(0, wheelR + 0.38, bodyL * 0.5);
    g.add(grille);
    const lip = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.72, 0.06, 0.08), chrome);
    lip.position.set(0, wheelR + 0.22, bodyL * 0.52);
    g.add(lip);
    for (const side of [-1, 1]) {
        const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.2), paint);
        mirror.position.set(side * bodyW * 0.52, cabinY - 0.02, cabinZ + cabinL * 0.28);
        g.add(mirror);
    }
    if (variant === 'sport') {
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.9, 0.1, 0.28), paint);
        spoiler.position.set(0, cabinY + cabinH * 0.45, -bodyL * 0.42);
        g.add(spoiler);
    }
    if (variant === 'truck') {
        const bed = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.92, 0.5, 1.9), paint);
        bed.position.set(0, wheelR + 0.62, -1.15);
        g.add(bed);
    }
    for (const side of [-1, 1]) {
        addWheel(g, side * (bodyW * 0.48), wheelZ, wheelR);
        addWheel(g, side * (bodyW * 0.48), -wheelZ, wheelR);
        const lightF = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xaa8844, emissiveIntensity: 0.85 }));
        lightF.position.set(side * bodyW * 0.34, wheelR + 0.42, bodyL * 0.5);
        lightF.userData.kind = 'head';
        g.add(lightF);
        const lightR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), new THREE.MeshStandardMaterial({ color: 0xff5a48, emissive: 0x661818, emissiveIntensity: 0.55 }));
        lightR.position.set(side * bodyW * 0.34, wheelR + 0.42, -bodyL * 0.48);
        lightR.userData.kind = 'tail';
        g.add(lightR);
    }
    return g;
}
export function setVehicleLights(group, on, brake) {
    group.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh))
            return;
        const m = obj.material;
        if (!m || !m.emissive)
            return;
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
