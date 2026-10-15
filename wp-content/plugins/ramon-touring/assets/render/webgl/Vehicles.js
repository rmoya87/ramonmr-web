import * as THREE from 'three';
const glassMat = () => new THREE.MeshPhysicalMaterial({
    color: 0x1e3a4c,
    metalness: 0.1,
    roughness: 0.15,
    transmission: 0.55,
    thickness: 0.4,
    transparent: true,
    opacity: 0.85,
});
function bodyMat(color) {
    return new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        metalness: 0.35,
        roughness: 0.38,
    });
}
function addWheel(group, x, z, r) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.28, 16), new THREE.MeshStandardMaterial({ color: 0x1a1e22, roughness: 0.9 }));
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, r * 0.92, z);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0xc8d0d4, metalness: 0.7, roughness: 0.35 }));
    rim.rotation.z = Math.PI / 2;
    rim.position.copy(tire.position);
    group.add(tire, rim);
}
/** Arcade-soft vehicle group for player and traffic. */
export function createVehicle(variant, color) {
    const g = new THREE.Group();
    g.name = `car-${variant}`;
    const paint = bodyMat(color);
    const dark = new THREE.MeshStandardMaterial({ color: 0x1a2228, roughness: 0.7 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dee2, metalness: 0.85, roughness: 0.25 });
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
            bodyL = 4.5;
            bodyH = 0.48;
            cabinH = 0.48;
            cabinL = 1.45;
            cabinZ = -0.2;
            wheelR = 0.44;
            break;
        default: {
            const _e = variant;
            void _e;
        }
    }
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyL), paint);
    body.position.y = wheelR + bodyH * 0.45;
    body.castShadow = true;
    g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.78, cabinH, cabinL), paint);
    cabin.position.set(0, wheelR + bodyH * 0.85 + cabinH * 0.45, cabinZ);
    g.add(cabin);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.72, cabinH * 0.7, cabinL * 0.92), glassMat());
    glass.position.copy(cabin.position);
    glass.position.y += 0.02;
    g.add(glass);
    // Grille + chrome lips
    const grille = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.45, 0.22, 0.08), dark);
    grille.position.set(0, wheelR + 0.35, bodyL * 0.48);
    g.add(grille);
    const frontChrome = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.65, 0.05, 0.06), chrome);
    frontChrome.position.set(0, wheelR + 0.22, bodyL * 0.5);
    g.add(frontChrome);
    if (variant === 'truck') {
        const bed = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 0.9, 0.35, 1.8), bodyMat(color));
        bed.position.set(0, wheelR + 0.55, -1.2);
        g.add(bed);
    }
    for (const side of [-1, 1]) {
        addWheel(g, side * (bodyW * 0.48), wheelZ, wheelR);
        addWheel(g, side * (bodyW * 0.48), -wheelZ, wheelR);
        const lightF = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0x886622 }));
        lightF.position.set(side * bodyW * 0.35, wheelR + 0.4, bodyL * 0.5);
        g.add(lightF);
        const lightR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshStandardMaterial({ color: 0xe04030, emissive: 0x441010 }));
        lightR.position.set(side * bodyW * 0.35, wheelR + 0.4, -bodyL * 0.48);
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
        if (m.color.getHex() === 0xfff2c0 || m.color.getHex() === 0xe8e4c8) {
            m.emissive.setHex(on ? 0xaa8844 : 0x222211);
            m.emissiveIntensity = on ? 1.2 : 0.2;
        }
        if (m.color.getHex() === 0xe04030) {
            m.emissive.setHex(brake ? 0xff2200 : 0x441010);
            m.emissiveIntensity = brake ? 1.6 : 0.4;
        }
    });
}
