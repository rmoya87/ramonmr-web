import * as THREE from 'three';
import { BIOMES, effectiveNight } from '../../game/EnvironmentManager.js';
import { cameraPose } from '../../game/CameraController.js';
import { LOOK } from '../../look.js';
import { curve, inExitClearance, ramp } from './path.js';
import { PropField } from './Props.js';
import { createVehicle, setVehicleLights } from './Vehicles.js';
function hex(c) {
    return new THREE.Color(c).getHex();
}
/** Build a flat ribbon strip along local Z with lateral center X samples. */
function buildRibbon(centers, halfW, y) {
    const positions = [];
    const indices = [];
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
    // CCW when viewed from +Y so FrontSide faces the chase camera.
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
export class RoadWorld {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, 1, 0.2, 500);
        this.roadGroup = new THREE.Group();
        this.props = new PropField();
        this.traffic = new Map();
        this.roadMesh = null;
        this.vergeL = null;
        this.vergeR = null;
        this.skirt = null;
        this.water = null;
        this.rampMesh = null;
        this.chalkMesh = null;
        this.edgeL = null;
        this.edgeR = null;
        this.sign = null;
        this.lastRoadKey = '';
        this.scene.fog = new THREE.FogExp2(0xd8e4e8, 0.012);
        this.hemi = new THREE.HemisphereLight(0xc8e0f0, 0x6a7a58, 0.85);
        this.sun = new THREE.DirectionalLight(0xffe2a8, 1.1);
        this.sun.position.set(40, 60, 20);
        this.scene.add(this.hemi, this.sun);
        this.scene.add(this.roadGroup);
        this.scene.add(this.props.root);
        this.asphaltMat = new THREE.MeshStandardMaterial({
            color: hex(LOOK.asphalt.day),
            roughness: 0.92,
            side: THREE.DoubleSide,
        });
        this.chalkMat = new THREE.MeshStandardMaterial({
            color: hex(LOOK.chalk),
            roughness: 0.7,
            side: THREE.DoubleSide,
        });
        this.groundMat = new THREE.MeshStandardMaterial({ color: 0x6a8a5e, roughness: 1, side: THREE.DoubleSide });
        this.waterMat = new THREE.MeshStandardMaterial({
            color: 0x3a8a9a,
            roughness: 0.35,
            metalness: 0.2,
            side: THREE.DoubleSide,
        });
        this.player = createVehicle('sport', '#c23a2b');
        this.scene.add(this.player);
    }
    atmosphere(s, env, weather) {
        const night = effectiveNight(env) || env === 'night';
        const biome = BIOMES[Math.floor(s.d / 1600) % BIOMES.length];
        let skyTop = biome.sky[0];
        let ground = biome.ground[0];
        if (night) {
            skyTop = '#0a1828';
            ground = '#2a3238';
        }
        else if (weather === 'sunset')
            skyTop = '#c07050';
        else if (weather === 'cloudy' || weather === 'rain')
            skyTop = '#6a8494';
        else if (env === 'beach') {
            skyTop = '#4aa8c8';
            ground = LOOK.sand;
        }
        this.scene.background = new THREE.Color(skyTop);
        const fogCol = new THREE.Color(biome.haze.slice(0, 7) || '#e8dcc8');
        this.scene.fog.color.copy(fogCol);
        this.scene.fog.density = night ? 0.02 : 0.011;
        this.hemi.color.set(skyTop);
        this.hemi.groundColor.set(ground);
        this.hemi.intensity = night ? 0.35 : 0.9;
        this.sun.intensity = night ? 0.25 : 1.15;
        this.sun.color.set(biome.sun || LOOK.sun);
        this.groundMat.color.set(ground);
        this.asphaltMat.color.set(night ? LOOK.asphalt.night : LOOK.asphalt.day);
        this.waterMat.color.set(biome.water);
    }
    rebuildRoad(s, drawDistance, env) {
        const key = `${Math.floor(s.d / 3)}:${Math.floor(s.fork)}:${env}:${s.branch ? 1 : 0}`;
        if (key === this.lastRoadKey)
            return;
        this.lastRoadKey = key;
        for (const m of [
            this.roadMesh,
            this.vergeL,
            this.vergeR,
            this.skirt,
            this.water,
            this.rampMesh,
            this.chalkMesh,
            this.edgeL,
            this.edgeR,
        ]) {
            if (m) {
                this.roadGroup.remove(m);
                m.geometry.dispose();
            }
        }
        const base = curve(s.d);
        const centers = [];
        const step = 3;
        for (let z = -6; z <= drawDistance; z += step) {
            centers.push({ x: curve(s.d + z) - base, z });
        }
        this.roadMesh = new THREE.Mesh(buildRibbon(centers, 6.2, 0.02), this.asphaltMat);
        this.roadMesh.receiveShadow = true;
        this.vergeL = new THREE.Mesh(buildRibbon(centers.map((c) => ({ x: c.x - 6.5, z: c.z })), 0.55, 0.03), this.groundMat);
        this.vergeR = new THREE.Mesh(buildRibbon(centers.map((c) => ({ x: c.x + 6.5, z: c.z })), 0.55, 0.03), this.groundMat);
        this.skirt = new THREE.Mesh(buildRibbon(centers, 55, -0.08), this.groundMat);
        this.edgeL = new THREE.Mesh(buildRibbon(centers.map((c) => ({ x: c.x - 5.85, z: c.z })), 0.1, 0.045), this.chalkMat);
        this.edgeR = new THREE.Mesh(buildRibbon(centers.map((c) => ({ x: c.x + 5.85, z: c.z })), 0.1, 0.045), this.chalkMat);
        const beach = env === 'beach' || env === 'coast' || Math.floor(s.d / 1600) % BIOMES.length === 0;
        if (beach) {
            this.water = new THREE.Mesh(buildRibbon(centers.filter((c) => c.z > 40).map((c) => ({ x: c.x - 38, z: c.z })), 10, -0.04), this.waterMat);
        }
        else
            this.water = null;
        // Exit ramp ribbon
        const rampCenters = [];
        for (let z = -6; z <= drawDistance; z += step) {
            const world = s.d + z;
            const t = world - s.fork;
            if (t > 0 && t < 310) {
                rampCenters.push({ x: curve(world) - base + ramp(t), z });
            }
        }
        if (rampCenters.length > 2) {
            this.rampMesh = new THREE.Mesh(buildRibbon(rampCenters, 2.1, 0.035), this.asphaltMat);
        }
        else
            this.rampMesh = null;
        // Lane dashes as thin chalk ribbons near center
        const dashCenters = centers.filter((_, i) => i % 3 < 2);
        this.chalkMesh = new THREE.Mesh(buildRibbon(dashCenters, 0.08, 0.04), this.chalkMat);
        this.roadGroup.add(this.skirt, this.roadMesh, this.vergeL, this.vergeR, this.edgeL, this.edgeR, this.chalkMesh);
        if (this.water)
            this.roadGroup.add(this.water);
        if (this.rampMesh)
            this.roadGroup.add(this.rampMesh);
        // Clear right verge markers visually when in exit — handled in props
        void inExitClearance;
    }
    syncSign(s, labels) {
        const signZ = s.fork - s.d - 100;
        if (signZ < 8 || signZ > 260) {
            if (this.sign)
                this.sign.visible = false;
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
        const canvas = this.sign.userData.canvas;
        const tex = this.sign.userData.tex;
        const tc = canvas.getContext('2d');
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
        const x = curve(s.d + signZ) - base + 4.2;
        this.sign.position.set(x, 5.2, signZ);
        this.sign.lookAt(this.camera.position.x, 5.2, this.camera.position.z);
    }
    update(s, opts, aspect) {
        this.atmosphere(s, opts.environment, opts.weather);
        this.rebuildRoad(s, opts.quality.drawDistance, opts.environment);
        const path = s.branch ? ramp(s.d - s.fork) : 0;
        const px = s.x + path;
        const pose = cameraPose(s, path, opts.camera, aspect < 1);
        this.camera.aspect = aspect;
        this.camera.fov = 48 / Math.max(0.55, pose.fovMul / 0.72);
        this.camera.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
        this.camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
        this.camera.updateProjectionMatrix();
        // Player
        if (this.player.userData.color !== opts.color) {
            this.scene.remove(this.player);
            this.player = createVehicle('sport', opts.color);
            this.scene.add(this.player);
            this.player.userData.color = opts.color;
        }
        this.player.position.set(px, 0, 0.02);
        this.player.rotation.y = -s.yaw;
        this.player.rotation.z = THREE.MathUtils.clamp(-s.vx * 0.015, -0.12, 0.12);
        setVehicleLights(this.player, opts.lights, opts.brake);
        // Traffic
        const seen = new Set();
        const base = curve(s.d);
        let drawn = 0;
        for (const t of s.traffic) {
            const z = t.d - s.d;
            if (z < -8 || z > opts.quality.drawDistance * 0.55 || drawn >= opts.quality.maxTrafficDraw)
                continue;
            seen.add(t.id);
            let mesh = this.traffic.get(t.id);
            if (!mesh || mesh.userData.color !== t.color || mesh.userData.type !== t.type) {
                if (mesh)
                    this.scene.remove(mesh);
                mesh = createVehicle(t.type || 'sedan', t.color);
                mesh.userData.color = t.color;
                mesh.userData.type = t.type;
                this.traffic.set(t.id, mesh);
                this.scene.add(mesh);
            }
            const x = curve(s.d + z) - base + t.x;
            mesh.position.set(x, 0, z);
            mesh.rotation.y = -Math.atan2(curve(s.d + z + 3) - curve(s.d + z - 3), 6);
            mesh.visible = true;
            drawn++;
        }
        for (const [id, mesh] of this.traffic) {
            if (!seen.has(id))
                mesh.visible = false;
        }
        if (!opts.reduceEffects) {
            this.props.sync(s, opts.environment, opts.quality.drawDistance, opts.quality.propStep);
        }
        this.syncSign(s, opts.sectionLabels);
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
