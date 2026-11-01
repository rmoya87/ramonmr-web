import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GarageWorld } from '../../assets/render/webgl/GarageWorld.js';

const base = { zoom: 8, color: '#b12f3c', hood: false, lights: false, aspect: 16 / 9 };

// Direction from the car to the camera, in the car's own frame.
function viewDir(g) {
  const car = g.car;
  car.updateMatrixWorld(true);
  const local = g.camera.position.clone().applyMatrix4(car.matrixWorld.clone().invert());
  return new THREE.Vector2(local.x, local.z).normalize();
}

describe('workshop camera views', () => {
  it('rear, side and front views look at different sides of the car', () => {
    const g = new GarageWorld();
    const seen = {};
    for (const [name, angle] of [['rear', Math.PI + 0.45], ['side', Math.PI / 2 + 0.15], ['front', 0.35], ['hood', 0.6]]) {
      g.update({ ...base, angle });
      seen[name] = viewDir(g);
    }
    // rear is behind the car (-z), front is ahead (+z), side is mostly along x
    assert.ok(seen.rear.y < -0.7, 'rear view is behind the car');
    assert.ok(seen.front.y > 0.7, 'front view is in front of the car');
    assert.ok(Math.abs(seen.side.x) > 0.8, 'side view is beside the car');
    assert.ok(seen.hood.y > 0.5, 'hood view is in front of the car');
  });

  it('the hood opens and closes', () => {
    const g = new GarageWorld();
    g.update({ ...base, angle: 0.6, hood: false });
    assert.equal(g.hoodGroup.visible, false);
    g.update({ ...base, angle: 0.6, hood: true });
    assert.equal(g.hoodGroup.visible, true);
    assert.ok(Math.abs(g.flap.rotation.x) > 0.8, 'panel is raised');
    g.update({ ...base, angle: 0.6, hood: false });
    assert.equal(g.hoodGroup.visible, false);
    assert.equal(Math.abs(g.flap.rotation.x), 0);
  });
});
