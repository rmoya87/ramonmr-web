import * as THREE from 'three';
const glassMat = () => new THREE.MeshPhysicalMaterial({
    color: 0x1e3a4c,
    metalness: 0.15,
    roughness: 0.12,
    transmission: 0.55,
    thickness: 0.4,
    transparent: true,
    opacity: 0.88,
});
function bodyMat(color) {
    return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.42,
        roughness: 0.32,
    });
}
function addWheel(group, x, z, r) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.32, 18), new THREE.MeshStandardMaterial({ color: 0x1a1e22, roughness: 0.92 }));
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, r * 0.92, z);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.58, r * 0.58, 0.2, 14), new THREE.MeshStandardMaterial({ color: 0xc8d0d4, metalness: 0.75, roughness: 0.32 }));
    rim.rotation.z = Math.PI / 2;
    rim.position.copy(tire.position);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.22, r * 0.22, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0x3a4248, metalness: 0.5, roughness: 0.4 }));
    hub.rotation.z = Math.PI / 2;
    hub.position.copy(tire.position);
    group.add(tire, rim, hub);
}
/** Arcade-soft vehicle group for player and traffic. */
export function createVehicle(variant, color) {
    const g = new THREE.Group();
    g.name = `car-${variant}`;
    const paint = bodyMat(color);
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a2228, roughness: 0.7 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dee2, metalness: 0.85, roughness: 0.25 });
    const black = new THREE.MeshStandardMaterial({ color: 0x111518, roughness: 0.85 });
    let bodyL = 4.4;
    let bodyW = 1.85;
    let bodyH = 0.55;
    let cabinH = 0.55;
    let cabinL = 1.6;
    let cabinZ = -0.15;
    let wheelZ = 1.35;
    let wheelR = 0.42;
    switch (variant) {
        case 'van':
            bodyL = 4.6;
            bodyH = 0.7;
            cabinH = 0.95;
            cabinL = 2.2;
            cabinZ = 0.1;
            wheelZ = 1.25;
            break;
        case 'truck':
            bodyL = 5.0;
            bodyW = 2.0;
            bodyH = 0.65;
            cabinH = 0.75;
            cabinL = 1.3;
            cabinZ = 0.85;
            wheelZ = 1.4;
            wheelR = 0.48;
            break;
        case 'slow':
            bodyL = 3.6;
            bodyW = 1.7;
            bodyH = 0.5;
            cabinH = 0.5;
            cabinL = 1.4;
            wheelZ = 1.1;
            wheelR = 0.38;
            break;
        case 'sedan':
            bodyL = 4.5;
            cabinL = 1.7;
            cabinZ = -0.05;
            break;
        case 'sport':
            bodyL = 4.55;
            bodyH = 0.46;
            cabinH = 0.46;
            cabinL = 1.4;
            cabinZ = -0.22;
            wheelR = 0.44;
            break;
        default: {
            const _e = variant;
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
    // Nose taper / bumper lip
    const nose = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.92, bodyH * 0.55, 0.35), paint);
    nose.position.set(0, wheelR + bodyH * 0.35, bodyL * 0.48);
    g.add(nose);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.78, cabinH, cabinL), paint);
    cabin.position.set(0, wheelR + bodyH * 0.85 + cabinH * 0.45, cabinZ);
    g.add(cabin);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.72, cabinH * 0.72, cabinL * 0.92), glassMat());
    glass.position.copy(cabin.position);
    glass.position.y += 0.02;
    g.add(glass);
    // Windshield slant cue
    const wind = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.7, cabinH * 0.55, 0.08), glassMat());
    wind.position.set(0, cabin.position.y + 0.05, cabinZ + cabinL * 0.42);
    wind.rotation.x = -0.45;
    g.add(wind);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.5, 0.24, 0.1), dark);
    grille.position.set(0, wheelR + 0.35, bodyL * 0.52);
    g.add(grille);
    const frontChrome = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.7, 0.05, 0.07), chrome);
    frontChrome.position.set(0, wheelR + 0.2, bodyL * 0.53);
    g.add(frontChrome);
    const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.18), black);
    mirrorL.position.set(-bodyW * 0.42, wheelR + bodyH + 0.15, cabinZ + cabinL * 0.2);
    const mirrorR = mirrorL.clone();
    mirrorR.position.x *= -1;
    g.add(mirrorL, mirrorR);
    if (variant === 'sport') {
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.85, 0.06, 0.28), paint);
        spoiler.position.set(0, wheelR + bodyH + cabinH * 0.35, -bodyL * 0.42);
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
        const lightF = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0x886622, emissiveIntensity: 0.6 }));
        lightF.position.set(side * bodyW * 0.34, wheelR + 0.4, bodyL * 0.52);
        lightF.userData.kind = 'head';
        g.add(lightF);
        const lightR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshStandardMaterial({ color: 0xe04030, emissive: 0x441010, emissiveIntensity: 0.4 }));
        lightR.position.set(side * bodyW * 0.34, wheelR + 0.4, -bodyL * 0.48);
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
        if (obj.userData.kind === 'head' || m.color.getHex() === 0xfff2c0) {
            m.emissive.setHex(on ? 0xaa8844 : 0x222211);
            m.emissiveIntensity = on ? 1.35 : 0.25;
        }
        if (obj.userData.kind === 'tail' || m.color.getHex() === 0xe04030) {
            m.emissive.setHex(brake ? 0xff2200 : 0x441010);
            m.emissiveIntensity = brake ? 1.8 : 0.45;
        }
    });
}
