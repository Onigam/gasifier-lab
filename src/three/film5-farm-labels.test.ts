import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { INSTALL } from '../data/install';
import { createFarmScene, DITCH_STRETCH } from './farm/scene';
import { PART_NAMES } from './part-ids';
import { stateWith, view } from './test-utils';

// Film round 5, M1 (docs/qa.md, « Film round 4: the scoped review »): the farm's French names « Grange à plaquettes » and « Tracteur à gaz de bois » ran out of the picture on a first visit at 768 and 390 px, and the install step « what the day left »
// framed the whole farm because of the 420 m ditch.

const farm = createFarmScene();
farm.update(stateWith(), 1 / 60, view({ time: 1 }));
farm.scene.updateMatrixWorld(true);

describe('the farm’s labels are short, its sheets keep the full names (docs/qa.md, film round 4, M1)', () => {
  it('every label shown at the overview (the main ones) is at most 17 characters in either language', () => {
    const main = farm.hotspots.filter((h) => !h.minor);
    expect(main.length).toBeGreaterThanOrEqual(4);
    for (const h of main) {
      expect(h.label.fr.length, h.label.fr).toBeLessThanOrEqual(17);
      expect(h.label.en.length, h.label.en).toBeLessThanOrEqual(17);
    }
    expect(farm.hotspots.find((h) => h.partId === 'chip-barn')!.label.fr).toBe('Grange');
  });

  it('the parts’ own names (the sheet, the list, the guide’s text) are the research’s, unchanged', () => {
    expect(PART_NAMES.find((p) => p.id === 'chip-barn')!.fr).toBe('Grange à plaquettes');
    expect(PART_NAMES.find((p) => p.id === 'wood-gas-tractor')!.fr).toBe('Tracteur à gaz de bois');
  });
});

describe('the step « what the day left » frames the residues, not the farm (docs/qa.md, film round 4, minor 5)', () => {
  const step = INSTALL.find((s) => s.id === 'residues')!;

  it('its parts’ boxes, as the kit unites them, hold the bin, the barrel and a stretch of the ditch in under 20 m', () => {
    expect(step.parts).toEqual(['ash-bin', 'condensate-barrel', 'field-ditch']);
    const box = new THREE.Box3();
    for (const id of step.parts) box.union(farm.registry.bounds(id));
    expect(box.getSize(new THREE.Vector3()).length()).toBeLessThan(20);
    for (const id of ['ash-bin', 'condensate-barrel']) expect(box.containsBox(farm.registry.bounds(id)), id).toBe(true);
    const ditch = farm.registry.bounds('field-ditch');
    expect(ditch.isEmpty()).toBe(false);
    expect(DITCH_STRETCH.containsBox(ditch)).toBe(true);
  });

  it('the ditch framed alone (a click) is still its own long box, and the overview is not changed by the stretch', () => {
    expect(farm.registry.frameBounds('field-ditch').getSize(new THREE.Vector3()).x).toBeGreaterThan(15);
    const all = new THREE.Box3();
    for (const p of farm.registry.parts.values()) if (p.id !== 'field-ditch') all.union(farm.registry.bounds(p.id));
    expect(all.containsBox(farm.registry.bounds('field-ditch'))).toBe(true);
  });
});
