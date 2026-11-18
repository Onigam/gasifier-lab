import * as THREE from 'three';
import { patchMaterial } from '@onigam/lab-kit/three';

// A chip of wood as a chipper leaves it, and not a card: a flake cut across the grain at an angle by the knife (its two ends slanted the same way), split along the grain (edges that are not parallel, one end ragged where the fibres broke), thick at one end and feathered at the
// other, a little bowed. One blank for every chip (a flat piece of the reported length, width and thickness with enough points round its outline to take a shape) and four numbers a piece; the shape is given in the vertex shader from those four numbers, so that a bed of two
// thousand chips is still one draw call and no two chips are the same. Every move is inward: a shaped chip lies inside its blank's box, so that what is measured of a bed (its box, the side of the cut it lies on) is measured on the blank.

/** How many points the outline of the blank has along a long edge and across an end (the corners counted once each). */
const ALONG = 4;
const ACROSS = 3;

/**
 * The blank: a plate `length` (x) by `width` (y) by `thick` (z), centred, its outline a ring of points (along the long edges and across the ends), a fan of triangles on each face and a band round the edge. Indexed; the material is flat-shaded, so that a shaped chip is lit by
 * its own faces.
 */
export function chipBlank(length: number, width: number, thick: number): THREE.BufferGeometry {
  const ring: [number, number][] = [];
  const hl = length / 2;
  const hw = width / 2;
  for (let i = 0; i < ALONG; i++) ring.push([-hl + (length * i) / ALONG, -hw]);
  for (let i = 0; i < ACROSS; i++) ring.push([hl, -hw + (width * i) / ACROSS]);
  for (let i = 0; i < ALONG; i++) ring.push([hl - (length * i) / ALONG, hw]);
  for (let i = 0; i < ACROSS; i++) ring.push([-hl, hw - (width * i) / ACROSS]);
  const n = ring.length;
  const pos: number[] = [];
  const idx: number[] = [];
  // two faces (their own points: a face and the band do not share a normal), each a fan about its middle
  for (const z of [thick / 2, -thick / 2]) {
    const c = pos.length / 3;
    pos.push(0, 0, z);
    for (const [x, y] of ring) pos.push(x, y, z);
    for (let i = 0; i < n; i++) {
      const a = c + 1 + i;
      const b = c + 1 + ((i + 1) % n);
      if (z > 0) idx.push(c, a, b);
      else idx.push(c, b, a);
    }
  }
  // the band round the edge
  const e = pos.length / 3;
  for (const [x, y] of ring) pos.push(x, y, thick / 2, x, y, -thick / 2);
  for (let i = 0; i < n; i++) {
    const a = e + 2 * i;
    const b = e + 2 * ((i + 1) % n);
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  g.userData.chip = { length, width, thick };
  return g;
}

/** Four numbers a chip, each 0 to 1 (the slant of the cut, the ragged end, the taper, the bow), as an attribute of the instances of `geometry`. */
export function chipSeeds(geometry: THREE.BufferGeometry, count: number, random: () => number): void {
  const a = new Float32Array(count * 4);
  for (let i = 0; i < a.length; i++) a[i] = random();
  geometry.setAttribute('aChip', new THREE.InstancedBufferAttribute(a, 4));
}

/** The shape of one chip, the same arithmetic as the shader's, for the tests: where the blank's point (x, y, z) goes for the four numbers `r`. */
export function chipPoint(
  p: [number, number, number],
  r: [number, number, number, number],
  size: { length: number; width: number; thick: number },
): [number, number, number] {
  const hl = size.length / 2;
  const hw = size.width / 2;
  const ht = size.thick / 2;
  const u = p[0] / hl;
  const v = p[1] / hw;
  const sgn = Math.sign(u);
  const end = Math.abs(u) > 0.99 ? 1 : 0;
  const fract = (x: number): number => x - Math.floor(x);
  const hash = fract(Math.sin(v * 3.1 * 12.9898 + sgn * 1.7 * 78.233 + r[1] * 9.0 * 37.719) * 43758.5453);
  const edge = fract(Math.sin(u * 2.3 * 12.9898 + Math.sign(v) * 1.3 * 78.233 + r[2] * 7.0 * 37.719) * 43758.5453);
  let x = p[0] * 0.72 + (r[0] - 0.5) * 0.56 * hw * v;
  const ragged = sgn * (r[2] - 0.5) > 0 ? 0.3 : 0.07;
  x -= sgn * end * hl * ragged * hash;
  const narrow = 0.5 + 0.5 * u * Math.sign(r[3] - 0.5);
  let y = p[1] * (1 - narrow * 1.1 * Math.abs(r[3] - 0.5));
  y *= 1 - (1 - end) * 0.2 * edge;
  const thin = 0.5 + 0.5 * u * Math.sign(r[1] - 0.5);
  let z = p[2] * (1 - 0.75 * thin * r[0]);
  z += (u * u - 0.45) * ht * (r[3] - 0.5) * 1.1;
  return [x, y, z];
}

/**
 * Give the instances of a material their chip's shape (the vertex shader moves the blank's points by the four numbers of `aChip`) and light them by their own faces. `grain`: also the wood's grain, for a material that has none of its own (lines along the chip, a darker end
 * grain, a paler sapwood edge; faded where a line is finer than a pixel).
 */
export function chipShape(
  mat: THREE.MeshStandardMaterial,
  size: { length: number; width: number; thick: number },
  grain = false,
): void {
  mat.flatShading = true;
  mat.userData.noShare = true;
  const f = (x: number): string => x.toFixed(5);
  patchMaterial(mat, `chip-shape:${grain}`, (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\nattribute vec4 aChip;\n${grain ? 'varying vec3 vChipW;' : ''}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        {
          float cu = position.x / ${f(size.length / 2)};
          float cv = position.y / ${f(size.width / 2)};
          float csg = sign( cu );
          float cend = step( 0.99, abs( cu ) );
          float chash = fract( sin( cv * 3.1 * 12.9898 + csg * 1.7 * 78.233 + aChip.y * 9.0 * 37.719 ) * 43758.5453 );
          float cedge = fract( sin( cu * 2.3 * 12.9898 + sign( cv ) * 1.3 * 78.233 + aChip.z * 7.0 * 37.719 ) * 43758.5453 );
          // the knife's cut: both ends slanted the same way
          transformed.x = position.x * 0.72 + ( aChip.x - 0.5 ) * 0.56 * ${f(size.width / 2)} * cv;
          // one end ragged, where the fibres broke; the other nearly clean
          float cragged = csg * ( aChip.z - 0.5 ) > 0.0 ? 0.3 : 0.07;
          transformed.x -= csg * cend * ${f(size.length / 2)} * cragged * chash;
          // split along the grain: narrower at one end, the long edges uneven
          float cnarrow = 0.5 + 0.5 * cu * sign( aChip.w - 0.5 );
          transformed.y = position.y * ( 1.0 - cnarrow * 1.1 * abs( aChip.w - 0.5 ) );
          transformed.y *= 1.0 - ( 1.0 - cend ) * 0.2 * cedge;
          // thick at one end, feathered at the other, a little bowed
          float cthin = 0.5 + 0.5 * cu * sign( aChip.y - 0.5 );
          transformed.z = position.z * ( 1.0 - 0.75 * cthin * aChip.x );
          transformed.z += ( cu * cu - 0.45 ) * ${f(size.thick / 2)} * ( aChip.w - 0.5 ) * 1.1;
        }
        ${grain ? 'vChipW = vec3( position.xy, aChip.x );' : ''}`,
      );
    if (!grain) return;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vChipW;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          float rings = vChipW.y * 1050.0 + 2.2 * sin( vChipW.x * 190.0 + vChipW.z * 40.0 );
          float line = 0.5 + 0.5 * sin( rings );
          // a line of the grain finer than a pixel is not drawn
          float fine = 1.0 - smoothstep( 0.5, 1.6, fwidth( rings ) );
          float ends = smoothstep( ${f(size.length * 0.3)}, ${f(size.length * 0.36)}, abs( vChipW.x ) );
          diffuseColor.rgb *= 1.0 - fine * 0.22 * ( 1.0 - line ) - 0.16 * ends;
        }`,
      );
  });
}
