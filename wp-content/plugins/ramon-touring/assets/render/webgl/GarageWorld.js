import * as THREE from 'three';
import { LOOK } from '../../look.js';
import { createVehicle, setVehicleLights } from './Vehicles.js';
export class GarageWorld {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.2, 80);
        this.hoodGroup = new THREE.Group();
        this.flapMat = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.06, side: THREE.DoubleSide });
        this.hoodOpen = 0;
        this.scene.background = new THREE.Color(0x1a2834);
        this.scene.fog = new THREE.Fog(0x1a2834, 18, 45);
        this.hemi = new THREE.HemisphereLight(0xa8c0d0, 0x2a343c, 0.7);
        this.key = new THREE.DirectionalLight(0xfff0d0, 1.2);
        this.key.position.set(6, 10, 4);
        this.scene.add(this.hemi, this.key);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x3a454c, roughness: 0.85 }));
        floor.rotation.x = -Math.PI / 2;
        this.scene.add(floor);
        // Checker accents
        for (let x = -8; x < 8; x += 2) {
            for (let z = -8; z < 8; z += 2) {
                if (((x + z) / 2) % 2 === 0)
                    continue;
                const tile = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshStandardMaterial({ color: 0x505b61, roughness: 0.9 }));
                tile.rotation.x = -Math.PI / 2;
                tile.position.set(x + 1, 0.01, z + 1);
                this.scene.add(tile);
            }
        }
        const back = new THREE.Mesh(new THREE.BoxGeometry(32, 6, 0.3), new THREE.MeshStandardMaterial({ color: 0x333f48 }));
        back.position.set(0, 3, 14);
        this.scene.add(back);
        const lamp = new THREE.PointLight(0xfff6d5, 0.8, 20);
        lamp.position.set(0, 5, 0);
        this.scene.add(lamp);
        this.car = createVehicle('hatch', '#c23a2b');
        this.scene.add(this.car);
        // Hood: the body is one merged solid, so "open" shows an engine bay on the hood area and a
        // hinged panel (hinge at the windshield base) raised above it. Closed hides both.
        const bay = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.75), new THREE.MeshStandardMaterial({ color: 0x15191d, roughness: 0.85 }));
        bay.position.set(0, 0.73, 1.68);
        bay.rotation.x = 0.3; // follows the slope of the hood (0.76 at z 1.46 down to 0.55 at the nose)
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 0.5), new THREE.MeshStandardMaterial({ color: 0x8a949a, metalness: 0.5, roughness: 0.45 }));
        block.position.set(0, 0.85, 1.68);
        block.rotation.x = 0.3;
        this.flap = new THREE.Group();
        this.flap.position.set(0, 0.84, 1.14);
        const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 1.02), this.flapMat);
        panel.position.set(0, 0, 0.51);
        panel.castShadow = true;
        this.flap.add(panel);
        this.hoodGroup.add(bay, block, this.flap);
        this.hoodGroup.visible = false;
        this.scene.add(this.hoodGroup);
    }
    update(opts) {
        if (this.car.userData.color !== opts.color) {
            this.scene.remove(this.car);
            this.car = createVehicle('hatch', opts.color);
            this.car.userData.color = opts.color;
            this.scene.add(this.car);
        }
        setVehicleLights(this.car, opts.lights, false);
        // The camera orbits the car. Turning the car by the same angle cancelled the orbit, so the
        // side, front and hood views always showed the same face.
        this.car.rotation.y = 0;
        const paint = new THREE.Color(opts.color);
        paint.offsetHSL(0, 0.03, 0.09);
        this.flapMat.color.copy(paint);
        this.flapMat.emissive.copy(paint).multiplyScalar(0.12);
        this.flapMat.emissiveIntensity = 0.35;
        this.hoodOpen = opts.hood ? 1 : 0;
        this.hoodGroup.visible = opts.hood;
        this.flap.rotation.x = -1.05 * this.hoodOpen;
        this.camera.aspect = opts.aspect;
        this.camera.fov = opts.aspect < 1 ? 52 : 42;
        const dist = opts.aspect < 1 ? opts.zoom * 1.75 : opts.zoom; // tall screens: the car is wider than the view
        this.camera.position.set(Math.sin(opts.angle) * dist, 3.2, Math.cos(opts.angle) * dist);
        this.camera.lookAt(0, opts.aspect < 1 ? 1.6 : 0.9, 0);
        // Keep the car clear of the section page and the options panel: shift it left on wide
        // screens (page on the right) and down on tall ones (panels stacked above).
        const fw = opts.aspect * 1000;
        if (opts.aspect >= 1)
            this.camera.setViewOffset(fw, 1000, fw * 0.13, 0, fw, 1000);
        else
            this.camera.setViewOffset(fw, 1000, 0, -200, fw, 1000);
        this.camera.updateProjectionMatrix();
        // Subtle LOOK grade
        this.hemi.color.set(LOOK.sun);
    }
    dispose() {
        this.scene.traverse((o) => {
            if (o instanceof THREE.Mesh) {
                o.geometry.dispose();
                const m = o.material;
                if (Array.isArray(m))
                    m.forEach((x) => x.dispose());
                else
                    m.dispose();
            }
        });
    }
}
