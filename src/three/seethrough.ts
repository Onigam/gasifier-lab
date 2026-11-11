import * as THREE from 'three';
import { GHOST, type PartRegistry } from '@onigam/lab-kit/three';

// « X-ray while selected » (docs/kit-requests.md, 13), done by the lab: while a part that stands inside another is the one selected, the parts in front of it go to the ghost, so that it reads as itself and not as an outline on a
// flank. The registry owns what a part shows (solid, ghost, wire, hidden) and the kit's display controller sets it every frame; this does not touch that. It only swaps the material of the meshes of a part the registry shows solid, and gives
// the solid one back as soon as the list changes or the registry takes over (X-ray, isolate, a part hidden).

export class SeeThrough {
  /** The meshes this has put on the ghost. */
  private readonly mine = new Set<THREE.Mesh>();

  /** `ids`: the parts to show through now (none to give everything back). `stay`: meshes of those parts that stay solid (what the part selected rides on). Call every frame, after the display controller. */
  update(reg: PartRegistry, ids: readonly string[], stay: (m: THREE.Mesh) => boolean = () => false): void {
    const want = new Set(ids);
    for (const [id, e] of reg.parts) {
      const solid = e.display === 'solid';
      for (const m of e.meshes) {
        if (want.has(id) && solid && !stay(m)) {
          if (m.material !== GHOST) {
            m.material = GHOST;
            m.castShadow = false;
          }
          this.mine.add(m);
        } else if (this.mine.has(m)) {
          // given back unless the registry has already done it (it restores the solid material itself on a change of display)
          if (m.material === GHOST && solid) {
            m.material = m.userData.solidMaterial as THREE.Material;
            m.castShadow = m.userData.noShadow !== true;
          }
          this.mine.delete(m);
        }
      }
    }
  }

  /** How many meshes are on the ghost because of this (a test reads it). */
  get count(): number {
    return this.mine.size;
  }
}
