import { v, box, car, quad, renderer } from './mesh.js';
import { BIOMES, effectiveNight } from './game/EnvironmentManager.js';
import { cameraPose } from './game/CameraController.js';
export let sectionLabels = ['Servicios', 'Curriculum', 'Portfolio', 'Blog', 'Contacto'];
export function setSectionLabels(labels) {
    sectionLabels = labels;
}
export const curve = (d) => Math.sin(d / 210) * 30 + Math.sin(d / 620) * 45 + Math.sin(d / 1050) * 35;
export function ramp(t) {
    return 4.6 + Math.max(0, t) * 0.12 + Math.sin(Math.max(0, t) / 180) * 2;
}
function pine(a, x, z, size) {
    box(a, x, size * 0.4, z, 0.25, size * 0.8, 0.25, '#6b5945');
    for (let j = 0; j < 3; j++) {
        const y = size * (0.55 + j * 0.25);
        const r = size * (0.35 - j * 0.08);
        a.push({ c: j % 2 ? '#44634e' : '#385d49', v: [v(x - r, y, z - r), v(x + r, y, z - r), v(x, y + size * 0.55, z)] });
        a.push({ c: '#294c3c', v: [v(x + r, y, z - r), v(x + r, y, z + r), v(x, y + size * 0.55, z)] });
        a.push({ c: '#4c7056', v: [v(x - r, y, z + r), v(x + r, y, z + r), v(x, y + size * 0.55, z)] });
        a.push({ c: '#365b45', v: [v(x - r, y, z - r), v(x - r, y, z + r), v(x, y + size * 0.55, z)] });
    }
}
function building(a, x, z, h, w) {
    box(a, x, h / 2, z, w, h, w * 0.8, '#8d8575');
    box(a, x, h + 0.15, z, w * 0.9, 0.3, w * 0.7, '#6a6560');
    for (let i = 0; i < 3; i++) {
        box(a, x - w * 0.25, 1 + i * 1.2, z + w * 0.42, 0.35, 0.45, 0.05, '#c9d8e0');
        box(a, x + w * 0.25, 1 + i * 1.2, z + w * 0.42, 0.35, 0.45, 0.05, '#c9d8e0');
    }
}
export function drawRoad(c, s, w, h, opts) {
    c.clearRect(0, 0, w, h);
    const night = effectiveNight(opts.environment) || opts.environment === 'night';
    const beach = opts.environment === 'beach';
    const weather = opts.weather || s.weather || 'clear';
    const quality = opts.quality || {
        drawDistance: 320,
        propStep: 28,
        shadows: true,
        particles: true,
        resolutionScale: 1,
        maxTrafficDraw: 12,
    };
    const biomeA = BIOMES[Math.floor(s.d / 1600) % BIOMES.length];
    const biomeB = BIOMES[Math.floor(s.d / 1600 + 1) % BIOMES.length];
    const blend = s.biomeBlend || 0;
    const ground = blend > 0.5 ? biomeB.ground : biomeA.ground;
    const skyColors = night
        ? ['#091626', '#26364b', '#44516a']
        : weather === 'sunset'
            ? ['#c07050', '#e8a878', '#f0c8a0']
            : weather === 'cloudy' || weather === 'rain'
                ? ['#6a7a88', '#9aa8b0', '#b8c0c4']
                : beach
                    ? ['#61b6d4', '#bfe9ed', '#e9d8b6']
                    : biomeA.sky;
    const sky = c.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, skyColors[0]);
    sky.addColorStop(0.7, skyColors[1]);
    sky.addColorStop(1, skyColors[2]);
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    c.fillStyle = night ? '#e1e8f4' : '#fff1cc';
    c.beginPath();
    c.arc(w * 0.76, h * 0.21, h * 0.035, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(0, h * 0.48);
        for (let i = 0; i <= 30; i++) {
            c.lineTo(i * w / 30, h * (0.31 + k * 0.035) - Math.sin(i * 0.6 + k * 2) * h * 0.036 - Math.sin(i * 0.17 + k) * h * 0.05);
        }
        c.lineTo(w, h);
        c.lineTo(0, h);
        c.fillStyle = ground[k] || ground[0];
        c.fill();
    }
    const base = curve(s.d);
    const path = s.branch ? ramp(s.d - s.fork) : 0;
    const px = s.x + path;
    const pose = cameraPose(s, path, opts.camera, w / h < 1);
    const cam = renderer(c, w, h, {
        pos: v(pose.pos.x, pose.pos.y, pose.pos.z),
        target: v(pose.target.x, pose.target.y, pose.target.z),
        fov: w * pose.fovMul,
    });
    const a = [];
    const objects = [];
    const cx = (z) => curve(s.d + z) - base;
    const far = Math.floor((s.d + quality.drawDistance) / 6) * 6;
    // Elevation undulation (visual only on props via road grade cue)
    for (let world = far; world > s.d - 18; world -= 6) {
        const z = world - s.d;
        const z2 = z + 6;
        const x = cx(z);
        const x2 = cx(z2);
        const asphalt = night ? '#2a3034' : '#4d5254';
        quad(a, x, z, x2, z2, 140, beach ? '#d8c79d' : ground[0], -0.08);
        quad(a, x - 43, z, x2 - 43, z2, 36, night ? '#3a5a62' : biomeA.water, -0.06);
        quad(a, x, z, x2, z2, 12, asphalt);
        for (const side of [-1, 1]) {
            quad(a, x + side * 6.15, z, x2 + side * 6.15, z2, 0.3, '#a6a18c');
            quad(a, x + side * 5.65, z, x2 + side * 5.65, z2, 0.11, '#dddcc9', 0.015);
            if (quality.shadows)
                box(objects, x + side * 6.4, 0.55, z, 0.12, 0.7, 0.12, '#9aa8a0');
        }
        if (((world % 24) + 24) % 24 < 12) {
            for (const l of [-2, 2])
                quad(a, x + l, z, x2 + l, z2, 0.12, '#dddcc9', 0.02);
        }
        const t = world - s.fork;
        const t2 = t + 6;
        if (t2 > 0 && t < 310) {
            const rx = x + ramp(t);
            const rx2 = x2 + ramp(t2);
            quad(a, rx, z, rx2, z2, 4, '#53595a', 0.023);
            quad(a, rx - 1.8, z, rx2 - 1.8, z2, 0.13, '#eee5ca', 0.028);
            quad(a, rx + 1.8, z, rx2 + 1.8, z2, 0.13, '#eee5ca', 0.028);
        }
        // Occasional tunnel / bridge events (deterministic)
        const event = Math.floor(world / 900) % 7;
        if (event === 3 && t < -40) {
            box(objects, x, 4, z, 16, 8, 6, night ? '#1a2228' : '#3a454c');
        }
        if (event === 5) {
            box(objects, x, 3.5, z, 14, 0.4, 8, '#6a7278');
            box(objects, x - 6, 2, z, 0.5, 4, 0.5, '#5a6268');
            box(objects, x + 6, 2, z, 0.5, 4, 0.5, '#5a6268');
        }
        cam.draw(a, true);
        a.length = 0;
    }
    for (const offset of [-150, -100, -50, 10]) {
        const z = s.fork + offset - s.d;
        if (z > 8 && z < 240) {
            const x = cx(z) + 4;
            objects.push({
                c: '#eedaa1',
                v: [v(x - 0.35, 0.04, z), v(x + 0.35, 0.04, z), v(x + 0.35, 0.04, z + 5), v(x + 1.05, 0.04, z + 5), v(x, 0.04, z + 8), v(x - 1.05, 0.04, z + 5), v(x - 0.35, 0.04, z + 5)],
            });
        }
    }
    const step = quality.propStep;
    for (let n = Math.floor((s.d - 20) / step); n * step < s.d + quality.drawDistance - 10; n++) {
        const world = n * step;
        const z = world - s.d;
        const x = cx(z);
        const t = world - s.fork;
        const right = Math.max(14 + ((n % 4 + 4) % 4) * 3, t > -20 && t < 330 ? ramp(Math.max(0, t)) + 6 : 0);
        const biomeId = Math.floor(world / 1600) % BIOMES.length;
        if (beach || opts.environment === 'coast') {
            box(objects, x + right, 0.35, z, 1.2, 0.7, 1.1, '#d6c396');
            if (n % 2 === 0) {
                box(objects, x - 14, 3, z, 0.25, 6, 0.25, '#866b44');
                for (let j = 0; j < 4; j++) {
                    box(objects, x - 14 + Math.cos((j * Math.PI) / 2) * 1.2, 5.8, z + Math.sin((j * Math.PI) / 2) * 1.2, 3.5, 0.12, 0.55, '#477e53', (j * Math.PI) / 2);
                }
            }
        }
        else if (biomeId === 2) {
            building(objects, x + right, z, 4 + (n % 4), 2.5 + (n % 3) * 0.4);
            if (n % 2 === 0)
                box(objects, x - 12, 2.2, z, 0.15, 4.4, 0.15, '#889098');
        }
        else if (biomeId === 3) {
            box(objects, x + right, 0.6, z, 1.4, 1.2, 1.1, '#b8955c');
        }
        else if (biomeId === 4) {
            pine(objects, x + right, z, 3.5 + (n % 3));
            box(objects, x + right + 2, 0.2, z, 2, 0.35, 2, '#e8eef2');
        }
        else {
            pine(objects, x + right, z, 5 + ((n % 3 + 3) % 3));
            if (n % 2 === 0)
                pine(objects, x - 13, z, 4.5);
        }
    }
    for (let n = Math.floor((s.d - 12) / 12); n * 12 < s.d + quality.drawDistance - 20; n++) {
        const z = n * 12 - s.d;
        const x = cx(z);
        const t = n * 12 - s.fork;
        for (const side of [-1, 1]) {
            if (side < 0 || t < -12 || t > 330) {
                box(objects, x + side * 6.8, 0.45, z, 0.13, 0.9, 0.13, '#e6e0cb');
                box(objects, x + side * 6.8, 0.68, z, 0.15, 0.16, 0.15, side < 0 ? '#dad6bd' : '#b44937');
            }
        }
    }
    let drawn = 0;
    for (const t of s.traffic) {
        const z = t.d - s.d;
        if (z > -10 && z < quality.drawDistance * 0.5 && drawn < quality.maxTrafficDraw) {
            car(objects, cx(z) + t.x, z, t.color, {
                angle: Math.atan2(cx(z + 3) - cx(z - 3), 6),
                lights: night,
                spin: (s.time * 85) / 3.6 / 0.44,
            });
            drawn++;
        }
    }
    // Anticipation signs at 300m and 100m (wider boards for readable labels)
    for (const dist of [300, 100]) {
        const signZ = s.fork - s.d - dist;
        if (signZ > -10 && signZ < quality.drawDistance) {
            const x = cx(signZ) + 7.2;
            box(objects, x, 2.9, signZ, 0.15, 5.8, 0.15, '#9caaa5');
            box(objects, x - 3.1, 5.35, signZ, 8.6, dist === 100 ? 2.8 : 2.4, 0.15, '#235548');
        }
    }
    // Always draw the driven car (chase camera).
    car(objects, px, 0, opts.color, {
        angle: s.yaw || 0,
        roll: -s.vx * 0.007 + (curve(s.d + 12) - 2 * curve(s.d) + curve(s.d - 12)) * 0.008,
        spin: s.d / 0.44,
        brake: opts.brake,
        lights: opts.lights || night,
        steer: s.steer * 0.35,
    });
    cam.draw(a);
    cam.draw(objects);
    const signZ = s.fork - s.d - 100;
    if (signZ > 5 && signZ < 280) {
        const x = cx(signZ) + 4.1;
        const half = 4.1;
        const y = 5.35;
        const corners = [v(x - half, y + 1.15, signZ - 0.09), v(x + half, y + 1.15, signZ - 0.09), v(x + half, y - 1.15, signZ - 0.09), v(x - half, y - 1.15, signZ - 0.09)].map(cam.project);
        if (corners.every((p) => p.z > 0.2)) {
            const tex = document.createElement('canvas');
            tex.width = 640;
            tex.height = 180;
            const tc = tex.getContext('2d');
            tc.fillStyle = '#235548';
            tc.fillRect(0, 0, 640, 180);
            tc.strokeStyle = '#fff9df';
            tc.lineWidth = 6;
            tc.strokeRect(10, 10, 620, 160);
            tc.fillStyle = '#fff9df';
            tc.textAlign = 'center';
            tc.textBaseline = 'middle';
            const meters = Math.max(0, Math.round(s.fork - s.d));
            const name = (sectionLabels[s.exit] || '').trim();
            let nameFont = 48;
            tc.font = `700 ${nameFont}px sans-serif`;
            while (tc.measureText(name).width > 560 && nameFont > 22) {
                nameFont--;
                tc.font = `700 ${nameFont}px sans-serif`;
            }
            tc.fillText(name, 320, 68);
            tc.font = '600 36px sans-serif';
            tc.fillText(`↗  ${meters} m`, 320, 128);
            const tris = [[0, 1, 2], [0, 2, 3]];
            const uv = [[0, 0], [640, 0], [640, 180], [0, 180]];
            for (const tri of tris) {
                const [A, B, C] = tri.map((i) => corners[i]);
                const [u0, vv, q] = tri.map((i) => uv[i]);
                const det = (vv[0] - u0[0]) * (q[1] - u0[1]) - (q[0] - u0[0]) * (vv[1] - u0[1]);
                const aa = ((B.x - A.x) * (q[1] - u0[1]) - (C.x - A.x) * (vv[1] - u0[1])) / det;
                const bb = ((B.y - A.y) * (q[1] - u0[1]) - (C.y - A.y) * (vv[1] - u0[1])) / det;
                const cc = ((C.x - A.x) * (vv[0] - u0[0]) - (B.x - A.x) * (q[0] - u0[0])) / det;
                const dd = ((C.y - A.y) * (vv[0] - u0[0]) - (B.y - A.y) * (q[0] - u0[0])) / det;
                c.save();
                c.beginPath();
                c.moveTo(A.x, A.y);
                c.lineTo(B.x, B.y);
                c.lineTo(C.x, C.y);
                c.closePath();
                c.clip();
                c.setTransform(aa, bb, cc, dd, A.x - aa * u0[0] - cc * u0[1], A.y - bb * u0[0] - dd * u0[1]);
                c.drawImage(tex, 0, 0);
                c.restore();
            }
        }
    }
    if (night) {
        c.fillStyle = '#07102055';
        c.fillRect(0, 0, w, h);
        const glow = c.createRadialGradient(w * 0.5, h * 0.7, 8, w * 0.5, h * 0.6, w * 0.5);
        glow.addColorStop(0, '#fff2bc20');
        glow.addColorStop(1, '#fff2bc00');
        c.fillStyle = glow;
        c.beginPath();
        c.moveTo(w * 0.38, h * 0.7);
        c.lineTo(w * 0.2, h * 0.48);
        c.lineTo(w * 0.8, h * 0.48);
        c.lineTo(w * 0.62, h * 0.7);
        c.fill();
    }
    if (weather === 'rain' && quality.particles && !opts.reduceEffects) {
        c.strokeStyle = '#c8d4dc55';
        c.lineWidth = 1;
        for (let i = 0; i < 40; i++) {
            const rx = ((i * 97 + s.d * 3) % w);
            const ry = ((i * 53 + s.time * 400) % h);
            c.beginPath();
            c.moveTo(rx, ry);
            c.lineTo(rx + 2, ry + 10);
            c.stroke();
        }
    }
    if (weather === 'fog') {
        c.fillStyle = '#c8d0d655';
        c.fillRect(0, 0, w, h);
    }
    if (s.slip > 0.2 && quality.particles) {
        const p = cam.project(v(px, 0.25, -1.7));
        c.fillStyle = '#ccd5d04a';
        for (let i = 0; i < 4; i++) {
            c.beginPath();
            c.ellipse(p.x + (i - 1.5) * w * 0.015, p.y + i * h * 0.007, w * 0.014, h * 0.01, 0, 0, Math.PI * 2);
            c.fill();
        }
    }
    const edge = c.createRadialGradient(w / 2, h * 0.45, w * 0.1, w / 2, h * 0.5, w * 0.65);
    edge.addColorStop(0, '#10202a00');
    edge.addColorStop(1, '#14263350');
    c.fillStyle = edge;
    c.fillRect(0, 0, w, h);
}
export function drawGarage(c, w, h, angle, zoom, color, hood, lights, _focus) {
    c.fillStyle = '#18222b';
    c.fillRect(0, 0, w, h);
    const a = [];
    const objects = [];
    const cam = renderer(c, w, h, { pos: v(Math.sin(angle) * zoom, 3.4, Math.cos(angle) * zoom), target: v(0, w / h < 1 ? 1.9 : 0.8, 0), fov: w * (w / h < 1 ? 0.95 : 0.65) }, true);
    for (let x = -10; x < 10; x += 2) {
        for (let z = -10; z < 10; z += 2) {
            quad(a, x + 1, z, x + 1, z + 2, 1.97, (x + z) % 4 === 0 ? '#596369' : '#505b61', -0.04);
        }
    }
    box(objects, 0, 2.8, 16, 32, 5.6, 0.2, '#333f48');
    box(objects, -16, 2.8, 0, 0.2, 5.6, 32, '#3f4d55');
    box(objects, 16, 2.8, 0, 0.2, 5.6, 32, '#3f4d55');
    for (const x of [-8, -4, 4, 8]) {
        box(objects, x, 2.7, 15.8, 0.2, 5.4, 0.3, '#869493');
        box(objects, x, 5.5, 0, 0.2, 0.15, 24, '#7c8988');
    }
    box(objects, 0, 0.12, 0, 3.6, 0.22, 6.7, '#242e35');
    for (const x of [-1.6, 1.6])
        box(objects, x, 0.25, 0, 0.12, 0.12, 6.8, '#d5b774');
    box(objects, -6, 0.65, 4, 2.1, 1.3, 1.1, '#984744');
    for (let j = 0; j < 4; j++)
        box(objects, -6, 0.25 + j * 0.28, 3.43, 1.9, 0.04, 0.02, '#bd9487');
    box(objects, 5, 1.1, 5, 3, 2.2, 0.6, '#456170');
    for (let j = 0; j < 6; j++)
        box(objects, 5, 1.5, 4.65, 2.9, 0.035, 0.04, '#6e878e');
    for (const x of [-3, 3]) {
        box(objects, x, 5.1, 0, 0.6, 0.05, 6, '#fff6d5');
        box(objects, x, 5.16, 0, 0.8, 0.07, 6.1, '#8d989a');
    }
    box(objects, 0, 2.4, 15.7, 5.7, 3.3, 0.1, '#2c343b');
    for (let j = 0; j < 10; j++)
        box(objects, 0, 0.9 + j * 0.3, 15.6, 5.6, 0.035, 0.03, '#7b898c');
    car(objects, 0, 0, color, { hood, lights });
    cam.draw(a);
    cam.draw(objects);
    if (lights) {
        const p = cam.project(v(0, 0.7, 2.2));
        const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, w * 0.16);
        g.addColorStop(0, '#fff1bd40');
        g.addColorStop(1, '#fff1bd00');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
    }
    const spots = [v(-0.8, 1.4, -1), v(0.8, 1.4, 0), v(0, 1.4, 1.5)];
    return spots.map((p, i) => {
        const q = cam.project(p);
        return { x: (q.x / w) * 100, y: (q.y / h) * 100, visible: q.z > 0, index: i };
    });
}
