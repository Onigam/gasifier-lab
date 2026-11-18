import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createFarmScene, FARM_IDS } from './farm/scene';
import { WORLD } from './index';
import { stateWith, view } from './test-utils';

// Film round 5, N1 (docs/qa.md, « Film round 4: the scoped review »): the guide's `[[frame:farm-garage]]` passed the rays test with a birch's crown over the left third of the picture, because a crown beside the line of sight hides
// nothing of the part. Here every farm frame (each part as a click or a cue frames it, at 16:9 and on a phone held upright) is shot with rays against the trees and the farm's parts: no single tree before the framed part takes more than a tenth of the
// picture, and no crown in the picture stands nearer the eye than half the way to what is framed.

/** The kit's camera for a part's frame (`Stage.frameParts` with the world's padding, as `film4-guide-rays.test.ts` has it), on a 40-degree lens fitted in the narrower of its two fields. */
function framePose(
  mod: ReturnType<typeof createFarmScene>,
  id: string,
  aspect: number,
): { eye: THREE.Vector3; at: THREE.Vector3 } {
  const v = (40 * Math.PI) / 180;
  const fit = Math.min(v, 2 * Math.atan(Math.tan(v / 2) * aspect));
  const box = mod.registry.frameBounds(id);
  const at = box.getCenter(new THREE.Vector3());
  const r = box.getBoundingSphere(new THREE.Sphere()).radius;
  const padding = Math.min(WORLD.farm.partPadding, 1.9);
  const dir = mod.registry.get(id)!.viewDir!.clone().normalize();
  const d = Math.min(mod.maxDistance, Math.max(mod.minDistance, (r * padding) / Math.sin(fit / 2)));
  return { eye: at.clone().addScaledVector(dir, d), at };
}

describe('no tree crowds a farm frame (docs/qa.md, film round 4, N1)', () => {
  const farm = createFarmScene();
  farm.update(stateWith(), 1 / 60, view({ time: 1 }));
  farm.scene.updateMatrixWorld(true);
  const trees = farm.scene.getObjectByName('trees')!;
  const treeMeshes: THREE.InstancedMesh[] = [];
  trees.traverse((o) => {
    const m = o as THREE.InstancedMesh;
    if (m.isInstancedMesh && m.count > 0 && !/far-spruce/.test(m.name)) treeMeshes.push(m);
  });
  const partMeshes: THREE.Object3D[] = [];
  for (const p of farm.registry.parts.values())
    p.object.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && !(m as THREE.InstancedMesh).isInstancedMesh && !(m.material as THREE.Material).transparent)
        partMeshes.push(m);
    });
  const meshes = [...treeMeshes, ...partMeshes];

  it('the trees are there to be seen (the farm has its crowns)', () => {
    expect(treeMeshes.filter((m) => /crowns/.test(m.name)).length).toBeGreaterThan(3);
  });

  for (const [aspect, W, H] of [
    [16 / 9, 32, 18],
    [390 / 844, 12, 26],
  ] as const)
    for (const id of FARM_IDS)
      it(`${id} at ${aspect > 1 ? '16:9' : '390 × 844'}`, () => {
        const pose = framePose(farm, id, aspect);
        const cam = new THREE.PerspectiveCamera(40, aspect, 0.1, 5000);
        cam.position.copy(pose.eye);
        cam.lookAt(pose.at);
        cam.updateMatrixWorld(true);
        const reach = pose.eye.distanceTo(pose.at);
        const ray = new THREE.Raycaster();
        const by = new Map<string, number>();
        let nearest = Infinity;
        let nearestName = '';
        for (let j = 0; j < H; j++)
          for (let i = 0; i < W; i++) {
            ray.setFromCamera(new THREE.Vector2(-1 + (2 * (i + 0.5)) / W, -1 + (2 * (j + 0.5)) / H), cam);
            const hit = ray.intersectObjects(meshes, false)[0];
            // (a tree behind what is framed is the background it stands on; one before it is what N1 was)
            if (!hit || !treeMeshes.includes(hit.object as THREE.InstancedMesh) || hit.distance > reach) continue;
            const key = `${hit.object.name}#${hit.instanceId}`;
            by.set(key, (by.get(key) ?? 0) + 1);
            if (/crowns/.test(hit.object.name) && hit.distance < nearest) {
              nearest = hit.distance;
              nearestName = key;
            }
          }
        const worst = [...by.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['none', 0];
        expect(
          worst[1] / (W * H),
          `${worst[0]} covers ${((100 * worst[1]) / (W * H)).toFixed(0)} % of the picture`,
        ).toBeLessThan(0.1);
        expect(nearest, `${nearestName} at ${nearest.toFixed(1)} m, the part at ${reach.toFixed(1)} m`).toBeGreaterThan(
          0.5 * reach,
        );
      });
});
