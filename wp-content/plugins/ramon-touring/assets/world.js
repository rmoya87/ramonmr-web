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
    box(a, x, size * 0.36, z, 0.32, size * 0.72, 0.32, '#6e5844');
    for (let j = 0; j < 4; j++) {
        const y = size * (0.45 + j * 0.2);
        const r = size * (0.48 - j * 0.09);
        a.push({ c: j % 2 ? '#2f5a40' : '#264a36', v: [v(x - r, y, z - r), v(x + r, y, z - r), v(x, y + size * 0.5, z)] });
        a.push({ c: '#1e3c2c', v: [v(x + r, y, z - r), v(x + r, y, z + r), v(x, y + size * 0.5, z)] });
        a.push({ c: '#3a6a48', v: [v(x - r, y, z + r), v(x + r, y, z + r), v(x, y + size * 0.5, z)] });
        a.push({ c: '#2a5440', v: [v(x - r, y, z - r), v(x - r, y, z + r), v(x, y + size * 0.5, z)] });
    }
}
function bush(a, x, z, size) {
    box(a, x, size * 0.35, z, size, size * 0.7, size * 0.9, '#3a6048');
    box(a, x + size * 0.25, size * 0.5, z - size * 0.1, size * 0.7, size * 0.55, size * 0.7, '#4a7058');
}
function building(a, x, z, h, w) {
    const facade = h > 5 ? '#7a7880' : '#8a8274';
    box(a, x, h / 2, z, w, h, w * 0.75, facade);
    box(a, x, h + 0.12, z, w * 0.92, 0.24, w * 0.68, '#5a585e');
    for (let row = 0; row < Math.min(5, Math.floor(h / 1.1)); row++) {
        for (const sx of [-1, 1]) {
            box(a, x + sx * w * 0.22, 0.9 + row * 1.15, z + w * 0.38, 0.32, 0.42, 0.04, row % 2 ? '#d8e4ec' : '#f0e8c0');
        }
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
    const sky = c.createLinearGradient(0, 0, 0, h * 0.62);
    sky.addColorStop(0, skyColors[0]);
    sky.addColorStop(0.55, skyColors[1]);
    sky.addColorStop(1, skyColors[2]);
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    // Soft sun glow
    if (!night) {
        const sunX = w * 0.76;
        const sunY = h * 0.16;
        const glow = c.createRadialGradient(sunX, sunY, 2, sunX, sunY, h * 0.14);
        glow.addColorStop(0, weather === 'sunset' ? '#ffc080aa' : '#fff2c0aa');
        glow.addColorStop(1, '#fff2c000');
        c.fillStyle = glow;
        c.fillRect(sunX - h * 0.16, sunY - h * 0.16, h * 0.32, h * 0.32);
        c.fillStyle = weather === 'sunset' ? '#ffc090' : biomeA.sun;
        c.beginPath();
        c.arc(sunX, sunY, h * 0.028, 0, Math.PI * 2);
        c.fill();
    }
    else {
        c.fillStyle = '#e8eef8';
        c.beginPath();
        c.arc(w * 0.74, h * 0.18, h * 0.022, 0, Math.PI * 2);
        c.fill();
    }
    if (!night && !opts.reduceEffects && weather !== 'rain') {
        c.fillStyle = weather === 'cloudy' ? '#d0d8e099' : '#ffffff44';
        for (let i = 0; i < 6; i++) {
            const cloudX = ((i * 151 + s.d * 0.06) % (w + 160)) - 80;
            const cloudY = h * (0.1 + (i % 3) * 0.045);
            c.beginPath();
            c.ellipse(cloudX, cloudY, w * 0.09, h * 0.016, 0, 0, Math.PI * 2);
            c.ellipse(cloudX + w * 0.045, cloudY - h * 0.006, w * 0.055, h * 0.013, 0, 0, Math.PI * 2);
            c.ellipse(cloudX - w * 0.03, cloudY + h * 0.004, w * 0.04, h * 0.01, 0, 0, Math.PI * 2);
            c.fill();
        }
    }
    // Layered hills with slight atmospheric fade
    for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(0, h * 0.5);
        for (let i = 0; i <= 36; i++) {
            c.lineTo((i * w) / 36, h * (0.3 + k * 0.04) -
                Math.sin(i * 0.55 + k * 2.1 + s.d * 0.002) * h * 0.032 -
                Math.sin(i * 0.19 + k) * h * 0.045);
        }
        c.lineTo(w, h);
        c.lineTo(0, h);
        c.fillStyle = ground[k] || ground[0];
        c.fill();
    }
    // Horizon haze band
    const haze = c.createLinearGradient(0, h * 0.28, 0, h * 0.52);
    haze.addColorStop(0, '#ffffff00');
    haze.addColorStop(0.5, biomeA.haze || '#d0dce088');
    haze.addColorStop(1, '#ffffff00');
    c.fillStyle = haze;
    c.fillRect(0, h * 0.28, w, h * 0.24);
    // Stable 2D road bed so the lower frame never becomes a void if a 3D quad clips badly.
    const asphalt2d = night ? '#3a4248' : '#545c62';
    const verge2d = beach ? '#c8b888' : '#6a7a58';
    const roadTop = h * 0.5;
    const cxScreen = w * 0.5 + Math.sin(s.d / 210) * w * 0.02;
    c.fillStyle = beach ? '#d4c294' : ground[0];
    c.fillRect(0, roadTop, w, h - roadTop);
    c.fillStyle = verge2d;
    c.beginPath();
    c.moveTo(cxScreen - w * 0.06, roadTop);
    c.lineTo(cxScreen + w * 0.06, roadTop);
    c.lineTo(cxScreen + w * 0.62, h);
    c.lineTo(cxScreen - w * 0.62, h);
    c.closePath();
    c.fill();
    c.fillStyle = asphalt2d;
    c.beginPath();
    c.moveTo(cxScreen - w * 0.045, roadTop);
    c.lineTo(cxScreen + w * 0.045, roadTop);
    c.lineTo(cxScreen + w * 0.48, h);
    c.lineTo(cxScreen - w * 0.48, h);
    c.closePath();
    c.fill();
    c.strokeStyle = '#ebe4cc88';
    c.lineWidth = Math.max(2, w * 0.004);
    for (const side of [-1, 1]) {
        c.beginPath();
        c.moveTo(cxScreen + side * w * 0.042, roadTop);
        c.lineTo(cxScreen + side * w * 0.45, h);
        c.stroke();
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
    // Only strips clearly in front of the camera. Near-plane / behind-camera quads
    // project as full-screen asphalt and wipe the sky.
    for (let world = far; world > s.d + 2; world -= 6) {
        const z = world - s.d;
        const z2 = z + 6;
        if (z < 2)
            continue;
        const x = cx(z);
        const x2 = cx(z2);
        const asphalt = night ? '#3a4248' : ((Math.floor(world / 6) % 2) ? '#5a6268' : '#545c62');
        // Keep ground strips narrower near the camera to avoid projective blow-ups.
        const groundW = Math.min(90, 28 + z * 0.55);
        quad(a, x, z, x2, z2, groundW, beach ? '#d4c294' : ground[0], -0.08);
        if (z > 40) {
            quad(a, x - groundW * 0.35, z, x2 - groundW * 0.35, z2, groundW * 0.28, night ? '#2e4e58' : biomeA.water, -0.06);
        }
        quad(a, x, z, x2, z2, 12.6, asphalt);
        // Soft roadside verge
        for (const side of [-1, 1]) {
            quad(a, x + side * 6.5, z, x2 + side * 6.5, z2, 0.55, beach ? '#c8b888' : '#6a7a58');
            quad(a, x + side * 5.95, z, x2 + side * 5.95, z2, 0.16, '#ebe4cc', 0.016);
            if (quality.shadows && z < 180) {
                box(objects, x + side * 6.7, 0.52, z, 0.12, 0.72, 0.12, '#9aaca4');
                box(objects, x + side * 6.7, 0.9, z, 0.16, 0.1, 0.16, side < 0 ? '#efe8d0' : '#c24a38');
            }
        }
        // White lane dashes only (no center yellow)
        if (((world % 22) + 22) % 22 < 10) {
            for (const l of [-2, 2])
                quad(a, x + l, z, x2 + l, z2, 0.13, '#f4f0dc', 0.022);
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
    for (let n = Math.floor((s.d - 4) / step); n * step < s.d + quality.drawDistance - 10; n++) {
        const world = n * step;
        const z = world - s.d;
        if (z < -2)
            continue;
        const x = cx(z);
        const t = world - s.fork;
        const right = Math.max(14 + ((n % 4 + 4) % 4) * 3, t > -20 && t < 330 ? ramp(Math.max(0, t)) + 6 : 0);
        const biomeId = Math.floor(world / 1600) % BIOMES.length;
        if (beach || opts.environment === 'coast') {
            box(objects, x + right, 0.3, z, 1.4, 0.6, 1.2, '#d2be8e');
            bush(objects, x + right + 2.2, z, 1.1 + (n % 2) * 0.3);
            if (n % 2 === 0) {
                box(objects, x - 15, 3.2, z, 0.28, 6.4, 0.28, '#7a623e');
                for (let j = 0; j < 5; j++) {
                    box(objects, x - 15 + Math.cos((j * Math.PI) / 2.5) * 1.35, 6.1, z + Math.sin((j * Math.PI) / 2.5) * 1.35, 3.2, 0.1, 0.5, '#3a6e4a', (j * Math.PI) / 2.5);
                }
            }
        }
        else if (biomeId === 2) {
            building(objects, x + right, z, 4.5 + (n % 5), 2.6 + (n % 3) * 0.45);
            if (n % 2 === 0) {
                box(objects, x - 12, 2.4, z, 0.18, 4.8, 0.18, '#7a8890');
                box(objects, x - 12, 4.7, z, 0.5, 0.12, 0.5, '#c8d0d4');
            }
        }
        else if (biomeId === 3) {
            box(objects, x + right, 0.7, z, 1.6, 1.4, 1.2, '#c4a060');
            box(objects, x + right + 2.5, 0.35, z, 0.9, 0.7, 0.9, '#b89254');
        }
        else if (biomeId === 4) {
            pine(objects, x + right, z, 3.2 + (n % 3));
            box(objects, x + right + 2.2, 0.18, z, 2.2, 0.3, 2.2, '#eef4f8');
        }
        else {
            pine(objects, x + right, z, 5.2 + ((n % 3 + 3) % 3));
            if (n % 2 === 0)
                pine(objects, x - 13.5, z, 4.6);
            if (n % 3 === 0)
                bush(objects, x + right - 3, z + 2, 1.2);
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
    // Ground shadow under the player car for depth.
    if (quality.shadows) {
        box(objects, px, 0.04, -0.2, 2.2, 0.05, 4.4, '#1a2228');
    }
    // Player car last so it stays visible over road props.
    car(objects, px, 0.02, opts.color, {
        angle: s.yaw || 0,
        roll: -s.vx * 0.007 + (curve(s.d + 12) - 2 * curve(s.d) + curve(s.d - 12)) * 0.008,
        spin: s.d / 0.44,
        brake: opts.brake,
        lights: opts.lights || night,
        steer: s.steer * 0.35,
    });
    cam.draw(a);
    cam.draw(objects);
    // Soft contact shadow projected in screen space under the car.
    const shadow = cam.project(v(px, 0.05, 0));
    if (shadow.z > 0.4) {
        c.fillStyle = '#0a121888';
        c.beginPath();
        c.ellipse(shadow.x, shadow.y + h * 0.01, w * 0.09, h * 0.018, 0, 0, Math.PI * 2);
        c.fill();
    }
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
    // Gentle horizon mist only — keep the road and car clear.
    const depth = c.createLinearGradient(0, h * 0.22, 0, h * 0.48);
    depth.addColorStop(0, night ? '#0a152033' : '#d0dce022');
    depth.addColorStop(1, '#ffffff00');
    c.fillStyle = depth;
    c.fillRect(0, h * 0.2, w, h * 0.28);
}
export function drawGarage(c, w, h, angle, zoom, color, hood, lights, _focus) {
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1c2a34');
    bg.addColorStop(1, '#121a22');
    c.fillStyle = bg;
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
