import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { depthPresence, mirrorChaseProjection } from '../../assets/render/webgl/path.js';

describe('chase camera view axis', () => {
  it('maps gameplay +X to screen-right after projection mirror', () => {
    const cam = new THREE.PerspectiveCamera(50, 1, 0.2, 500);
    cam.position.set(0, 3.15, -8.4);
    cam.lookAt(0, 0.45, 18);
    cam.updateMatrixWorld(true);
    cam.updateProjectionMatrix();

    const project = (x) => {
      const v = new THREE.Vector3(x, 0, 0);
      v.project(cam);
      return v.x;
    };

    assert.ok(project(4) < project(-4), 'raw chase cam puts +X on screen-left');

    mirrorChaseProjection(cam);
    const rightNdc = project(4);
    const leftNdc = project(-4);
    assert.ok(rightNdc > leftNdc, 'mirrored projection puts right lane on screen-right');
    assert.ok(rightNdc > 0);
    assert.ok(leftNdc < 0);
  });

  it('fades props in from the far plane and out near the camera', () => {
    const far = 300;
    assert.ok(depthPresence(far, far) < 0.05);
    assert.ok(depthPresence(far - 80, far) > 0.85);
    assert.ok(depthPresence(40, far) > 0.9);
    assert.ok(depthPresence(-12, far) < 0.05);
  });

});
