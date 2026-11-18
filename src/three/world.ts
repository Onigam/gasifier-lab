import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import { PAPER_STUDIO, PartRegistry, patchMaterial, type Hotspot } from '@onigam/lab-kit/three';

// What the worlds share: the paper studio of the machine worlds, the hotspots' declarations, how a part is framed, what the registry says of a world this frame.

export const PAPER = 0xefe6d3;

export interface WorkshopOptions {
  name: string;
  key: [number, number, number];
  target: [number, number, number];
  shadowHalf: number;
  shadowFar: number;
  exposure?: number;
}

/** A paper studio: the warm light of the labs' machine worlds. No fog: the paper floor fades by itself. */
export function workshopScene(o: WorkshopOptions): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = o.name;
  scene.background = new THREE.Color(PAPER);
  scene.userData.wantsEnv = true;
  scene.userData.look = { ...PAPER_STUDIO, exposure: o.exposure ?? 0.98 };
  scene.environmentIntensity = 0.5;
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0xb6a68c, 0.3));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.1);
  key.position.set(...o.key);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -o.shadowHalf;
  sc.right = o.shadowHalf;
  sc.top = o.shadowHalf;
  sc.bottom = -o.shadowHalf;
  sc.near = 0.1;
  sc.far = o.shadowFar;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = o.shadowHalf * 0.003;
  key.target.position.set(...o.target);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.28);
  fill.position.set(-o.key[0], o.key[1] * 0.6, o.key[2] * 0.4);
  scene.add(fill);
  return scene;
}

/** Drafting-table floor: a disc of paper with its grid, fading into the background by its own radius. A DataTexture, so it also builds in Node. Its texture can be scrolled (`offset`) for a machine that rolls on the spot. */
export function paperFloor(radius = 16, tile = 8, y = 0): THREE.Mesh {
  const N = 512;
  const data = new Uint8Array(N * N * 4);
  const cell = N / 8;
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      const k = (py * N + px) * 4;
      let a = 0;
      const mx = px % cell;
      const my = py % cell;
      if (mx < 2 || my < 2) a = 0.16;
      else if (mx % (cell / 5) < 1 || my % (cell / 5) < 1) a = 0.06;
      data[k] = Math.round(239 * (1 - a) + 40 * a);
      data[k + 1] = Math.round(230 * (1 - a) + 60 * a);
      data[k + 2] = Math.round(211 * (1 - a) + 90 * a);
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((2 * radius) / tile, (2 * radius) / tile);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const from = radius * 0.45;
  const to = radius * 0.98;
  const uPaper = { value: new THREE.Color(PAPER) };
  mat.userData.uPaper = uPaper;
  patchMaterial(mat, `floor-fade:${from}:${to}`, (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFloorP = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorP;\nuniform vec3 uPaper;')
      .replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
        gl_FragColor.rgb = mix( gl_FragColor.rgb, uPaper, smoothstep( ${from.toFixed(2)}, ${to.toFixed(2)}, length( vFloorP ) ) );`,
      );
    shader.uniforms.uPaper = uPaper;
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = y;
  floor.receiveShadow = true;
  floor.name = 'floor';
  return floor;
}

/** A direction to look at a part from, as the camera sees it: its elevation over the horizon and its bearing from +Z towards +X, in degrees. */
export function viewFrom(elevation: number, bearing: number): THREE.Vector3 {
  const e = (elevation * Math.PI) / 180;
  const b = (bearing * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(b) * Math.cos(e), Math.sin(e), Math.cos(b) * Math.cos(e));
}

/** A world-space box from its two corners. */
export const box3 = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): THREE.Box3 =>
  new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));

/** How a click or the voice frames a part: from which side, and on what, when the part's whole box would keep the camera too far. */
export interface PartFraming {
  viewDir: THREE.Vector3;
  frame?: THREE.Box3;
}

export interface HotspotDef {
  /** The part; a suffix `#name` lets a part have several labels. */
  id: string;
  fr: string;
  en: string;
  minor?: boolean;
  /** World to open when the label is clicked. */
  goto?: string;
}

/** An empty marker at a position of `parent`: the label follows it, also during the explode. */
export function anchor(parent: THREE.Object3D, x: number, y: number, z: number, name = 'anchor'): THREE.Object3D {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  o.userData.keep = true;
  parent.add(o);
  return o;
}

export function hotspots(defs: HotspotDef[], anchors: Record<string, THREE.Object3D>): Hotspot[] {
  return defs.map((d) => ({
    partId: d.id.replace(/#.*$/, ''),
    anchor: anchors[d.id]!,
    label: l(d.fr, d.en),
    minor: d.minor,
    goto: d.goto,
  }));
}

/** The real bounding box of the meshes under an object (the moving things are attached to this). */
export const worldBox = (o: THREE.Object3D): THREE.Box3 => new THREE.Box3().setFromObject(o, true);

/**
 * What the registry says of a world's parts this frame. `isolated`: one part alone is left, the others hidden. `exploded`: one has left its place. `ghosted`: x-ray or a guide's wire preview is on; `xray`: x-ray alone, a preview being no reason to
 * close a section.
 */
export function partsNow(reg: PartRegistry): {
  hidden: boolean;
  isolated: boolean;
  exploded: boolean;
  ghosted: boolean;
  xray: boolean;
} {
  let hidden = 0;
  let solid = 0;
  let exploded = false;
  let ghosted = false;
  let xray = false;
  const ids = reg.ids();
  for (const id of ids) {
    const p = reg.get(id)!;
    if (p.display === 'hidden') hidden++;
    if (p.display === 'solid') solid++;
    if (p.display === 'ghost' || p.display === 'wire') ghosted = true;
    if (p.display === 'ghost') xray = true;
    if (p.factor > 0.001) exploded = true;
  }
  return { hidden: hidden > 0, isolated: solid === 1 && hidden === ids.length - 1, exploded, ghosted, xray };
}

const OVERVIEW = '(overview)';

/**
 * A registry that adds what the world's overview must hold beyond its parts (the kit's `Stage.frameAll` frames the registered parts only), and that keeps some boxes off a part's sheet: the kit prints the box of the selected part as
 * « Encombrement » and prints nothing for an empty box. The box of the inside of the hearth is its sizing, which this lab refuses to give (R2): so a refused part has an empty box while it is the one selected, and only to whoever asks for
 * `bounds` directly; the camera still gets the real one through `frameBounds`. The overview entry is no part: no mesh, no name, not in `ids()`.
 */
export class WorldRegistry extends PartRegistry {
  private extent: (() => THREE.Box3[]) | null = null;
  private framing = 0;

  constructor(
    private readonly refused: ReadonlySet<string> = new Set(),
    private readonly selected: () => string | null = () => null,
  ) {
    super();
  }

  private alone = false;

  /**
   * What the overview holds beyond the parts. `alone`: the overview is these boxes and nothing else (a landscape, whose parts run on for hundreds of metres: a ditch, a plume): the box of a part that is not the selected one is then cut to them, so that `Stage.frameAll`,
   * which frames the union of every part's box, frames what the world says and not the whole ditch.
   */
  overview(extent: () => THREE.Box3[], alone = false): void {
    this.extent = extent;
    this.alone = alone;
    if (!this.parts.has(OVERVIEW)) this.add(OVERVIEW, new THREE.Object3D());
  }

  override ids(): string[] {
    return super.ids().filter((id) => id !== OVERVIEW);
  }

  override bounds(id: string): THREE.Box3 {
    if (id !== OVERVIEW) {
      if (!this.framing && this.refused.has(id) && this.selected() === id) return new THREE.Box3();
      const own = super.bounds(id);
      if (!this.alone || this.framing || this.selected() === id) return own;
      const hold = new THREE.Box3();
      for (const b of this.extent?.() ?? []) hold.union(b);
      return own.intersect(hold);
    }
    const box = new THREE.Box3();
    for (const part of this.parts.values()) if (part.display === 'hidden') return box;
    for (const b of this.extent?.() ?? []) box.union(b);
    return box;
  }

  override frameBounds(id: string): THREE.Box3 {
    this.framing++;
    try {
      return super.frameBounds(id);
    } finally {
      this.framing--;
    }
  }
}
