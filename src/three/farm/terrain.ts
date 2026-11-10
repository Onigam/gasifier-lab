import * as THREE from 'three';
import { grassDetail, patchMaterial } from '@onigam/lab-kit/three';
import { smoothstep } from '../common';
import { fbm, grassMap, gravelMap, soilMap, tiled } from '../textures';
import { FARM } from '../dims';

// The land of the farm, in southern Sweden around 1970: a flat clearing in rolling country, the yard in gravel round the buildings, the big field to the south in ploughed soil, a drainage ditch between the yard and the field, a lane going east, meadow
// and the first trees beyond. One mesh on a tensor grid, fine where the ditch is cut and near the buildings, coarse to the horizon. The surface is computed per pixel from the position: gravel, soil, meadow, wet bank.

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

/** The cross-section of the ditch at a distance from its middle line: a trench with banks, a flat wet bottom. Depth in metres below the land. */
export function ditchDepth(d: number): number {
  const a = Math.abs(d);
  const bottom = FARM.ditch.width / 2;
  const top = bottom + FARM.ditch.depth * FARM.ditch.slope;
  if (a >= top) return 0;
  if (a <= bottom) return FARM.ditch.depth;
  const u = (a - bottom) / (top - bottom);
  // a rounded shoulder at the top, a straight bank below
  return FARM.ditch.depth * (1 - u) ** 1.25;
}

/** The land's height at a point: the rolling country, flat on the pads of the buildings and the yard, the field's gentle fall, the ditch. */
export function terrainHeight(x: number, z: number): number {
  const r = Math.hypot(x - FARM.yard.x, z - FARM.yard.z);
  const far = smoothstep(60, 320, r);
  const roll =
    (fbm(x * 0.004 + 4, z * 0.004 - 7, 4) - 0.5) * 24 * far +
    (fbm(x * 0.02 + 5, z * 0.02, 3) - 0.5) * 2.2 * smoothstep(20, 90, r);
  const near = (fbm(x * 0.05, z * 0.05, 2) - 0.5) * 0.18 * smoothstep(25, 70, r);
  let h = roll + near;
  // the clearing's own level, nearly flat, falling a little to the field and the ditch
  const flat = 1 - smoothstep(55, 120, r);
  h *= 1 - 0.92 * flat;
  h -= 0.0009 * Math.max(0, z) * flat;
  // the ditch along x at z = ditch.z
  const dd = ditchDepth(z - FARM.ditch.z);
  if (dd > 0 && Math.abs(x) < FARM.ditch.length / 2 + 20)
    h -= dd * (1 - smoothstep(FARM.ditch.length / 2, FARM.ditch.length / 2 + 20, Math.abs(x)));
  return h;
}

/** Coordinates of the grid, graded: fine in the middle, coarse at the edge; `fine` metres inside `inner`. */
function gradedAxis(half: number, inner: number, fine: number, extra: number[] = []): number[] {
  const out = new Set<number>();
  for (let v = -inner; v <= inner + 1e-6; v += fine) out.add(Math.round(v * 100) / 100);
  let step = fine;
  for (let v = inner; v < half;) {
    step = Math.min(step * 1.18, 60);
    v += step;
    out.add(Math.round(v * 100) / 100);
    out.add(-Math.round(v * 100) / 100);
  }
  for (const e of extra) out.add(e);
  return [...out].sort((a, b) => a - b);
}

export interface Terrain {
  mesh: THREE.Mesh;
  vertices: number;
}

export function buildTerrain(): Terrain {
  const xs = gradedAxis(3000, 100, 2.5);
  // rows: fine across the ditch (every 0.4 m for 8 m), coarser round it, graded to the horizon
  const rows = new Set<number>();
  for (let z = FARM.ditch.z - 4; z <= FARM.ditch.z + 4.001; z += 0.4) rows.add(Math.round(z * 10) / 10);
  for (const z of gradedAxis(3000, 100, 2.5)) if (Math.abs(z - FARM.ditch.z) > 4.2) rows.add(z);
  const zs = [...rows].sort((a, b) => a - b);
  const nx = xs.length;
  const nz = zs.length;
  const pos = new Float32Array(nx * nz * 3);
  const idx: number[] = [];
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const k = (j * nx + i) * 3;
      pos[k] = xs[i]!;
      pos[k + 1] = terrainHeight(xs[i]!, zs[j]!);
      pos[k + 2] = zs[j]!;
    }
  for (let j = 0; j < nz - 1; j++)
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i;
      const b = a + 1;
      const c = a + nx;
      const d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  const grass = grassMap();
  const gravel = tiled(gravelMap(), 1, 1);
  const soil = tiled(soilMap(), 1, 1);
  patchMaterial(mat, 'farm-land', (shader) => {
    shader.uniforms.uGrass = { value: grass };
    shader.uniforms.uGravel = { value: gravel };
    shader.uniforms.uSoil = { value: soil };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLandP;\nvarying vec3 vLandN;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvLandN = objectNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLandP = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vLandP;
        varying vec3 vLandN;
        uniform sampler2D uGrass;
        uniform sampler2D uGravel;
        uniform sampler2D uSoil;
        float lHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
        float lNoise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( lHash( i ), lHash( i + vec2( 1.0, 0.0 ) ), u.x ), mix( lHash( i + vec2( 0.0, 1.0 ) ), lHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }
        float lFbm( vec2 p ) { return 0.55 * lNoise( p ) + 0.3 * lNoise( p * 2.3 + 7.1 ) + 0.15 * lNoise( p * 5.1 + 2.7 ); }`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec2 p = vLandP.xz;
          float dist = length( cameraPosition - vLandP );
          float nearF = 1.0 - smoothstep( 40.0, 160.0, dist );
          float broad = lFbm( p * 0.012 );
          vec3 meadow = mix( vec3( 0.2, 0.29, 0.11 ), vec3( 0.36, 0.41, 0.15 ), broad );
          meadow *= 0.78 + 0.5 * mix( texture2D( uGrass, p * 0.31 ).r, 0.5, smoothstep( 30.0, 140.0, dist ) );
          // the far country goes darker and bluer: forest and distance
          float farM = smoothstep( 120.0, 700.0, length( p - vec2( ${FARM.yard.x.toFixed(1)}, ${FARM.yard.z.toFixed(1)} ) ) );
          meadow = mix( meadow, vec3( 0.11, 0.17, 0.1 ), farM * 0.55 * smoothstep( 0.35, 0.75, lFbm( p * 0.004 + 3.0 ) ) );
          // the yard and the lane: gravel and packed earth
          float rYard = length( p - vec2( ${FARM.yard.x.toFixed(1)}, ${FARM.yard.z.toFixed(1)} ) * 1.0 );
          float yard = 1.0 - smoothstep( ${FARM.yard.r.toFixed(1)}, ${(FARM.yard.r + 5).toFixed(1)}, rYard + 4.0 * ( lNoise( p * 0.4 ) - 0.5 ) );
          float lane = ( 1.0 - smoothstep( ${(FARM.lane.width / 2).toFixed(2)}, ${(FARM.lane.width / 2 + 0.7).toFixed(2)}, abs( p.y - ${FARM.lane.z.toFixed(2)} + 1.6 * sin( p.x * 0.03 ) ) ) ) * step( 0.0, p.x ) * ( 1.0 - 0.0 * p.x );
          float trk = ( 1.0 - smoothstep( ${(FARM.track.width / 2).toFixed(2)}, ${(FARM.track.width / 2 + 0.7).toFixed(2)}, abs( p.x - ${FARM.track.x.toFixed(2)} ) ) ) * step( -4.0, p.y ) * step( p.y, ${(FARM.field.z0 + 6).toFixed(1)} );
          float gravelM = max( max( yard, lane ), trk );
          vec3 gr = texture2D( uGravel, p * 0.8 ).rgb * mix( 1.0, 0.9, farM );
          gr = mix( gr, vec3( 0.34, 0.3, 0.24 ) * 1.1, 0.35 + 0.2 * lNoise( p * 0.2 ) );
          // wheel ruts and darker trodden ground near the doors
          float rut = smoothstep( 0.35, 0.0, abs( abs( p.y - ${FARM.lane.z.toFixed(2)} + 1.6 * sin( p.x * 0.03 ) ) - 0.85 ) ) * lane * nearF * 0.3;
          gr *= 1.0 - rut;
          // the field: ploughed soil, furrows along x, edges broken by noise
          float fz = smoothstep( ${(FARM.field.z0 - 0.6).toFixed(2)}, ${(FARM.field.z0 + 0.6).toFixed(2)}, p.y + 1.4 * ( lNoise( p * 0.15 ) - 0.5 ) );
          float fx = 1.0 - smoothstep( ${(FARM.field.x1 - 6).toFixed(1)}, ${FARM.field.x1.toFixed(1)}, abs( p.x ) + 5.0 * ( lNoise( p * 0.1 + 9.0 ) - 0.5 ) );
          float fz1 = 1.0 - smoothstep( ${(FARM.field.z1 - 6).toFixed(1)}, ${FARM.field.z1.toFixed(1)}, p.y + 6.0 * ( lNoise( p * 0.08 + 4.0 ) - 0.5 ) );
          float field = fz * fx * fz1;
          vec3 sc = texture2D( uSoil, vec2( p.x * 0.5, p.y * 0.5 ) ).rgb;
          sc = mix( sc * vec3( 0.62, 0.5, 0.38 ), vec3( 0.2, 0.14, 0.09 ), 0.3 + 0.25 * lFbm( p * 0.03 ) );
          // a stripe of the headland, harrowed and paler, round the field
          float head = field * smoothstep( 4.0, 0.0, min( min( abs( p.y - ${FARM.field.z0.toFixed(2)} ), abs( abs( p.x ) - ${FARM.field.x1.toFixed(1)} ) ), abs( p.y - ${FARM.field.z1.toFixed(1)} ) ) );
          sc = mix( sc, vec3( 0.34, 0.26, 0.18 ), head * 0.5 );
          vec3 c = meadow;
          c = mix( c, sc, field );
          c = mix( c, gr, gravelM );
          // the ditch's wet banks: dark, grassy
          float below = smoothstep( 0.05, -0.55, vLandP.y );
          c = mix( c, vec3( 0.12, 0.13, 0.08 ), below * 0.75 );
          diffuseColor.rgb = c;
        }`,
      );
  });
  mat.customProgramCacheKey = () => 'farm-land';
  grassDetail(mat);
  const mesh = new THREE.Mesh(g, mat);
  mesh.name = 'land';
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return { mesh, vertices: pos.length / 3 };
}

void lerp;
