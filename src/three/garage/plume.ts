import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';

// The plume and the carbon monoxide of `garage`. Both are drawn by the graphics card from the clock alone: a particle's place is a function of its seed and of the time, so replaying a frame gives the same picture and nothing is allocated in a frame. The plume is the
// part of the picture that is NOT the model's: the simulation says how much gas leaves (`plumeShare`) and nothing about its shape, so the wisps are drawn as the sources describe them (white or yellow gas at the primary-air intake, S3), in proportion to the
// model's flow and no more. The carbon monoxide's dots are the model's well-mixed box: as many as the ppm says on a logarithmic scale, evenly spread, drifting. A real room is uneven (S3), and the picture does not say otherwise.

const VERT = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uShare;
  uniform vec3 uOrigin;
  uniform float uRise;
  uniform float uSpread;
  uniform float uSpeed;
  uniform float uSize;
  uniform float uPixels;
  uniform float uRing;
  uniform vec2 uFade;
  uniform float uMinPx;
  varying float vAlpha;
  varying float vRot;
  varying float vSeed;
  void main() {
    float age = fract( aSeed.x * 7.0 + uTime * uSpeed * ( 0.7 + 0.6 * aSeed.y ) );
    float live = step( aSeed.w, uShare );
    float a = aSeed.y * 6.2831853;
    // from a ring when the gas leaves round an edge (a lid lifted on its spring), from the point when it leaves a mouth
    float r = uRing + ( 0.04 + uSpread * age * ( 0.4 + 0.9 * aSeed.z ) );
    vec3 p = uOrigin + vec3( cos( a ) * r, uRise * pow( age, 0.8 ) + 0.1 * sin( uTime * 0.7 + aSeed.x * 40.0 ) * age, sin( a ) * r );
    vec4 mv = modelViewMatrix * vec4( p, 1.0 );
    gl_Position = projectionMatrix * mv;
    float size = uSize * ( 0.3 + 1.6 * age ) * live;
    gl_PointSize = max( size * uPixels / max( 0.5, -mv.z ), uMinPx * live );
    // a veil thins as the eye comes up to it (it is a thin gas: close, it is seen through) and holds at a distance, where it is all there is to see
    vAlpha = live * sin( 3.14159265 * age ) * 0.9 * smoothstep( uFade.x, uFade.y, -mv.z );
    vRot = aSeed.z * 6.2831853;
    vSeed = aSeed.x;
  }
`;

// a puff is not a disc: its edge is broken by two octaves of noise, turned by the particle's own angle, so that a plume reads as gas and not as a cloud of dots; the colour is a little darker towards the rim, as a lit puff is thinner there
const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vRot;
  varying float vSeed;
  float pHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
  float pNoise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( pHash( i ), pHash( i + vec2( 1.0, 0.0 ) ), u.x ), mix( pHash( i + vec2( 0.0, 1.0 ) ), pHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float cs = cos( vRot );
    float sn = sin( vRot );
    c = vec2( cs * c.x - sn * c.y, sn * c.x + cs * c.y );
    float d = length( c ) * 2.0;
    float puff = 0.6 * pNoise( c * 4.0 + vSeed * 17.0 ) + 0.4 * pNoise( c * 9.0 - vSeed * 5.0 );
    // a soft body with a broken edge, never a flake: the centre is thick, the edge thins to nothing by itself
    float body = exp( -2.6 * d * d );
    float soft = body * ( 0.55 + 0.9 * puff ) * smoothstep( 1.0, 0.7, d );
    vec3 col = uColor * ( 0.78 + 0.22 * ( 1.0 - d ) );
    gl_FragColor = vec4( col, soft * vAlpha * uOpacity );
  }
`;

export interface Plume {
  points: THREE.Points;
  /** The haze: a faint volume round the plume, so that it can be clicked, in proportion to its share. */
  haze: THREE.Mesh;
  set(o: { share: number; opacity: number; time: number }): void;
}

/** A plume of smoke from `origin`: `rise` metres up, `spread` metres wide at the top of its life, `n` particles. */
export function makePlume(o: {
  origin: THREE.Vector3;
  color: number;
  rise: number;
  spread: number;
  n?: number;
  size?: number;
  speed?: number;
  seed?: number;
  /** The gas leaves round a ring of this radius (a lid) instead of from a point. */
  ring?: number;
  /** Metres from the eye over which the veil thins: nothing under `near`, all of it past `far`. */
  fade?: [number, number];
  /** The least a particle is drawn, in pixels, so that a far plume is a column and not a dot. */
  minPx?: number;
}): Plume {
  const n = o.n ?? 160;
  const r = rng(o.seed ?? 1);
  const seed = new Float32Array(n * 4);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    seed[i * 4] = i / n + r() * 0.01;
    seed[i * 4 + 1] = r();
    seed[i * 4 + 2] = r();
    seed[i * 4 + 3] = (i + 0.5) / n;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  // the dots are placed by the shader: their own box would be the origin; the haze gives the part its box
  g.boundingBox = new THREE.Box3();
  g.boundingSphere = new THREE.Sphere();
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uShare: { value: 0 },
      uOrigin: { value: o.origin.clone() },
      uRise: { value: o.rise },
      uSpread: { value: o.spread },
      uSpeed: { value: o.speed ?? 0.12 },
      uSize: { value: o.size ?? 0.6 },
      uPixels: { value: 700 },
      uRing: { value: o.ring ?? 0 },
      uFade: { value: new THREE.Vector2(...(o.fade ?? [0, 0.01])) },
      uMinPx: { value: o.minPx ?? 0 },
      uColor: { value: new THREE.Color(o.color) },
      uOpacity: { value: 0.5 },
    },
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  points.castShadow = false;
  points.userData.noShadow = true;
  points.renderOrder = 12;
  points.name = 'plume-dots';
  const haze = new THREE.Mesh(
    new THREE.SphereGeometry(1, 14, 10),
    new THREE.MeshBasicMaterial({ color: o.color, transparent: true, opacity: 0, depthWrite: false }),
  );
  haze.position.copy(o.origin).add(new THREE.Vector3(0, o.rise * 0.45, 0));
  haze.scale.set(Math.max(0.25, o.spread * 0.8), Math.max(0.3, o.rise * 0.55), Math.max(0.25, o.spread * 0.8));
  haze.castShadow = false;
  haze.userData.noShadow = true;
  haze.name = 'plume-haze';
  return {
    points,
    haze,
    set({ share, opacity, time }) {
      const u = mat.uniforms;
      u.uTime!.value = time;
      u.uShare!.value = share;
      u.uOpacity!.value = opacity;
      (haze.material as THREE.MeshBasicMaterial).opacity = 0.0;
      haze.visible = true;
    },
  };
}

export interface CoCloud {
  points: THREE.Points;
  set(o: { share: number; time: number }): void;
  /** Resize to the room (its box in the room's frame). */
  fit(box: THREE.Box3): void;
}

/** The carbon monoxide of the model: `n` dots spread evenly through a box, `share` of them shown (a logarithmic read of the ppm), each drifting a little. */
export function makeCo(n = 1600): CoCloud {
  const r = rng(77);
  const seed = new Float32Array(n * 4);
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = r();
    pos[i * 3 + 1] = r();
    pos[i * 3 + 2] = r();
    seed[i * 4] = r();
    seed[i * 4 + 1] = r();
    seed[i * 4 + 2] = r();
    seed[i * 4 + 3] = (i + 0.5) / n;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  g.boundingBox = new THREE.Box3();
  g.boundingSphere = new THREE.Sphere();
  const mat = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      attribute vec4 aSeed;
      uniform float uTime;
      uniform float uShare;
      uniform vec3 uMin;
      uniform vec3 uSize;
      uniform float uPixels;
      varying float vA;
      void main() {
        vec3 p = uMin + position * uSize;
        p += 0.07 * vec3( sin( uTime * 0.4 + aSeed.x * 30.0 ), sin( uTime * 0.33 + aSeed.y * 30.0 ), sin( uTime * 0.37 + aSeed.z * 30.0 ) );
        vec4 mv = modelViewMatrix * vec4( p, 1.0 );
        gl_Position = projectionMatrix * mv;
        float live = step( aSeed.w, uShare );
        gl_PointSize = live * 0.06 * uPixels / max( 0.5, -mv.z );
        vA = live;
      }`,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        vec2 c = gl_PointCoord - 0.5;
        float d = length( c ) * 2.0;
        float disc = smoothstep( 1.0, 0.7, d );
        float ring = smoothstep( 0.5, 0.75, d );
        gl_FragColor = vec4( mix( vec3( 0.86, 0.36, 0.42 ), vec3( 0.5, 0.12, 0.2 ), ring ), disc * vA * 0.85 );
      }`,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uShare: { value: 0 },
      uMin: { value: new THREE.Vector3() },
      uSize: { value: new THREE.Vector3(1, 1, 1) },
      uPixels: { value: 700 },
    },
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  points.castShadow = false;
  points.userData.noShadow = true;
  points.renderOrder = 11;
  points.name = 'co-dots';
  return {
    points,
    set({ share, time }) {
      mat.uniforms.uShare!.value = share;
      mat.uniforms.uTime!.value = time;
    },
    fit(box) {
      mat.uniforms.uMin!.value.copy(box.min);
      mat.uniforms.uSize!.value.copy(box.getSize(new THREE.Vector3()));
    },
  };
}

/** The share of the dots shown for a concentration: a logarithmic read between 1 ppm and 10,000, so that 20 ppm and 3,500 ppm are both seen. */
export const coShare = (ppm: number): number => Math.min(1, Math.max(0, Math.log10(1 + ppm) / 4));
