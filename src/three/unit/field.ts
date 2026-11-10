import * as THREE from 'three';
import { patchMaterial } from '@onigam/lab-kit/three';
import { heatRampGlsl, heatStops } from '@onigam/lab-kit/sim/thermal';
import { HEARTH, UNIT, ZONES } from '../dims';
import { chipFlakes } from '../materials';
import type { GasState } from '../../sim/types';

// The temperature field of the unit along its axis, the model's: one profile of the zones' temperatures that every hot surface of the unit reads, in the unit's own frame (`vUnitY`, the object-space height), so that a colour is the same on the
// bed, the ring, the firebox, the nozzles and the grate, and a part that is lifted by the explode keeps its colours. The cut face of the bed is drawn in the lab's false colours, 20 to 1,400 °C (`heatStops`), the same ramp in every view; what glows
// on the curved surfaces is the fire's own light. The zones are drawn at their own heights (`ZONES` in `dims.ts`), not at the journey cursor's shares.

export const RAMP = { min: 20, max: 1400 } as const;
const STOPS = heatStops(RAMP.min, RAMP.max);
export const KNOTS = 10;

/** The uniforms every hot surface shares. */
export const FIELD = {
  uKnotY: { value: new Float32Array(KNOTS) },
  uKnotT: { value: new Float32Array(KNOTS) },
  /** The top of the chips, in U. Above it the bed is not drawn. */
  uLevel: { value: UNIT.height },
  /** 0 = the false colours of the model, 1 = off. Kept for a film. */
  uFalse: { value: 1 },
};

const KNOT_Y = [
  HEARTH.grateY - 0.02,
  (ZONES.reduction.y0 + ZONES.reduction.y1) / 2,
  ZONES.oxidation.y0,
  ZONES.oxidation.y1,
  (ZONES.pyrolysis.y0 + ZONES.pyrolysis.y1) / 2,
  (ZONES.drying.y0 + ZONES.drying.y1) / 2,
  ZONES.drying.y1,
  ZONES.drying.y1 + 0.3,
  UNIT.height - 0.12,
  UNIT.height,
];

/** The profile of the bed's temperature from the zones' temperatures. Zones of the model: reduction → hearth, oxidation → flame, pyrolysis, drying; the ends are what is around. */
export function setField(
  s: Pick<GasState, 'zoneDryingT' | 'zonePyrolysisT' | 'zoneOxidationT' | 'zoneReductionT' | 'outletT' | 'bunkerShare'>,
  ambient = 15,
): void {
  const T = [
    s.zoneReductionT * 0.88,
    s.zoneReductionT,
    s.zoneOxidationT,
    s.zoneOxidationT,
    s.zonePyrolysisT,
    s.zoneDryingT,
    s.zoneDryingT * 0.6,
    Math.max(ambient, s.zoneDryingT * 0.18),
    Math.max(ambient, s.zoneDryingT * 0.1),
    ambient,
  ];
  for (let i = 0; i < KNOTS; i++) {
    FIELD.uKnotY.value[i] = KNOT_Y[i]!;
    FIELD.uKnotT.value[i] = T[i]!;
  }
}

/** The bed's temperature at a height of U, the same function as the shader's, for the tests and the labels. */
export function fieldT(y: number): number {
  const ky = FIELD.uKnotY.value;
  const kt = FIELD.uKnotT.value;
  if (y <= ky[0]!) return kt[0]!;
  for (let i = 0; i < KNOTS - 1; i++) {
    if (y <= ky[i + 1]!) {
      const u = (y - ky[i]!) / Math.max(1e-6, ky[i + 1]! - ky[i]!);
      return kt[i]! + (kt[i + 1]! - kt[i]!) * u;
    }
  }
  return kt[KNOTS - 1]!;
}

const GLSL_COMMON = /* glsl */ `
  uniform float uKnotY[${KNOTS}];
  uniform float uKnotT[${KNOTS}];
  uniform float uLevel;
  varying float vUnitY;
  varying float vCapV;
  ${heatRampGlsl(STOPS)}
  float bedT( float y ) {
    if ( y <= uKnotY[0] ) return uKnotT[0];
    for ( int i = 0; i < ${KNOTS - 1}; i++ ) {
      if ( y <= uKnotY[i + 1] ) return mix( uKnotT[i], uKnotT[i + 1], ( y - uKnotY[i] ) / max( 1e-5, uKnotY[i + 1] - uKnotY[i] ) );
    }
    return uKnotT[${KNOTS - 1}];
  }
  vec3 incandescence( float T ) {
    float t = clamp( ( T - 520.0 ) / 760.0, 0.0, 1.0 );
    return vec3( 1.0, 0.34 * t, 0.04 * t * t ) * t * t * 4.2;
  }
`;

function attach(mat: THREE.Material, key: string, clip: boolean, cap: boolean, offset?: { value: number }): void {
  patchMaterial(mat, key, (shader) => {
    if (offset) shader.uniforms.uOffset = offset;
    shader.uniforms.uKnotY = FIELD.uKnotY;
    shader.uniforms.uKnotT = FIELD.uKnotT;
    shader.uniforms.uLevel = FIELD.uLevel;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying float vUnitY;\nvarying float vCapV;\n${cap ? 'attribute float aCap;' : ''}\n${offset ? 'uniform float uOffset;' : ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nvUnitY = position.y${offset ? ' + uOffset' : ''};\nvCapV = ${cap ? 'aCap' : '0.0'};`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL_COMMON}`)
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>\n${clip ? 'if ( vUnitY > uLevel + 0.002 ) discard;' : ''}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float fieldT_ = bedT( vUnitY );
        vec3 heat_ = heatRamp( fieldT_ );
        diffuseColor.rgb = mix( diffuseColor.rgb, heat_, vCapV );`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += incandescence( fieldT_ ) * ( 1.0 - vCapV ) + heat_ * 0.5 * vCapV;`,
      );
  });
}

/** The chip bed: chips on its curved faces, the false colours of the field on its cut face, clipped at the level of the chips. */
export function bedMaterial(offset?: { value: number }): THREE.MeshStandardMaterial {
  const base = chipFlakes().clone();
  base.name = offset ? 'bed-top' : 'bed';
  base.color.set(0xb59a70);
  base.side = THREE.DoubleSide;
  base.userData.noShare = true;
  // the mound rides the level: its own height is added to the geometry's, so that the field reads the height of the unit
  attach(base, offset ? 'bed-top' : 'bed-field', !offset, true, offset);
  return base;
}

/** Metal that takes the fire's colour where it is hot: the ring, the firebox, the nozzles, the grate. Not clipped: it stands where the chips are not. */
export function hotMetal(
  color: number,
  opts: { roughness?: number; metalness?: number; map?: THREE.Texture | null } = {},
): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: opts.metalness ?? 0.5,
    map: opts.map ?? null,
    side: THREE.DoubleSide,
  });
  m.userData.noShare = true;
  attach(m, 'hot-metal', false, false);
  return m;
}
