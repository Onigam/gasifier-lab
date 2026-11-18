import * as THREE from 'three';
import { patchMaterial, rng } from '@onigam/lab-kit/three';
import { smoothstep } from './common';
import { createSky, type SkyRig } from './farm/sky';
import { farSpruce, leafMaterial, leafMips } from './farm/trees';
import { concreteMap, fbm, grassMap, gravelMap, soilMap, tiled } from './textures';

// The open air round a machine or a building: a sky with its sun, a yard of gravel with a slab of concrete where the machine stands, a meadow, a tree line and two ridges at the horizon, all procedural (no texture file, no text). The machine worlds
// stood on a paper studio and the garage on a flat plain of one colour; a film shows them from the front and the eye must find a ground, its contact shadows and a horizon (docs/3d.md, « Film round 1 »). The farm has its own land (`farm/terrain.ts`) and
// uses only the sky of this family.

export interface YardOptions {
  name: string;
  /** Where the light comes from, as each world always had it (a key light's position and the point it lights): the sun is along that line. */
  key: [number, number, number];
  target: [number, number, number];
  /** Half the width of the sun's shadow box, in metres: the shadow's texel is 2 / 2048 of it. */
  shadowHalf: number;
  exposure?: number;
  /** The concrete slab the machine stands on: x0, z0, x1, z1, its top at y = 0. Omitted: none (the garage has its own floor and apron). */
  slab?: readonly [number, number, number, number];
  /** Level of the gravel round the slab, under its top: a slab is a few centimetres proud of the yard. */
  groundY?: number;
  /** Where the yard's gravel gives way to meadow, in metres from the middle of the world. */
  yardRadius?: number;
  /** The z of the wheel lines worn into the gravel along x (a machine that rolls on the spot rolls in them). */
  ruts?: readonly number[];
  /**
   * A meadow with relief round the yard, for a world whose ground is in the picture from the height of a man (the garage): tufts of grass standing out of the turf and stones lying in it, out to `within` metres of the middle, none where `keepOut` says a building or a slab
   * stands; and a track worn into the ground along `track` (x, z points), two wheel lines and the grass between them.
   */
  meadow?: {
    tufts: number;
    stones: number;
    within: number;
    keepOut?: (x: number, z: number) => boolean;
    track?: readonly (readonly [number, number])[];
  };
}

export interface Yard {
  scene: THREE.Scene;
  sky: SkyRig;
  land: THREE.Mesh;
  slab: THREE.Mesh | null;
  horizon: THREE.Group;
  /** The ground's pattern runs along x by this much: a machine that rolls on the spot (`tractor`) rolls on its ground. */
  scroll(x: number): void;
  /** Lay the slab out again once the world knows where its machine stands (the gas line is laid out after the yard is made). */
  fitSlab(x0: number, z0: number, x1: number, z1: number): void;
}

/** The sun's direction from a key light as the worlds placed it: the same side, between 30 and 52 degrees up so that shadows have a length. */
export function sunFrom(key: readonly number[], target: readonly number[]): THREE.Vector3 {
  const d = new THREE.Vector3(key[0]! - target[0]!, key[1]! - target[1]!, key[2]! - target[2]!).normalize();
  const h = Math.hypot(d.x, d.z) || 1;
  const el = Math.min((52 * Math.PI) / 180, Math.max((30 * Math.PI) / 180, Math.asin(d.y)));
  return new THREE.Vector3((d.x / h) * Math.cos(el), Math.sin(el), (d.z / h) * Math.cos(el));
}

// ------------------------------------------------------------------------------------------------ the land

const NOISE = /* glsl */ `
  float yHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
  float yNoise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( yHash( i ), yHash( i + vec2( 1.0, 0.0 ) ), u.x ), mix( yHash( i + vec2( 0.0, 1.0 ) ), yHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }
  float yFbm( vec2 p ) { return 0.55 * yNoise( p ) + 0.3 * yNoise( p * 2.3 + 7.1 ) + 0.15 * yNoise( p * 5.1 + 2.7 ); }
  float ySeg( vec2 p, vec2 a, vec2 b ) { vec2 pa = p - a; vec2 ba = b - a; return length( pa - ba * clamp( dot( pa, ba ) / dot( ba, ba ), 0.0, 1.0 ) ); }
`;

/** The ground: gravel packed by wheels round the machine, going to rough meadow, then to the dark of the forest floor. One disc, the surface computed per pixel from the position. */
function landMaterial(
  yardR: number,
  scroll: { value: number },
  ruts: readonly number[],
  track: readonly (readonly [number, number])[] = [],
): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  const gravel = tiled(gravelMap(), 1, 1);
  const grass = grassMap();
  const soil = tiled(soilMap(), 1, 1);
  const rutGlsl = ruts
    .map((z) => `rut = max( rut, exp( -pow( ( p.y - ${z.toFixed(3)} ) / 0.2, 2.0 ) ) );`)
    .join('\n          ');
  // the track: the distance to its line, segment by segment
  const trackGlsl = track
    .slice(1)
    .map((b, i) => {
      const a = track[i]!;
      return `td = min( td, ySeg( w, vec2( ${a[0].toFixed(2)}, ${a[1].toFixed(2)} ), vec2( ${b[0].toFixed(2)}, ${b[1].toFixed(2)} ) ) );`;
    })
    .join('\n          ');
  const key = `yard-land:${yardR}:${ruts.join(',')}:${track.map((t) => t.join(' ')).join(',')}`;
  patchMaterial(mat, key, (shader) => {
    shader.uniforms.uGravel = { value: gravel };
    shader.uniforms.uGrass = { value: grass };
    shader.uniforms.uSoil = { value: soil };
    shader.uniforms.uScroll = scroll;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vYardP;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvYardP = ( modelMatrix * vec4( position, 1.0 ) ).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vYardP;
        uniform sampler2D uGravel;
        uniform sampler2D uGrass;
        uniform sampler2D uSoil;
        uniform float uScroll;
        ${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec2 p = vYardP.xz + vec2( uScroll, 0.0 );
          vec2 w = vYardP.xz;
          float dist = length( cameraPosition - vYardP );
          float r = length( w );
          // gravel, packed and stained, a finer sample close to the eye so that stones read at a few metres
          float nearF = 1.0 - smoothstep( 5.0, 28.0, dist );
          vec3 gr = texture2D( uGravel, p * 0.8 ).rgb;
          gr *= 0.78 + 0.5 * mix( 0.5, texture2D( uGravel, p * 3.3 ).g, nearF );
          gr = mix( gr, vec3( 0.36, 0.32, 0.26 ), 0.3 + 0.2 * yNoise( p * 0.35 ) );
          // the wheel lines: the gravel pressed down and darker where a machine's tyres have run
          float rut = 0.0;
          ${rutGlsl}
          gr *= 1.0 - 0.28 * rut * mix( 0.85, 0.7 + 0.3 * yNoise( vec2( p.x * 1.3, p.y * 6.0 ) ), nearF );
          // a little grass through the gravel at the edge of the yard, a meadow beyond
          float edge = smoothstep( ${(yardR * 0.55).toFixed(1)}, ${(yardR * 1.4).toFixed(1)}, r + 4.0 * ( yNoise( w * 0.25 ) - 0.5 ) );
          float broad = yFbm( w * 0.03 );
          // (a deeper green than it was: under the open sun the paler one read as a plain of one pale tone, and the machine on it as a small thing in flat light)
          vec3 meadow = mix( vec3( 0.15, 0.23, 0.08 ), vec3( 0.25, 0.31, 0.11 ), broad );
          meadow *= 0.78 + 0.5 * mix( texture2D( uGrass, w * 0.31 ).r, 0.5, smoothstep( 30.0, 140.0, dist ) );
          // a meadow is not a lawn: near the eye the blades themselves, darker rounds of clover, drier and yellower turf where the ground is thin, a few daisies; each of them fades out where it would be finer than a pixel
          float nearM = 1.0 - smoothstep( 5.0, 26.0, dist );
          meadow *= mix( 1.0, 0.7 + 0.6 * texture2D( uGrass, w * 1.9 ).r, nearM );
          float midM = 1.0 - smoothstep( 35.0, 110.0, dist );
          meadow = mix( meadow, vec3( 0.12, 0.23, 0.09 ), 0.7 * midM * smoothstep( 0.5, 0.66, yFbm( w * 0.8 + 3.0 ) ) );
          meadow = mix( meadow, vec3( 0.42, 0.4, 0.19 ), 0.55 * midM * smoothstep( 0.56, 0.78, yFbm( w * 0.19 + 17.0 ) ) );
          // rough grass in the same patches the tufts stand in: darker, and its own shade under it
          meadow *= 1.0 - 0.3 * midM * smoothstep( 0.4, 0.62, yFbm( w * 0.09 + vec2( 5.0, -3.0 ) ) );
          vec2 fp = w * 2.6;
          vec2 fcell = floor( fp );
          vec2 fc = fract( fp ) - 0.5 - ( vec2( yHash( fcell + 3.1 ), yHash( fcell + 7.7 ) ) - 0.5 ) * 0.6;
          float flower = step( 0.86, yHash( fcell ) ) * ( 1.0 - smoothstep( 0.035, 0.035 + 1.5 * fwidth( fp.x ), length( fc ) ) ) * ( 1.0 - smoothstep( 4.0, 14.0, dist ) );
          meadow = mix( meadow, mix( vec3( 0.95, 0.93, 0.82 ), vec3( 0.92, 0.78, 0.2 ), step( 0.5, yHash( fcell + 1.3 ) ) ), 0.85 * flower );
          float farM = smoothstep( 60.0, 520.0, r );
          meadow = mix( meadow, vec3( 0.12, 0.18, 0.1 ), farM * 0.45 * smoothstep( 0.3, 0.7, yFbm( w * 0.006 + 3.0 ) ) );
          vec3 c = mix( gr, meadow, edge );
          // bare earth where the turf is worn, in patches the size of a cart
          // patches of a cart's size: a pattern finer than the pixel is left out with the distance, or it crawls (docs/qa.md D16)
          float bare = smoothstep( 0.66, 0.86, yFbm( w * 0.35 + 11.0 ) ) * edge * ( 1.0 - farM ) * ( 1.0 - smoothstep( 40.0, 160.0, dist ) );
          c = mix( c, texture2D( uSoil, w * 0.5 ).rgb * vec3( 0.62, 0.5, 0.38 ), bare * 0.45 );
          ${
            track.length > 1
              ? `// the track: bare, trodden earth in two wheel lines, the grass thin and pale between and beside them, its edge broken by the turf
          float td = 1e6;
          ${trackGlsl}
          td += 0.35 * ( yNoise( w * 0.9 ) - 0.5 );
          float worn = 1.0 - smoothstep( 1.0, 1.9, td );
          float wheel = exp( -pow( ( td - 0.72 ) / 0.26, 2.0 ) );
          vec3 earth = texture2D( uSoil, w * 0.7 ).rgb * vec3( 0.66, 0.56, 0.44 ) * ( 0.8 + 0.4 * yNoise( w * 2.1 ) );
          c = mix( c, mix( c * vec3( 1.12, 1.06, 0.82 ), earth, 0.35 + 0.6 * wheel ), worn );
          c *= 1.0 - 0.22 * wheel * worn * ( 0.6 + 0.4 * yNoise( vec2( w.x * 5.0, w.y * 1.2 ) ) );`
              : ''
          }
          diffuseColor.rgb = c;
        }`,
      );
  });
  mat.customProgramCacheKey = () => key;
  return mat;
}

// ------------------------------------------------------------------------------------------------ the meadow's relief

/** A card of grass: a dozen blades from one root, each a tapered stroke that leans, pale at the tip and dark at the foot, on a clear ground; its own mip chain, as the leaf cards have (`leafMips`: the share of blade the base has at every level, never a solid card). */
export function tuftCard(seed: number, N = 64): THREE.DataTexture {
  const r = rng(seed);
  const d = new Uint8Array(N * N * 4);
  const foot = new THREE.Color(0x4f6d27);
  const tip = new THREE.Color(0xb9c468);
  const c = new THREE.Color();
  for (let b = 0; b < 13; b++) {
    const x0 = 0.5 + (r() - 0.5) * 0.22;
    const lean = (r() - 0.5) * 0.85;
    const h = 0.55 + 0.42 * r();
    const w0 = 0.028 + 0.02 * r();
    const tone = 0.8 + 0.4 * r();
    for (let j = 0; j < N; j++) {
      const v = j / (N - 1);
      if (v > h) break;
      const t = v / h;
      // a blade bends more towards its tip
      const xc = x0 + lean * t * t * 0.55;
      const half = w0 * (1 - t) ** 0.7 + 0.006;
      c.copy(foot)
        .lerp(tip, t ** 0.8)
        .multiplyScalar(tone);
      for (let i = Math.max(0, Math.floor((xc - half) * N)); i <= Math.min(N - 1, Math.ceil((xc + half) * N)); i++) {
        if (Math.abs((i + 0.5) / N - xc) > half) continue;
        const k = (j * N + i) * 4;
        d[k] = Math.min(255, Math.round(c.r * 255));
        d[k + 1] = Math.min(255, Math.round(c.g * 255));
        d[k + 2] = Math.min(255, Math.round(c.b * 255));
        d[k + 3] = 255;
      }
    }
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.mipmaps = leafMips(d, N);
  t.generateMipmaps = false;
  t.needsUpdate = true;
  t.name = 'grass-tuft';
  // (the mean green the leaf material takes from afar: a tuft's own)
  t.userData.mean = foot.clone().lerp(tip, 0.55);
  return t;
}

/** A tuft stands whole within the first distance from the eye, metres, and is gone into the turf at the second: beyond, the meadow is the ground's own picture, and nothing finer than a pixel is left to crawl. */
export const TUFTS_FADE = [15, 34] as const;

/** Tufts of grass and stones in the meadow: two instanced meshes. A tuft is three crossed cards on the ground, lit as the ground is (its normal is the ground's); a stone is a rounded block, a third of it in the turf. */
function meadowRelief(
  yardR: number,
  groundY: number,
  o: NonNullable<YardOptions['meadow']>,
  seed: number,
): THREE.Group {
  const g = new THREE.Group();
  g.name = 'meadow';
  const r = rng(seed);
  const free = (x: number, z: number): boolean => !o.keepOut?.(x, z);
  /** The share of meadow in the ground at a distance from the middle, as the land's shader has it (without its noise). */
  const turf = (d: number): number => smoothstep(yardR * 0.55, yardR * 1.4, d);
  const onTrack = (x: number, z: number, within: number): boolean => {
    const t = o.track ?? [];
    for (let i = 0; i + 1 < t.length; i++) {
      const [ax, az] = t[i]!;
      const [bx, bz] = t[i + 1]!;
      const k = Math.min(
        1,
        Math.max(0, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)),
      );
      if (Math.hypot(x - ax - k * (bx - ax), z - az - k * (bz - az)) < within) return true;
    }
    return false;
  };

  // where the rough grass is thick: a noise read once on a grid of 1.5 m and looked up for every try (the placing of some thousands of tufts by rejection asked it a hundred thousand times: a fifth of the world's building time)
  const G = 64;
  const span = o.within * 2 + 4;
  const grid = new Float32Array(G * G);
  for (let j = 0; j < G; j++)
    for (let i = 0; i < G; i++) {
      const gx = (i / (G - 1) - 0.5) * span;
      const gz = (j / (G - 1) - 0.5) * span;
      grid[j * G + i] = smoothstep(0.38, 0.62, fbm(gx * 0.09 + 5, gz * 0.09 - 3, 3));
    }
  const patchAt = (x: number, z: number): number => {
    const i = Math.min(G - 1, Math.max(0, Math.round((x / span + 0.5) * (G - 1))));
    const j = Math.min(G - 1, Math.max(0, Math.round((z / span + 0.5) * (G - 1))));
    return grid[j * G + i]!;
  };

  // ---- tufts
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI;
    const cx = Math.cos(a) * 0.5;
    const cz = Math.sin(a) * 0.5;
    const first = pos.length / 3;
    for (const [u, v] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ] as const) {
      pos.push((u * 2 - 1) * cx, v, (u * 2 - 1) * cz);
      nor.push(0, 1, 0);
      uv.push(u, v);
      col.push(1, 1, 1);
    }
    idx.push(first, first + 1, first + 2, first, first + 2, first + 3);
  }
  const tuftG = new THREE.BufferGeometry();
  tuftG.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  tuftG.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  tuftG.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  tuftG.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  tuftG.setIndex(idx);
  const tuftM = leafMaterial(tuftCard(seed + 5), 'grass-tuft');
  tuftM.roughness = 1;
  patchMaterial(tuftM, 'tuft-by-distance', (shader) => {
    shader.uniforms.uTuftFade = { value: new THREE.Vector2(...TUFTS_FADE) };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform vec2 uTuftFade;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float tuftD = length( ( modelViewMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz );
          transformed.y *= 1.0 - smoothstep( uTuftFade.x, uTuftFade.y, tuftD );
        #endif`,
      );
  });
  const tufts = new THREE.InstancedMesh(tuftG, tuftM, o.tufts);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Color();
  let n = 0;
  for (let tries = 0; n < o.tufts && tries < o.tufts * 30; tries++) {
    // denser near the yard, where the eye is, thinning out
    const d = yardR * 0.5 + (o.within - yardR * 0.5) * r() ** 1.7;
    const a = r() * Math.PI * 2;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    // in patches, as rough grass grows: thick where the ground holds water, thin between
    const patch = patchAt(x, z);
    if (r() > (0.15 + 0.85 * turf(d)) * (0.18 + 0.82 * patch) || !free(x, z) || onTrack(x, z, 1.5)) continue;
    const tall = r() > 0.9;
    const w = (0.4 + 0.45 * r()) * (tall ? 0.8 : 1);
    const h = tall ? 0.45 + 0.3 * r() : 0.16 + 0.22 * r();
    q.setFromAxisAngle(up, r() * Math.PI);
    m.compose(new THREE.Vector3(x, groundY - 0.01, z), q, new THREE.Vector3(w, h, w));
    tufts.setMatrixAt(n, m);
    const t = 0.95 + 0.4 * r();
    c.setRGB(t * (0.92 + 0.25 * r()), t, t * (0.7 + 0.2 * r()));
    tufts.setColorAt(n, c);
    n++;
  }
  tufts.count = n;
  tufts.name = 'tufts';
  tufts.castShadow = false;
  tufts.receiveShadow = true;
  tufts.frustumCulled = false;
  tufts.userData.noShadow = true;
  tufts.raycast = () => {};
  g.add(tufts);

  // ---- stones
  const stoneG = new THREE.DodecahedronGeometry(1, 1);
  {
    const p = stoneG.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      // the same push for the copies of one corner: the stone stays closed
      const k = 0.82 + 0.3 * fbm(v.x * 1.7 + 3, v.y * 1.7 + v.z * 2.3, 2);
      p.setXYZ(i, v.x * k, v.y * k * 0.62, v.z * k);
    }
    stoneG.computeVertexNormals();
  }
  const stones = new THREE.InstancedMesh(
    stoneG,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.96, metalness: 0, flatShading: true }),
    o.stones,
  );
  let s = 0;
  const e = new THREE.Euler();
  for (let tries = 0; s < o.stones && tries < o.stones * 40; tries++) {
    const d = yardR * 0.35 + (o.within * 0.8 - yardR * 0.35) * r() ** 1.4;
    const a = r() * Math.PI * 2;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    if (!free(x, z) || onTrack(x, z, 1.2)) continue;
    const size = 0.05 + 0.2 * r() ** 2.2;
    e.set((r() - 0.5) * 0.5, r() * 6.28, (r() - 0.5) * 0.5);
    q.setFromEuler(e);
    m.compose(
      new THREE.Vector3(x, groundY + size * 0.18, z),
      q,
      new THREE.Vector3(size * (0.8 + 0.6 * r()), size, size),
    );
    stones.setMatrixAt(s, m);
    const t = 0.42 + 0.3 * r();
    c.setRGB(t, t * (0.97 + 0.05 * r()), t * (0.9 + 0.08 * r()));
    stones.setColorAt(s, c);
    s++;
  }
  stones.count = s;
  stones.name = 'stones';
  stones.castShadow = true;
  stones.receiveShadow = true;
  stones.frustumCulled = false;
  g.add(stones);
  return g;
}

/** A concrete slab with its expansion joints, its stains and its worn edge: the top face is the floor the machine stands on. */
function slabMaterial(scroll: { value: number }): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0 });
  const conc = tiled(concreteMap(), 1, 1);
  patchMaterial(mat, 'yard-slab', (shader) => {
    shader.uniforms.uConc = { value: conc };
    shader.uniforms.uScroll = scroll;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vYardP;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvYardP = ( modelMatrix * vec4( position, 1.0 ) ).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vYardP;
        uniform sampler2D uConc;
        uniform float uScroll;
        ${NOISE}`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          vec2 p = vYardP.xz + vec2( uScroll, 0.0 );
          vec3 c = texture2D( uConc, p * 0.45 ).rgb * vec3( 0.74, 0.72, 0.69 );
          // broad stains of damp and dust, and the dark of oil where a machine has stood
          c *= 0.82 + 0.3 * yFbm( p * 0.22 );
          c = mix( c, vec3( 0.07, 0.065, 0.06 ), 0.5 * smoothstep( 0.66, 0.84, yFbm( p * 0.5 + 4.0 ) ) * ( 1.0 - smoothstep( 12.0, 50.0, length( cameraPosition - vYardP ) ) ) );
          // joints every 2.4 m: a dark line a few millimetres wide, softened by the pixel so that it does not crawl
          vec2 jp = ( p + vec2( 0.9, 0.35 ) ) / 2.4;
          vec2 jd = abs( fract( jp + 0.5 ) - 0.5 ) * 2.4;
          vec2 fw = fwidth( p );
          float jx = 1.0 - smoothstep( 0.004, 0.004 + 3.0 * fw.x, jd.x );
          float jz = 1.0 - smoothstep( 0.004, 0.004 + 3.0 * fw.y, jd.y );
          float joint = max( jx, jz ) * ( 1.0 - smoothstep( 4.0, 16.0, length( cameraPosition - vYardP ) ) );
          c = mix( c, vec3( 0.06, 0.055, 0.05 ), 0.6 * joint );
          // the slab's edge: a worn rim, paler where the corner is broken
          diffuseColor.rgb = c;
        }`,
      );
  });
  mat.customProgramCacheKey = () => 'yard-slab';
  return mat;
}

// ------------------------------------------------------------------------------------------------ the horizon

/** A ridge: a curtain round the world at `radius`, its crest from noise, the colour darker at its foot, fogged. `teeth`: the crest of a tree line (a saw of spruce tops) and not of a hill. */
function ridge(o: {
  radius: number;
  height: number;
  base: number;
  seed: number;
  low: THREE.Color;
  high: THREE.Color;
  teeth: number;
  name: string;
}): THREE.Mesh {
  const N = 720;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const r = rng(o.seed);
  const jag = Array.from({ length: N + 1 }, () => r());
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const x = Math.cos(a) * o.radius;
    const z = Math.sin(a) * o.radius;
    const hills = fbm(Math.cos(a) * 1.6 + o.seed, Math.sin(a) * 1.6 + o.seed * 0.7, 4);
    const saw = o.teeth * (0.35 + 0.65 * jag[i]!) * (0.5 + 0.5 * Math.abs(Math.sin(a * 190 + o.seed)));
    const top = o.base + o.height * (0.25 + 0.9 * hills) + saw;
    // three rows: the foot, a line under the crest where the ridge is whole, and the crest, where it is nothing: the edge against the sky is a gradient over several pixels and not a line one pixel wide (that line is what crawled when the camera moved, docs/qa.md D16)
    const feather = Math.max(6, (top - o.base) * 0.55);
    pos.push(x, -2, z, x, top - feather, z, x, top, z);
    col.push(o.low.r, o.low.g, o.low.b, 1, o.high.r, o.high.g, o.high.b, 1, o.high.r, o.high.g, o.high.b, 0);
    if (i < N) {
      const k = i * 3;
      idx.push(k, k + 1, k + 3, k + 1, k + 4, k + 3, k + 1, k + 2, k + 4, k + 2, k + 5, k + 4);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(idx);
  const m = new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, depthWrite: false }),
  );
  m.name = o.name;
  m.frustumCulled = false;
  m.renderOrder = -2;
  m.userData.noShadow = true;
  m.raycast = () => {};
  return m;
}

/** The far country: two ridges (blue with distance), a tree line of spruces in groves with gaps, and a few tall deciduous crowns against the sky. Nothing within 90 m of the middle, nothing that casts a shadow. */
function horizon(seed: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'horizon';
  g.add(
    ridge({
      radius: 1700,
      height: 120,
      base: 6,
      seed: seed + 1,
      low: new THREE.Color(0x7f9aa6),
      high: new THREE.Color(0x8aa3b0),
      teeth: 0,
      name: 'ridge-far',
    }),
  );
  g.add(
    ridge({
      radius: 900,
      height: 36,
      base: 5,
      seed: seed + 2,
      low: new THREE.Color(0x4a6558),
      high: new THREE.Color(0x587767),
      teeth: 4,
      name: 'ridge-wooded',
    }),
  );
  // the tree line: spruces of the same shape as the farm's far forest, in groves
  const r = rng(seed + 3);
  const spruce = farSpruce();
  // pale and a little lit from itself: a tree at this distance is a soft dark shape against a pale sky and a hard one is a crawling edge
  const mat = new THREE.MeshStandardMaterial({ color: 0xc4ccc8, vertexColors: true, roughness: 1, emissive: 0x20303a });
  const n = 60;
  const im = new THREE.InstancedMesh(spruce, mat, n);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  let k = 0;
  for (let tries = 0; tries < 6000 && k < n; tries++) {
    const a = r() * Math.PI * 2;
    const d = 380 + Math.pow(r(), 0.8) * 440;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const grove = smoothstep(0.35, 0.65, Math.sin(a * 5.3 + seed) * 0.5 + 0.5);
    if (r() > 0.15 + 0.85 * grove) continue;
    const h = 24 + 18 * r();
    e.set(0, r() * 6.28, 0);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, -0.3, z), q, new THREE.Vector3(h * 0.9, h, h * 0.9));
    im.setMatrixAt(k, m);
    // greyer and paler with the distance: the haze takes a tree line before it takes a hill, and a hard dark edge is what the eye finds to crawl
    const haze = Math.min(1, (d - 380) / 440);
    const t = (0.78 + 0.25 * r()) * (1 - 0.15 * haze);
    col.setRGB(t * (0.95 + 0.12 * haze), t * (1 + 0.1 * haze), t * (0.97 + 0.3 * haze));
    im.setColorAt(k, col);
    k++;
  }
  im.count = k;
  im.name = 'tree-line';
  im.frustumCulled = false;
  im.castShadow = false;
  im.userData.noShadow = true;
  g.add(im);
  return g;
}

// ------------------------------------------------------------------------------------------------ the yard

/** The scene of a world in the open: sky and sun, the land, a slab if the machine stands on one, the horizon. The caller adds its machine and sets `near` and `far` (the sky is a box 4,500 m to the side: `far` at least 5,000). */
export function createYard(o: YardOptions): Yard {
  const scene = new THREE.Scene();
  scene.name = o.name;
  scene.userData.look = { exposure: o.exposure ?? 1.0, ao: true, aoRadius: 0.6 };
  const sky = createSky(scene);
  const dir = sunFrom(o.key, o.target);
  sky.aim(dir, 0);
  sky.sun.shadow.normalBias = 0.004;
  sky.sun.shadow.bias = -0.0002;
  sky.sun.shadow.radius = 2.0;
  sky.focusShadow(new THREE.Vector3(...o.target), o.shadowHalf, 2.5);

  const scroll = { value: 0 };
  const groundY = o.groundY ?? -0.06;
  const land = new THREE.Mesh(
    new THREE.CircleGeometry(2600, 96),
    landMaterial(o.yardRadius ?? 26, scroll, o.ruts ?? [], o.meadow?.track),
  );
  land.rotation.x = -Math.PI / 2;
  land.position.y = groundY;
  land.receiveShadow = true;
  land.name = 'floor';
  land.userData.noShadow = true;
  scene.add(land);

  let slab: THREE.Mesh | null = null;
  const slabGeometry = (x0: number, z0: number, x1: number, z1: number): THREE.BufferGeometry => {
    const t = -groundY + 0.05;
    const g = new THREE.BoxGeometry(x1 - x0, t, z1 - z0);
    g.translate((x0 + x1) / 2, -t / 2, (z0 + z1) / 2);
    return g;
  };
  if (o.slab) {
    slab = new THREE.Mesh(slabGeometry(...o.slab), slabMaterial(scroll));
    slab.receiveShadow = true;
    slab.castShadow = false;
    slab.name = 'slab';
    slab.userData.noShadow = true;
    scene.add(slab);
  }
  if (o.meadow) scene.add(meadowRelief(o.yardRadius ?? 26, groundY, o.meadow, o.name.length * 31));
  const hz = horizon(o.name.length * 17);
  scene.add(hz);
  return {
    scene,
    sky,
    land,
    slab,
    horizon: hz,
    scroll(x: number) {
      scroll.value = x;
    },
    fitSlab(x0, z0, x1, z1) {
      if (!slab) return;
      slab.geometry.dispose();
      slab.geometry = slabGeometry(x0, z0, x1, z1);
    },
  };
}
