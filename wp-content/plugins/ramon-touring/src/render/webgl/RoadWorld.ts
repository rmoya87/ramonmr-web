import * as THREE from 'three';
import { BIOMES, effectiveNight } from '../../game/EnvironmentManager.js';
import { cameraPose } from '../../game/CameraController.js';
import { LOOK } from '../../look.js';
import type { QualitySettings } from '../../game/PerformanceManager.js';
import type { RunState } from '../../game/types.js';
import type { EnvironmentId, WeatherId } from '../../game/config.js';
import { curve, depthPresence, inExitClearance, mirrorChaseProjection, ramp, roadYaw } from './path.js';
import { PropField } from './Props.js';
import { createVehicle, setVehicleLights, type CarVariant } from './Vehicles.js';

export type RoadRenderOpts = {
  color: string;
  camera: number;
  brake: boolean;
  lights: boolean;
  environment: EnvironmentId;
  weather: WeatherId;
  quality: QualitySettings;
  reduceEffects?: boolean;
  sectionLabels: string[];
};

function hex(c: string): number {
  return new THREE.Color(c).getHex();
}

/** Build a flat ribbon strip along local Z with lateral center X samples. */
function buildRibbon(centers: { x: number; z: number }[], halfW: number, y: number): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    const next = centers[Math.min(centers.length - 1, i + 1)];
    const dx = next.x - c.x;
    const dz = next.z - c.z || 1;
    const len = Math.hypot(dx, dz) || 1;
    const nx = (-dz / len) * halfW;
    const nz = (dx / len) * halfW;
    positions.push(c.x + nx, y, c.z + nz, c.x - nx, y, c.z - nz);
  }
  for (let i = 0; i < centers.length - 1; i++) {
    const a = i * 2;
    indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildDashes(
  centers: { x: number; z: number }[],
  halfW: number,
  y: number,
  on = 2,
  off = 1,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  let seg = 0;
  let vertBase = 0;
  for (let i = 0; i < centers.length - 1; i++) {
    const phase = seg % (on + off);
    seg++;
    if (phase >= on) continue;
    const c = centers[i];
    const next = centers[i + 1];
    const dx = next.x - c.x;
    const dz = next.z - c.z || 1;
    const len = Math.hypot(dx, dz) || 1;
    const nx = (-dz / len) * halfW;
    const nz = (dx / len) * halfW;
    positions.push(
      c.x + nx, y, c.z + nz,
      c.x - nx, y, c.z - nz,
      next.x + nx, y, next.z + nz,
      next.x - nx, y, next.z - nz,
    );
    indices.push(vertBase, vertBase + 2, vertBase + 1, vertBase + 1, vertBase + 2, vertBase + 3);
    vertBase += 4;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeAsphaltTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#5c646c';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const n = 70 + ((i * 37) % 40);
    g.fillStyle = `rgb(${n},${n + 2},${n + 4})`;
    g.fillRect((i * 13) % 128, (i * 29) % 128, 1 + (i % 2), 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 40);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class RoadWorld {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(50, 1, 0.2, 560);
  private readonly hemi: THREE.HemisphereLight;
  private readonly sun: THREE.DirectionalLight;
  private readonly fill: THREE.DirectionalLight;
  private readonly roadGroup = new THREE.Group();
  private readonly skyDome: THREE.Mesh;
  private readonly sunDisc: THREE.Mesh;
  private readonly hills: THREE.Group;
  private readonly props = new PropField();
  private player: THREE.Group;
  private traffic = new Map<number, THREE.Group>();
  private roadMesh: THREE.Mesh | null = null;
  private vergeL: THREE.Mesh | null = null;
  private vergeR: THREE.Mesh | null = null;
  private skirt: THREE.Mesh | null = null;
  private water: THREE.Mesh | null = null;
  private rampMesh: THREE.Mesh | null = null;
  private chalkMesh: THREE.Mesh | null = null;
  private laneL: THREE.Mesh | null = null;
  private laneR: THREE.Mesh | null = null;
  private edgeL: THREE.Mesh | null = null;
  private edgeR: THREE.Mesh | null = null;
  private wearMesh: THREE.Mesh | null = null;
  private sign: THREE.Mesh | null = null;
  private playerShadow: THREE.Mesh;
  private lastRoadKey = '';
  private asphaltMat: THREE.MeshStandardMaterial;
  private chalkMat: THREE.MeshStandardMaterial;
  private groundMat: THREE.MeshStandardMaterial;
  private waterMat: THREE.MeshStandardMaterial;
  private wearMat: THREE.MeshStandardMaterial;

  constructor() {
    this.scene.fog = new THREE.FogExp2(0xd8e4e8, 0.009);
    this.hemi = new THREE.HemisphereLight(0xc8e0f0, 0x6a7a58, 0.95);
    this.sun = new THREE.DirectionalLight(0xffe2a8, 1.35);
    this.sun.position.set(45, 70, 25);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 180;
    this.sun.shadow.camera.left = -40;
    this.sun.shadow.camera.right = 40;
    this.sun.shadow.camera.top = 40;
    this.sun.shadow.camera.bottom = -20;
    this.sun.shadow.bias = -0.0008;
    this.fill = new THREE.DirectionalLight(0xa8c8e0, 0.4);
    this.fill.position.set(-30, 20, -10);
    this.scene.add(this.hemi, this.sun, this.fill);
    this.scene.add(this.roadGroup);
    this.scene.add(this.props.root);

    const skyGeo = new THREE.SphereGeometry(420, 32, 20);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor: { value: new THREE.Color(0x4a8ab8) },
        midColor: { value: new THREE.Color(0xa8d0e0) },
        botColor: { value: new THREE.Color(0xf0d8b0) },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 midColor;
        uniform vec3 botColor;
        varying vec3 vPos;
        void main() {
          float h = clamp(vPos.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(botColor, midColor, smoothstep(0.0, 0.45, h));
          col = mix(col, topColor, smoothstep(0.4, 1.0, h));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);

    this.sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(7, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffe2a8, fog: false }),
    );
    this.scene.add(this.sunDisc);

    this.hills = new THREE.Group();
    for (let band = 0; band < 4; band++) {
      const shape = new THREE.Shape();
      shape.moveTo(-220, 0);
      for (let i = 0; i <= 48; i++) {
        const x = -220 + (i / 48) * 440;
        const y = 7 + band * 3.5 + Math.sin(i * 0.5 + band * 1.3) * (6 - band) + Math.sin(i * 1.4) * 2.2;
        shape.lineTo(x, y);
      }
      shape.lineTo(220, 0);
      shape.closePath();
      const mesh = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshStandardMaterial({ color: 0x5a7a54, flatShading: true, side: THREE.DoubleSide }),
      );
      mesh.position.set(0, -2 + band * 0.35, 80 + band * 50);
      mesh.scale.set(1.15 + band * 0.12, 1, 1);
      this.hills.add(mesh);
    }
    this.scene.add(this.hills);

    const asphaltMap = typeof document !== 'undefined' ? makeAsphaltTexture() : null;
    this.asphaltMat = new THREE.MeshStandardMaterial({
      color: hex(LOOK.asphalt.day),
      map: asphaltMap,
      roughness: 0.86,
      side: THREE.DoubleSide,
    });
    this.chalkMat = new THREE.MeshStandardMaterial({
      color: hex(LOOK.chalk),
      roughness: 0.55,
      emissive: hex(LOOK.chalk),
      emissiveIntensity: 0.12,
      side: THREE.DoubleSide,
    });
    this.groundMat = new THREE.MeshStandardMaterial({ color: 0x6a8a5e, roughness: 0.95, side: THREE.DoubleSide });
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x3a8a9a,
      roughness: 0.22,
      metalness: 0.28,
      side: THREE.DoubleSide,
    });
    this.wearMat = new THREE.MeshStandardMaterial({
      color: hex(LOOK.asphalt.wear),
      roughness: 0.95,
      side: THREE.DoubleSide,
    });

    this.player = createVehicle('sport', '#c23a2b');
    this.scene.add(this.player);

    this.playerShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 }),
    );
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.playerShadow.position.y = 0.03;
    this.scene.add(this.playerShadow);
  }

  private atmosphere(s: RunState, env: EnvironmentId, weather: WeatherId): void {
    const night = effectiveNight(env) || env === 'night';
    const biome = BIOMES[Math.floor(s.d / 1600) % BIOMES.length];
    let skyTop = biome.sky[0];
    let skyMid = biome.sky[1];
    let skyBot = biome.sky[2];
    let ground = biome.ground[0];
    if (night) {
      skyTop = '#0a1828';
      skyMid = '#152838';
      skyBot = '#2a3238';
      ground = '#2a3238';
    } else if (weather === 'sunset') {
      skyTop = '#3a5070';
      skyMid = '#c07050';
      skyBot = '#e8a878';
    } else if (weather === 'cloudy' || weather === 'rain') {
      skyTop = '#6a8494';
      skyMid = '#8aa0a8';
      skyBot = '#b0b8b0';
    } else if (env === 'beach') {
      skyTop = '#4aa8c8';
      skyMid = '#8ecce0';
      skyBot = '#f0e0c0';
      ground = LOOK.sand;
    }

    this.scene.background = new THREE.Color(skyMid);
    const fogCol = new THREE.Color(biome.haze.slice(0, 7) || '#e8dcc8');
    (this.scene.fog as THREE.FogExp2).color.copy(fogCol);
    (this.scene.fog as THREE.FogExp2).density = night ? 0.017 : weather === 'fog' ? 0.015 : 0.0088;
    this.hemi.color.set(skyTop);
    this.hemi.groundColor.set(ground);
    this.hemi.intensity = night ? 0.45 : 1.25;
    this.sun.intensity = night ? 0.3 : weather === 'cloudy' || weather === 'rain' ? 0.95 : 1.65;
    this.sun.color.set(biome.sun || LOOK.sun);
    this.fill.intensity = night ? 0.25 : 0.65;
    this.groundMat.color.set(ground);
    this.asphaltMat.color.set(night ? LOOK.asphalt.night : LOOK.asphalt.day);
    this.waterMat.color.set(biome.water);

    const skyMat = this.skyDome.material as THREE.ShaderMaterial;
    skyMat.uniforms.topColor.value.set(skyTop);
    skyMat.uniforms.midColor.value.set(skyMid);
    skyMat.uniforms.botColor.value.set(skyBot);
    this.sunDisc.visible = !night;
    (this.sunDisc.material as THREE.MeshBasicMaterial).color.set(
      weather === 'sunset' ? 0xff9040 : hex(biome.sun || LOOK.sun),
    );
    this.sunDisc.position.set(90, 52, 170);

    this.hills.children.forEach((child, i) => {
      const m = child as THREE.Mesh;
      (m.material as THREE.MeshStandardMaterial).color.set(biome.ground[Math.min(2, i)] || ground);
      m.position.x = Math.sin(s.d * 0.002 + i) * 10;
    });
  }

  private rebuildRoad(s: RunState, drawDistance: number, env: EnvironmentId): void {
    const key = `${Math.floor(s.d / 2)}:${Math.floor(s.fork)}:${env}:${s.branch ? 1 : 0}`;
    if (key === this.lastRoadKey) return;
    this.lastRoadKey = key;

    for (const m of [
      this.roadMesh,
      this.vergeL,
      this.vergeR,
      this.skirt,
      this.water,
      this.rampMesh,
      this.chalkMesh,
      this.laneL,
      this.laneR,
      this.edgeL,
      this.edgeR,
      this.wearMesh,
    ]) {
      if (m) {
        this.roadGroup.remove(m);
        m.geometry.dispose();
      }
    }

    const base = curve(s.d);
    const centers: { x: number; z: number }[] = [];
    const step = 2.2;
    for (let z = -8; z <= drawDistance; z += step) {
      centers.push({ x: curve(s.d + z) - base, z });
    }

    this.roadMesh = new THREE.Mesh(buildRibbon(centers, 6.2, 0.02), this.asphaltMat);
    this.roadMesh.receiveShadow = true;
    this.vergeL = new THREE.Mesh(
      buildRibbon(centers.map((c) => ({ x: c.x - 6.55, z: c.z })), 0.75, 0.035),
      this.groundMat,
    );
    this.vergeR = new THREE.Mesh(
      buildRibbon(centers.map((c) => ({ x: c.x + 6.55, z: c.z })), 0.75, 0.035),
      this.groundMat,
    );
    this.skirt = new THREE.Mesh(buildRibbon(centers, 75, -0.1), this.groundMat);
    this.skirt.receiveShadow = true;
    this.edgeL = new THREE.Mesh(
      buildRibbon(centers.map((c) => ({ x: c.x - 5.9, z: c.z })), 0.13, 0.05),
      this.chalkMat,
    );
    this.edgeR = new THREE.Mesh(
      buildRibbon(centers.map((c) => ({ x: c.x + 5.9, z: c.z })), 0.13, 0.05),
      this.chalkMat,
    );
    this.wearMesh = new THREE.Mesh(
      buildRibbon(centers.map((c) => ({ x: c.x - 2.1, z: c.z })), 0.6, 0.025),
      this.wearMat,
    );
    this.laneL = new THREE.Mesh(
      buildDashes(centers.map((c) => ({ x: c.x - 2.05, z: c.z })), 0.075, 0.045),
      this.chalkMat,
    );
    this.laneR = new THREE.Mesh(
      buildDashes(centers.map((c) => ({ x: c.x + 2.05, z: c.z })), 0.075, 0.045),
      this.chalkMat,
    );
    this.chalkMesh = new THREE.Mesh(buildDashes(centers, 0.1, 0.05, 2, 1), this.chalkMat);

    const beach = env === 'beach' || env === 'coast' || Math.floor(s.d / 1600) % BIOMES.length === 0;
    if (beach) {
      this.water = new THREE.Mesh(
        buildRibbon(
          centers.filter((c) => c.z > 30).map((c) => ({ x: c.x - 40, z: c.z })),
          14,
          -0.05,
        ),
        this.waterMat,
      );
    } else this.water = null;

    const rampCenters: { x: number; z: number }[] = [];
    for (let z = -6; z <= drawDistance; z += step) {
      const world = s.d + z;
      const t = world - s.fork;
      if (t > 0 && t < 310) {
        rampCenters.push({ x: curve(world) - base + ramp(t), z });
      }
    }
    this.rampMesh = rampCenters.length > 2 ? new THREE.Mesh(buildRibbon(rampCenters, 2.2, 0.038), this.asphaltMat) : null;

    this.roadGroup.add(
      this.skirt,
      this.roadMesh,
      this.wearMesh,
      this.vergeL,
      this.vergeR,
      this.edgeL,
      this.edgeR,
      this.laneL,
      this.laneR,
      this.chalkMesh,
    );
    if (this.water) this.roadGroup.add(this.water);
    if (this.rampMesh) this.roadGroup.add(this.rampMesh);
    void inExitClearance;
  }

  private syncSign(s: RunState, labels: string[]): void {
    const signZ = s.fork - s.d - 100;
    if (signZ < 8 || signZ > 260) {
      if (this.sign) this.sign.visible = false;
      return;
    }
    if (!this.sign) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      this.sign = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 2.5), mat);
      this.sign.userData.canvas = canvas;
      this.sign.userData.tex = tex;
      this.scene.add(this.sign);
    }
    this.sign.visible = true;
    const canvas = this.sign.userData.canvas as HTMLCanvasElement;
    const tex = this.sign.userData.tex as THREE.CanvasTexture;
    const tc = canvas.getContext('2d')!;
    tc.fillStyle = LOOK.sign.face;
    tc.fillRect(0, 0, 512, 160);
    tc.strokeStyle = LOOK.sign.ink;
    tc.lineWidth = 6;
    tc.strokeRect(8, 8, 496, 144);
    tc.fillStyle = LOOK.sign.ink;
    tc.textAlign = 'center';
    tc.textBaseline = 'middle';
    const name = (labels[s.exit] || '').trim();
    tc.font = '700 36px sans-serif';
    tc.fillText(name, 256, 58);
    tc.font = '600 28px sans-serif';
    tc.fillText(`↗  ${Math.max(0, Math.round(s.fork - s.d))} m`, 256, 110);
    tex.needsUpdate = true;

    const base = curve(s.d);
    this.sign.position.set(curve(s.d + signZ) - base + 4.2, 5.2, signZ);
    this.sign.lookAt(this.camera.position.x, 5.2, this.camera.position.z);
  }

  update(s: RunState, opts: RoadRenderOpts, aspect: number): void {
    this.atmosphere(s, opts.environment, opts.weather);
    this.rebuildRoad(s, opts.quality.drawDistance, opts.environment);
    this.sun.castShadow = opts.quality.shadows;

    const path = s.branch ? ramp(s.d - s.fork) : 0;
    const px = s.x + path;
    const pose = cameraPose(s, path, opts.camera, aspect < 1);
    const lookZ = pose.target.z;
    const roadAhead = curve(s.d + lookZ) - curve(s.d);
    this.camera.aspect = aspect;
    this.camera.fov = 50 / Math.max(0.5, pose.fovMul / 0.68);
    this.camera.near = 0.2;
    this.camera.far = Math.max(420, opts.quality.drawDistance + 80);
    this.camera.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
    this.camera.lookAt(pose.target.x + roadAhead * 0.55, pose.target.y, pose.target.z);
    this.camera.updateProjectionMatrix();
    // Critical: chase-from-behind mirrors X; flip projection so ←/→ match the screen.
    mirrorChaseProjection(this.camera);
    this.skyDome.position.copy(this.camera.position);

    if (this.player.userData.color !== opts.color) {
      this.scene.remove(this.player);
      this.player = createVehicle('sport', opts.color);
      this.scene.add(this.player);
      this.player.userData.color = opts.color;
    }
    this.player.position.set(px, 0, 0.02);
    const roadBank = roadYaw(s.d, 0) * 0.35;
    this.player.rotation.y = -(s.yaw + roadBank);
    this.player.rotation.z = THREE.MathUtils.clamp(-s.vx * 0.01, -0.1, 0.1);
    setVehicleLights(this.player, opts.lights, opts.brake);
    this.playerShadow.position.set(px, 0.03, 0.02);
    this.playerShadow.scale.set(1 + Math.abs(s.vx) * 0.02, 1, 1.1);

    const seen = new Set<number>();
    const base = curve(s.d);
    const trafficFar = opts.quality.drawDistance * 0.72;
    let drawn = 0;
    for (const t of s.traffic) {
      const z = t.d - s.d;
      const presence = depthPresence(z, trafficFar, -14, 60, 16);
      if (presence < 0.03 || drawn >= opts.quality.maxTrafficDraw) continue;
      seen.add(t.id);
      let mesh = this.traffic.get(t.id);
      if (!mesh || mesh.userData.color !== t.color || mesh.userData.type !== t.type) {
        if (mesh) this.scene.remove(mesh);
        mesh = createVehicle((t.type as CarVariant) || 'sedan', t.color);
        mesh.userData.color = t.color;
        mesh.userData.type = t.type;
        this.traffic.set(t.id, mesh);
        this.scene.add(mesh);
      }
      const x = curve(s.d + z) - base + t.x;
      mesh.position.set(x, 0, z);
      // Follow the ribbon; lateral lane-change adds only a small yaw.
      const laneYaw = THREE.MathUtils.clamp((t.targetX - t.x) * 0.04, -0.12, 0.12);
      mesh.rotation.y = -(roadYaw(s.d, z) + laneYaw);
      const sc = 0.35 + 0.65 * presence;
      mesh.scale.set(sc, sc * (0.6 + 0.4 * presence), sc);
      mesh.visible = true;
      drawn++;
    }
    for (const [id, mesh] of this.traffic) {
      if (!seen.has(id)) mesh.visible = false;
    }

    if (!opts.reduceEffects) {
      this.props.sync(s, opts.environment, opts.quality.drawDistance, opts.quality.propStep);
    }
    this.syncSign(s, opts.sectionLabels);
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
