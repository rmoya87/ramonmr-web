import { v, box, car, quad, renderer } from './mesh.js';
export let sectionLabels = ['Servicios', 'Curriculum', 'Portfolio', 'Blog', 'Contacto'];
export function setSectionLabels(labels) { sectionLabels = labels; }
export const curve = (d) => Math.sin(d / 210) * 30 + Math.sin(d / 620) * 45 + Math.sin(d / 1050) * 35;
export function ramp(t) { return 4.6 + Math.max(0, t) * .12 + Math.sin(Math.max(0, t) / 180) * 2; }
function pine(a, x, z, size) {
    box(a, x, size * .4, z, .25, size * .8, .25, '#6b5945');
    for (let j = 0; j < 3; j++) {
        let y = size * (.55 + j * .25), r = size * (.35 - j * .08);
        a.push({ c: j % 2 ? '#44634e' : '#385d49', v: [v(x - r, y, z - r), v(x + r, y, z - r), v(x, y + size * .55, z)] });
        a.push({ c: '#294c3c', v: [v(x + r, y, z - r), v(x + r, y, z + r), v(x, y + size * .55, z)] });
        a.push({ c: '#4c7056', v: [v(x - r, y, z + r), v(x + r, y, z + r), v(x, y + size * .55, z)] });
        a.push({ c: '#365b45', v: [v(x - r, y, z - r), v(x - r, y, z + r), v(x, y + size * .55, z)] });
    }
}
export function drawRoad(c, s, w, h, color, camera, brake, light) {
    c.clearRect(0, 0, w, h);
    let sky = c.createLinearGradient(0, 0, 0, h * .7);
    sky.addColorStop(0, '#7898af');
    sky.addColorStop(.7, '#d5d2bb');
    sky.addColorStop(1, '#e9d8b6');
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff1cc';
    c.beginPath();
    c.arc(w * .76, h * .21, h * .035, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(0, h * .48);
        for (let i = 0; i <= 30; i++)
            c.lineTo(i * w / 30, h * (.31 + k * .035) - Math.sin(i * .6 + k * 2) * h * .036 - Math.sin(i * .17 + k) * h * .05);
        c.lineTo(w, h);
        c.lineTo(0, h);
        c.fillStyle = ['#8d9a94', '#82958b', '#698276'][k];
        c.fill();
    }
    let biome = Math.floor(s.d / 1400) % 3;
    let base = curve(s.d), path = s.branch ? ramp(s.d - s.fork) : 0, px = s.x + path;
    let cam = renderer(c, w, h, { pos: v(s.camX, camera === 1 ? 1.7 : 3.15, camera === 1 ? -3.6 : -8.7), target: v(px + Math.sin(s.steer) * 2, camera === 1 ? 1.15 : .8, camera === 1 ? 22 : 13), fov: w * (w / h < 1 ? 1.03 : .8) * (1 - Math.min(1, s.speed / 210) * .12) }), a = [], objects = [];
    const cx = (z) => curve(s.d + z) - base;
    const far = Math.floor((s.d + 320) / 6) * 6;
    for (let world = far; world > s.d - 18; world -= 6) {
        let z = world - s.d, z2 = z + 6, x = cx(z), x2 = cx(z2);
        quad(a, x, z, x2, z2, 140, ['#6c7959', '#9a8d70', '#607969'][biome], -.08);
        quad(a, x - 43, z, x2 - 43, z2, 36, '#6b9b9c', -.06);
        quad(a, x, z, x2, z2, 12, '#4d5254');
        for (let side of [-1, 1]) {
            quad(a, x + side * 6.15, z, x2 + side * 6.15, z2, .3, '#a6a18c');
            quad(a, x + side * 5.65, z, x2 + side * 5.65, z2, .11, '#dddcc9', .015);
        }
        if (((world % 24) + 24) % 24 < 12)
            for (let l of [-2, 2])
                quad(a, x + l, z, x2 + l, z2, .12, '#dddcc9', .02);
        let t = world - s.fork, t2 = t + 6;
        if (t2 > 0 && t < 310) {
            let rx = x + ramp(t), rx2 = x2 + ramp(t2);
            quad(a, rx, z, rx2, z2, 4, '#53595a', .023);
            quad(a, rx - 1.8, z, rx2 - 1.8, z2, .13, '#eee5ca', .028);
            quad(a, rx + 1.8, z, rx2 + 1.8, z2, .13, '#eee5ca', .028);
        }
        cam.draw(a, true);
        a.length = 0;
    }
    // Grounded arrows lead along the right lane before the fork.
    for (let offset of [-150, -100, -50, 10]) {
        let z = s.fork + offset - s.d;
        if (z > 8 && z < 240) {
            let x = cx(z) + 4;
            objects.push({ c: '#eedaa1', v: [v(x - .35, .04, z), v(x + .35, .04, z), v(x + .35, .04, z + 5), v(x + 1.05, .04, z + 5), v(x, .04, z + 8), v(x - 1.05, .04, z + 5), v(x - .35, .04, z + 5)] });
        }
    }
    // Static world-space props: their identity and spacing do not change as the camera advances.
    for (let n = Math.floor((s.d - 20) / 28); n * 28 < s.d + 310; n++) {
        let world = n * 28, z = world - s.d, x = cx(z), t = world - s.fork, right = Math.max(14 + ((n % 4 + 4) % 4) * 3, t > -20 && t < 330 ? ramp(Math.max(0, t)) + 6 : 0);
        if (biome !== 1 || n % 3 === 0)
            pine(objects, x + right, z, 5 + ((n % 3 + 3) % 3));
        else
            box(objects, x + right, .8, z, 3, 1.6, 2.5, '#8d8575');
        if (n % 2 === 0 && biome !== 1)
            pine(objects, x - 13, z, 4.5);
    }
    for (let n = Math.floor((s.d - 12) / 12); n * 12 < s.d + 300; n++) {
        let z = n * 12 - s.d, x = cx(z), t = n * 12 - s.fork;
        for (let side of [-1, 1])
            if (side < 0 || t < -12 || t > 330) {
                box(objects, x + side * 6.8, .45, z, .13, .9, .13, '#e6e0cb');
                box(objects, x + side * 6.8, .68, z, .15, .16, .15, side < 0 ? '#dad6bd' : '#b44937');
            }
    }
    for (let t of s.traffic) {
        let z = t.d - s.d;
        if (z > -10 && z < 155)
            car(objects, cx(z) + t.x, z, t.color, { spin: (s.time * 85 / 3.6) / .44 });
    }
    let signZ = s.fork - s.d - 100;
    if (signZ > -10 && signZ < 300) {
        let x = cx(signZ) + 7;
        box(objects, x, 2.7, signZ, .15, 5.4, .15, '#9caaa5');
        box(objects, x - 2.5, 5.1, signZ, 7.5, 2.1, .15, '#235548');
    }
    if (camera === 0)
        car(objects, px, 0, color, { angle: s.steer * .15, roll: -s.vx * .007 + (curve(s.d + 12) - 2 * curve(s.d) + curve(s.d - 12)) * .008, spin: s.d / .44, brake, lights: light });
    cam.draw(a);
    cam.draw(objects);
    if (signZ > 8 && signZ < 280) {
        let p = cam.project(v(cx(signZ) + 4.5, 5.1, signZ));
        if (p.z > 0) {
            let font = Math.max(8, Math.min(22, cam.project(v(0, 0, signZ)).z > 0 ? w / signZ * .56 : 10));
            c.font = `600 ${font}px sans-serif`;
            c.textAlign = 'center';
            c.fillStyle = '#fff9df';
            c.fillText(sectionLabels[s.exit] + ' ↗', p.x, p.y + font * .2);
        }
    }
    if (camera === 1) {
        c.fillStyle = '#18252c';
        c.beginPath();
        c.moveTo(0, h);
        c.lineTo(0, h * .88);
        c.quadraticCurveTo(w * .5, h * .79, w, h * .88);
        c.lineTo(w, h);
        c.fill();
        c.strokeStyle = '#33434c';
        c.lineWidth = h * .017;
        c.beginPath();
        c.arc(w * .5, h * 1.04, h * .17, Math.PI, Math.PI * 2);
        c.stroke();
    }
    let edge = c.createRadialGradient(w / 2, h * .45, w * .1, w / 2, h * .5, w * .65);
    edge.addColorStop(0, '#10202a00');
    edge.addColorStop(1, '#14263350');
    c.fillStyle = edge;
    c.fillRect(0, 0, w, h);
}
export function drawGarage(c, w, h, angle, zoom, color, hood, lights, focus) {
    c.fillStyle = '#18222b';
    c.fillRect(0, 0, w, h);
    let a = [], objects = [];
    let cam = renderer(c, w, h, { pos: v(Math.sin(angle) * zoom, 3.4, Math.cos(angle) * zoom), target: v(0, .6, 0), fov: w * (w / h < 1 ? .95 : .8) }, true);
    for (let x = -10; x < 10; x += 2)
        for (let z = -10; z < 10; z += 2)
            quad(a, x + 1, z, x + 1, z + 2, 1.97, (x + z) % 4 === 0 ? '#596369' : '#505b61', -.04);
    box(objects, 0, 2.8, 16, 32, 5.6, .2, '#333f48');
    box(objects, -16, 2.8, 0, .2, 5.6, 32, '#3f4d55');
    box(objects, 16, 2.8, 0, .2, 5.6, 32, '#3f4d55');
    for (let x of [-8, -4, 4, 8]) {
        box(objects, x, 2.7, 15.8, .2, 5.4, .3, '#869493');
        box(objects, x, 5.5, 0, .2, .15, 24, '#7c8988');
    }
    box(objects, 0, .12, 0, 3.6, .22, 6.7, '#242e35');
    for (let x of [-1.6, 1.6])
        box(objects, x, .25, 0, .12, .12, 6.8, '#d5b774');
    box(objects, -6, .65, 4, 2.1, 1.3, 1.1, '#984744');
    for (let j = 0; j < 4; j++)
        box(objects, -6, .25 + j * .28, 3.43, 1.9, .04, .02, '#bd9487');
    box(objects, 5, 1.1, 5, 3, 2.2, .6, '#456170');
    for (let j = 0; j < 6; j++)
        box(objects, 5, 1.5, 4.65, 2.9, .035, .04, '#6e878e');
    for (let x of [-3, 3]) {
        box(objects, x, 5.1, 0, .6, .05, 6, '#fff6d5');
        box(objects, x, 5.16, 0, .8, .07, 6.1, '#8d989a');
    }
    ;
    box(objects, 0, 2.4, 15.7, 5.7, 3.3, .1, '#2c343b');
    for (let j = 0; j < 10; j++)
        box(objects, 0, .9 + j * .3, 15.6, 5.6, .035, .03, '#7b898c');
    car(objects, 0, 0, color, { hood, lights });
    cam.draw(a);
    cam.draw(objects);
    if (lights) {
        let p = cam.project(v(0, .7, 2.2));
        let g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, w * .16);
        g.addColorStop(0, '#fff1bd40');
        g.addColorStop(1, '#fff1bd00');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
    }
    const spots = [v(-.8, 1.4, -1), v(.8, 1.4, 0), v(0, 1.4, 1.5)];
    return spots.map((p, i) => { let q = cam.project(p); return { x: q.x / w * 100, y: q.y / h * 100, visible: q.z > 0, index: i }; });
}
