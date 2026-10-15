/** Keyboard, touch holds, optional gamepad and horizontal drag. */
export class InputManager {
    constructor() {
        this.keys = {};
        this.dragSteer = 0;
        this.dragOrigin = null;
        this.consumed = { pause: false, camera: false };
    }
    clear() {
        this.keys = {};
        this.dragSteer = 0;
        this.dragOrigin = null;
    }
    bindHold(el, name) {
        el.addEventListener('pointerdown', (e) => {
            el.setPointerCapture(e.pointerId);
            this.keys[name] = true;
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            el.addEventListener(type, () => {
                this.keys[name] = false;
            });
        }
    }
    bindSteerDrag(surface) {
        surface.addEventListener('pointerdown', (e) => {
            if (e.target.closest('button,a,input,select,dialog'))
                return;
            surface.setPointerCapture(e.pointerId);
            this.dragOrigin = { x: e.clientX, id: e.pointerId };
        });
        surface.addEventListener('pointermove', (e) => {
            if (!this.dragOrigin || e.pointerId !== this.dragOrigin.id)
                return;
            const dx = (e.clientX - this.dragOrigin.x) / Math.max(120, surface.clientWidth * 0.25);
            this.dragSteer = Math.max(-1, Math.min(1, dx));
        });
        const end = () => {
            this.dragOrigin = null;
            this.dragSteer = 0;
        };
        surface.addEventListener('pointerup', end);
        surface.addEventListener('pointercancel', end);
    }
    setKey(key, down) {
        this.keys[key.toLowerCase()] = down;
    }
    poll() {
        const gp = this.readGamepad();
        const left = !!(this.keys.left || this.keys.arrowleft || this.keys.a || gp.left);
        const right = !!(this.keys.right || this.keys.arrowright || this.keys.d || gp.right);
        const brake = !!(this.keys.brake || this.keys.arrowdown || this.keys.s || gp.brake);
        // +1 = gameplay right lane (screen-right after chase projection mirror).
        let steerAxis = (right ? 1 : 0) - (left ? 1 : 0);
        if (Math.abs(this.dragSteer) > 0.05)
            steerAxis = this.dragSteer;
        if (Math.abs(gp.axis) > 0.15)
            steerAxis = gp.axis;
        const pausePressed = !!(this.keys.p || gp.pause);
        const cameraPressed = !!(this.keys.c || gp.camera);
        const pause = pausePressed && !this.consumed.pause;
        const camera = cameraPressed && !this.consumed.camera;
        this.consumed.pause = pausePressed;
        this.consumed.camera = cameraPressed;
        return { left, right, brake, pause, camera, steerAxis };
    }
    readGamepad() {
        const empty = { left: false, right: false, brake: false, pause: false, camera: false, axis: 0 };
        if (typeof navigator === 'undefined' || !navigator.getGamepads)
            return empty;
        const pads = navigator.getGamepads();
        const pad = pads && (pads[0] || pads[1]);
        if (!pad)
            return empty;
        const axis = pad.axes[0] || 0;
        return {
            left: pad.buttons[14]?.pressed || axis < -0.4,
            right: pad.buttons[15]?.pressed || axis > 0.4,
            brake: pad.buttons[6]?.pressed || pad.buttons[1]?.pressed || false,
            pause: pad.buttons[9]?.pressed || false,
            camera: pad.buttons[3]?.pressed || false,
            axis,
        };
    }
}
