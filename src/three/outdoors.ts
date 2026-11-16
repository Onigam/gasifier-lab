import * as THREE from 'three';
import { patchMaterial, rng } from '@onigam/lab-kit/three';
import { smoothstep } from './common';
import { createSky, type SkyRig } from './farm/sky';
import { farSpruce } from './farm/trees';
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
`;

/** The ground: gravel packed by wheels round the machine, going to rough meadow, then to the dark of the forest floor. One disc, the surface computed per pixel from the position. */
function landMaterial(yardR: number, scroll: { value: number }, ruts: readonly number[]): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  const gravel = tiled(gravelMap(), 1, 1);
  const grass = grassMap();
  const soil = tiled(soilMap(), 1, 1);
  const rutGlsl = ruts
    .map((z) => `rut = max( rut, exp( -pow( ( p.y - ${z.toFixed(3)} ) / 0.2, 2.0 ) ) );`)
    .join('\n          ');
  patchMaterial(mat, `yard-land:${yardR}:${ruts.join(',')}`, (shader) => {
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
          vec3 meadow = mix( vec3( 0.22, 0.3, 0.12 ), vec3( 0.34, 0.39, 0.15 ), broad );
          meadow *= 0.78 + 0.5 * mix( texture2D( uGrass, w * 0.31 ).r, 0.5, smoothstep( 30.0, 140.0, dist ) );
          float farM = smoothstep( 60.0, 520.0, r );
          meadow = mix( meadow, vec3( 0.12, 0.18, 0.1 ), farM * 0.45 * smoothstep( 0.3, 0.7, yFbm( w * 0.006 + 3.0 ) ) );
          vec3 c = mix( gr, meadow, edge );
          // bare earth where the turf is worn, in patches the size of a cart
          // patches of a cart's size: a pattern finer than the pixel is left out with the distance, or it crawls (docs/qa.md D16)
          float bare = smoothstep( 0.66, 0.86, yFbm( w * 0.35 + 11.0 ) ) * edge * ( 1.0 - farM ) * ( 1.0 - smoothstep( 40.0, 160.0, dist ) );
          c = mix( c, texture2D( uSoil, w * 0.5 ).rgb * vec3( 0.62, 0.5, 0.38 ), bare * 0.45 );
          diffuseColor.rgb = c;
        }`,
      );
  });
  mat.customProgramCacheKey = () => `yard-land:${yardR}:${ruts.join(',')}`;
  return mat;
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
    pos.push(x, -2, z, x, top, z);
    col.push(o.low.r, o.low.g, o.low.b, o.high.r, o.high.g, o.high.b);
    if (i < N) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
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
      teeth: 7,
      name: 'ridge-wooded',
    }),
  );
  // the tree line: spruces of the same shape as the farm's far forest, in groves
  const r = rng(seed + 3);
  const spruce = farSpruce();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1 });
  const n = 150;
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
    landMaterial(o.yardRadius ?? 26, scroll, o.ruts ?? []),
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
