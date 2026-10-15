import * as THREE from 'three';
import { LOOK } from '../../look.js';
import { createVehicle, setVehicleLights } from './Vehicles.js';

export class GarageWorld {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(45, 1, 0.2, 80);
  private car: THREE.Group;
  private readonly hemi: THREE.HemisphereLight;
  private readonly key: THREE.DirectionalLight;

  constructor() {
    this.scene.background = new THREE.Color(0x1a2834);
    this.scene.fog = new THREE.Fog(0x1a2834, 18, 45);

    this.hemi = new THREE.HemisphereLight(0xa8c0d0, 0x2a343c, 0.7);
    this.key = new THREE.DirectionalLight(0xfff0d0, 1.2);
    this.key.position.set(6, 10, 4);
    this.scene.add(this.hemi, this.key);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: 0x3a454c, roughness: 0.85 }),
    );
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Checker accents
    for (let x = -8; x < 8; x += 2) {
      for (let z = -8; z < 8; z += 2) {
        if (((x + z) / 2) % 2 === 0) continue;
        const tile = new THREE.Mesh(
          new THREE.PlaneGeometry(1.9, 1.9),
          new THREE.MeshStandardMaterial({ color: 0x505b61, roughness: 0.9 }),
        );
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x + 1, 0.01, z + 1);
        this.scene.add(tile);
      }
    }

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(32, 6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x333f48 }),
    );
    back.position.set(0, 3, 14);
    this.scene.add(back);

    const lamp = new THREE.PointLight(0xfff6d5, 0.8, 20);
    lamp.position.set(0, 5, 0);
    this.scene.add(lamp);

    this.car = createVehicle('sport', '#c23a2b');
    this.scene.add(this.car);
  }

  update(opts: { angle: number; zoom: number; color: string; hood: boolean; lights: boolean; aspect: number }): void {
    if (this.car.userData.color !== opts.color) {
      this.scene.remove(this.car);
      this.car = createVehicle('sport', opts.color);
      this.car.userData.color = opts.color;
      this.scene.add(this.car);
    }
    setVehicleLights(this.car, opts.lights, false);
    this.car.rotation.y = opts.angle;

    this.camera.aspect = opts.aspect;
    this.camera.fov = opts.aspect < 1 ? 52 : 42;
    this.camera.position.set(Math.sin(opts.angle) * opts.zoom, 3.2, Math.cos(opts.angle) * opts.zoom);
    this.camera.lookAt(0, opts.aspect < 1 ? 1.6 : 0.9, 0);
    this.camera.updateProjectionMatrix();

    // Subtle LOOK grade
    this.hemi.color.set(LOOK.sun);
    void opts.hood;
  }

  dispose(): void {
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m.dispose();
      }
    });
  }
}
