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
  uniform float uGlow;
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
  // the glow of hot metal: a dull cherry red from about 520 °C that turns orange only near the top of the ramp, so that a hot part stays metal beside the false colours of the bed, which are bright (docs/3d.md, « The hot parts »)
  vec3 incandescence( float T ) {
    float t = clamp( ( T - 520.0 ) / 760.0, 0.0, 1.0 );
    return vec3( 1.0, 0.2 * t, 0.012 * t * t ) * t * t * 1.0;
  }
`;

/**
 * How a surface reads the field: `surface` is a face of the bed or a hot part (the vertex's own height; a cap takes the false colour whole), `chip` is one instance of a loose piece lying on the cut face (the height of the instance, its colour from the field
 * times the piece's own tone, its own glow), so that the pieces of the section are shapes with relief and not a pattern.
 */
type Reads = 'surface' | 'chip';

function attach(
  mat: THREE.Material,
  key: string,
  clip: boolean,
  cap: boolean,
  offset?: { value: number },
  glow = 1,
  reads: Reads = 'surface',
  capDim = 1,
): void {
  patchMaterial(mat, key, (shader) => {
    if (offset) shader.uniforms.uOffset = offset;
    shader.uniforms.uKnotY = FIELD.uKnotY;
    shader.uniforms.uKnotT = FIELD.uKnotT;
    shader.uniforms.uLevel = FIELD.uLevel;
    shader.uniforms.uGlow = { value: glow };
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying float vUnitY;\nvarying float vCapV;\n${reads === 'chip' ? 'varying float vChipD;\nvarying vec2 vChipL;' : ''}\n${cap ? 'attribute float aCap;' : ''}\n${offset ? 'uniform float uOffset;' : ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\nvUnitY = ${reads === 'chip' ? '( instanceMatrix * vec4( position, 1.0 ) ).y' : 'position.y'}${offset ? ' + uOffset' : ''};\nvCapV = ${cap ? 'aCap' : '0.0'};${reads === 'chip' ? '\nvChipD = length( cameraPosition - ( modelMatrix * instanceMatrix * vec4( position, 1.0 ) ).xyz );\nvChipL = position.xy;' : ''}`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\n${reads === 'chip' ? 'varying float vChipD;\nvarying vec2 vChipL;\nfloat cH( float x ) { return fract( sin( x * 12.9898 ) * 43758.5453 ); }\n' : ''}${GLSL_COMMON}`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>\n${clip ? 'if ( vUnitY > uLevel + 0.002 ) discard;' : ''}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float fieldT_ = bedT( vUnitY );
        vec3 heat_ = heatRamp( fieldT_ );
        ${
          reads === 'chip'
            ? `float nearChip_ = 1.0 - smoothstep( 3.2, 6.0, vChipD );
        // the wood's grain: fine lines along the flake's length, a few dark ones where the growth rings run out, the end grain a little darker at both ends of the flake; only near, where a line is more than a pixel
        float grainNear_ = 1.0 - smoothstep( 0.9, 2.4, vChipD );
        float ringsAt_ = vChipL.y * 1050.0 + 2.2 * sin( vChipL.x * 190.0 + vChipL.y * 90.0 );
        float grain_ = 0.5 + 0.5 * sin( ringsAt_ ) * ( 0.55 + 0.45 * cH( floor( ringsAt_ / 6.2831853 ) ) );
        float endGrain_ = smoothstep( 0.0075, 0.0112, abs( vChipL.x ) );
        float woodTone_ = 1.0 - grainNear_ * ( 0.26 * ( 1.0 - grain_ ) + 0.18 * endGrain_ );
        diffuseColor.rgb = mix( heat_ * ${capDim.toFixed(3)}, diffuseColor.rgb * heat_ * 1.04 * woodTone_, nearChip_ );`
            : `diffuseColor.rgb = mix( diffuseColor.rgb, heat_ * ${capDim.toFixed(3)}, vCapV );`
        }`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        ${reads === 'chip' ? `totalEmissiveRadiance += incandescence( fieldT_ ) * uGlow + heat_ * mix( ${(0.5 * capDim).toFixed(3)}, 0.26, nearChip_ );` : `totalEmissiveRadiance += incandescence( fieldT_ ) * uGlow * ( 1.0 - vCapV ) + heat_ * ${(0.5 * capDim).toFixed(3)} * vCapV;`}`,
      );
  });
}

/** The chip bed: chips on its curved faces, the false colours of the field on its cut face, clipped at the level of the chips. */
export function bedMaterial(offset?: { value: number }, capDim = 1): THREE.MeshStandardMaterial {
  const base = chipFlakes().clone();
  base.name = offset ? 'bed-top' : 'bed';
  base.color.set(0xb59a70);
  base.side = THREE.DoubleSide;
  base.userData.noShare = true;
  // the mound rides the level: its own height is added to the geometry's, so that the field reads the height of the unit
  attach(base, offset ? `bed-top:${capDim}` : `bed-field:${capDim}`, !offset, true, offset, 1, 'surface', capDim);
  return base;
}

/** The loose pieces of the section (chips, charcoal) lying on the cut face of the bed: an instanced mesh takes this. Clipped at the level of the chips like the bed, coloured by the field at the piece's height. */
export function chipMaterial(capDim = 1): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0 });
  m.userData.noShare = true;
  m.name = 'bed-chips';
  // from a few metres the pieces take the colour of the face they lie on, so that a bed seen from afar is the clean gradient it was and no field of sub-pixel edges (docs/qa.md D16)
  attach(m, `bed-chips:${capDim}`, true, false, undefined, 1, 'chip', capDim);
  return m;
}

/** Metal that takes the fire's colour where it is hot: the ring, the firebox, the nozzles, the grate. Not clipped: it stands where the chips are not. */
export function hotMetal(
  color: number,
  opts: { roughness?: number; metalness?: number; map?: THREE.Texture | null; glow?: number } = {},
): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.7,
    metalness: opts.metalness ?? 0.5,
    map: opts.map ?? null,
    side: THREE.DoubleSide,
  });
  m.userData.noShare = true;
  attach(m, 'hot-metal', false, false, undefined, opts.glow ?? 1);
  return m;
}
