import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createVehicle } from '../../assets/render/webgl/Vehicles.js';
import { mirrorChaseProjection } from '../../assets/render/webgl/path.js';

// The road camera mirrors X. With FrontSide materials every triangle must still be
// front-facing on screen when its normal points to the camera; otherwise the car is drawn
// from the inside (wheels and glass seen through the paint).
function gameCamera(aspect) {
  const cam = new THREE.PerspectiveCamera(60, aspect, 0.1, 500);
  cam.position.set(0, 3.2, -7);
  cam.lookAt(0, 1, 12);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  mirrorChaseProjection(cam);
  return cam;
}

function wrongFaces(group, cam, x, z) {
  group.position.set(x, 0, z);
  group.updateMatrixWorld(true);
  const view = cam.matrixWorldInverse;
  const proj = cam.projectionMatrix;
  let facing = 0;
  let wrong = 0;
  group.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.every((m) => m.side === THREE.DoubleSide)) return;
    const g = o.geometry;
    const pos = g.attributes.position;
    const nor = g.attributes.normal;
    const idx = g.index ? g.index.array : [...Array(pos.count).keys()];
    const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    const w = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    const n = new THREE.Vector3();
    const nm = new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < idx.length; i += 3) {
      let nn = new THREE.Vector3();
      for (let k = 0; k < 3; k++) {
        v[k].fromBufferAttribute(pos, idx[i + k]).applyMatrix4(o.matrixWorld);
        nn.add(n.fromBufferAttribute(nor, idx[i + k]));
        w[k].copy(v[k]).applyMatrix4(view).applyMatrix4(proj);
      }
      nn.applyMatrix3(nm).normalize();
      const c = v[0].clone().add(v[1]).add(v[2]).multiplyScalar(1 / 3);
      if (nn.dot(cam.position.clone().sub(c).normalize()) <= 0.3) continue; // outward normal faces away
      const area = (w[1].x - w[0].x) * (w[2].y - w[0].y) - (w[2].x - w[0].x) * (w[1].y - w[0].y);
      if (Math.abs(area) < 1e-9) continue;
      facing++;
      if (area < 0) wrong++; // clockwise on screen = culled by FrontSide
    }
  });
  return { facing, wrong };
}

describe('road camera is mirrored: vehicles must show their outer faces', () => {
  const cam = gameCamera(16 / 9);
  for (const variant of ['sport', 'sedan', 'van', 'truck', 'slow', 'bus', 'moto', 'hatch']) {
    it(`${variant}: outward-facing triangles are front-facing on screen`, () => {
      const car = createVehicle(variant, '#d1c9b6', true);
      for (const [x, z] of [[-4, 14], [0, 10], [4, 22]]) {
        const { facing, wrong } = wrongFaces(car, cam, x, z);
        assert.ok(facing > 50, 'sampled triangles');
        assert.ok(wrong / facing < 0.01, `${variant} at ${x},${z}: ${wrong}/${facing} faces drawn from inside`);
      }
    });
  }
  it('the garage (not mirrored) keeps the default winding', () => {
    const plain = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 500);
    plain.position.set(0, 3, -8);
    plain.lookAt(0, 1, 0);
    plain.updateMatrixWorld(true);
    plain.updateProjectionMatrix();
    const car = createVehicle('sport', '#b12f3c');
    const { facing, wrong } = wrongFaces(car, plain, 0, 0);
    assert.ok(facing > 50);
    assert.ok(wrong / facing < 0.01, `${wrong}/${facing}`);
  });
});
