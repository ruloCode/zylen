/**
 * glbMerge — browser port of everlight-game/tools/glb_merge_anims.py.
 *
 * Merges single-clip GLBs (Meshy animation outputs) into one multi-clip GLB
 * on top of the rigged base model, entirely in the browser (zero deps).
 * Animations are remapped into the base file by NODE NAME, so it works
 * across re-exports as long as bone names match (same Meshy rig task).
 *
 * Includes the two mandatory Meshy post-fixes:
 *   - root-bone baked-scale bug: if a clip's root scale channel != 1.0
 *     (observed 1.176), scale values are rewritten to 1.0 and the same
 *     clip's root translation is divided by the factor;
 *   - materials forced to alphaMode OPAQUE + doubleSided.
 *
 * Verify parity against the python tool with tools/glb_inspect.py.
 */

const MAGIC = 0x46546c67;
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;
const SCALE_TOL = 0.02;

const COMP_SIZE: Record<number, number> = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
};
const TYPE_COUNT: Record<string, number> = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT4: 16,
};

/* eslint-disable @typescript-eslint/no-explicit-any -- raw glTF JSON */
type GltfJson = any;

export interface GlbClipSource {
  data: ArrayBuffer;
  /** Final clip name: 'Idle' | 'Run' | 'Attack' (must match the game's
   * pickClip regexes: /idle/i, /run|walk/i, /attack|cast|spell/i). */
  clipName: string;
}

export interface ParsedGlb {
  json: GltfJson;
  bin: Uint8Array;
}

/** Growable binary chunk: amortized doubling, 4-byte alignment on append. */
class BinBuilder {
  buf: Uint8Array;
  len: number;

  constructor(initial: Uint8Array) {
    // Own copy so in-place float fixes never touch the caller's buffer.
    this.buf = new Uint8Array(Math.max(initial.length * 2, 1024));
    this.buf.set(initial);
    this.len = initial.length;
  }

  private ensure(extra: number): void {
    if (this.len + extra <= this.buf.length) return;
    const next = new Uint8Array(Math.max(this.buf.length * 2, this.len + extra));
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
  }

  pad4(): void {
    const pad = (4 - (this.len % 4)) % 4;
    this.ensure(pad);
    this.len += pad; // new Uint8Array is zero-filled already
  }

  /** Append raw bytes (after 4-alignment) and return their byte offset. */
  append(bytes: Uint8Array): number {
    this.pad4();
    this.ensure(bytes.length);
    const offset = this.len;
    this.buf.set(bytes, offset);
    this.len += bytes.length;
    return offset;
  }

  view(): DataView {
    return new DataView(this.buf.buffer, this.buf.byteOffset, this.len);
  }

  bytes(): Uint8Array {
    return this.buf.subarray(0, this.len);
  }
}

export function parseGlb(data: ArrayBuffer): ParsedGlb {
  const dv = new DataView(data);
  if (dv.getUint32(0, true) !== MAGIC || dv.getUint32(4, true) !== 2) {
    throw new Error('not a GLB v2');
  }
  let json: GltfJson = null;
  let bin = new Uint8Array(0);
  let off = 12;
  while (off < data.byteLength) {
    const clen = dv.getUint32(off, true);
    const ctype = dv.getUint32(off + 4, true);
    const payload = new Uint8Array(data, off + 8, clen);
    if (ctype === CHUNK_JSON) {
      json = JSON.parse(new TextDecoder().decode(payload));
    } else if (ctype === CHUNK_BIN) {
      bin = payload;
    }
    off += 8 + clen;
  }
  if (!json) throw new Error('GLB has no JSON chunk');
  return { json, bin };
}

export function serializeGlb(json: GltfJson, bin: Uint8Array): Blob {
  if (json.buffers?.length) {
    json.buffers[0].byteLength = bin.length;
  }
  let jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  if (jsonPad) {
    const padded = new Uint8Array(jsonBytes.length + jsonPad);
    padded.set(jsonBytes);
    padded.fill(0x20, jsonBytes.length); // spaces, per spec
    jsonBytes = padded;
  }
  const binPad = (4 - (bin.length % 4)) % 4;
  const total = 12 + 8 + jsonBytes.length + 8 + bin.length + binPad;

  const header = new ArrayBuffer(12 + 8);
  const hv = new DataView(header);
  hv.setUint32(0, MAGIC, true);
  hv.setUint32(4, 2, true);
  hv.setUint32(8, total, true);
  hv.setUint32(12, jsonBytes.length, true);
  hv.setUint32(16, CHUNK_JSON, true);

  const binHeader = new ArrayBuffer(8);
  const bv = new DataView(binHeader);
  bv.setUint32(0, bin.length + binPad, true);
  bv.setUint32(4, CHUNK_BIN, true);

  const parts: BlobPart[] = [header, jsonBytes, binHeader, bin as Uint8Array<ArrayBuffer>];
  if (binPad) parts.push(new Uint8Array(binPad));
  return new Blob(parts, { type: 'model/gltf-binary' });
}

function accessorBytes(
  gltf: GltfJson,
  bin: Uint8Array,
  idx: number
): { acc: GltfJson; raw: Uint8Array } {
  const acc = gltf.accessors[idx];
  const bv = gltf.bufferViews[acc.bufferView];
  const n = (COMP_SIZE[acc.componentType] ?? 4) * (TYPE_COUNT[acc.type] ?? 1);
  const start = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
  return { acc, raw: bin.subarray(start, start + acc.count * n) };
}

function appendAccessor(
  base: GltfJson,
  builder: BinBuilder,
  acc: GltfJson,
  raw: Uint8Array
): number {
  const byteOffset = builder.append(raw);
  base.bufferViews ??= [];
  const bvIdx = base.bufferViews.length;
  base.bufferViews.push({ buffer: 0, byteOffset, byteLength: raw.length });
  const newAcc: GltfJson = {};
  for (const key of ['componentType', 'count', 'type', 'min', 'max', 'normalized']) {
    if (key in acc) newAcc[key] = acc[key];
  }
  newAcc.bufferView = bvIdx;
  base.accessors ??= [];
  base.accessors.push(newAcc);
  return base.accessors.length - 1;
}

function nodeNames(gltf: GltfJson): Map<string, number> {
  const names = new Map<string, number>();
  (gltf.nodes ?? []).forEach((n: GltfJson, i: number) => {
    names.set(n.name ?? `node_${i}`, i);
  });
  return names;
}

function rootJoints(gltf: GltfJson): Set<number> {
  const joints = new Set<number>();
  for (const skin of gltf.skins ?? []) {
    for (const j of skin.joints ?? []) joints.add(j);
  }
  const parent = new Map<number, number>();
  (gltf.nodes ?? []).forEach((n: GltfJson, ni: number) => {
    for (const c of n.children ?? []) parent.set(c, ni);
  });
  const roots = new Set<number>();
  for (const j of joints) {
    const p = parent.get(j);
    if (p === undefined || !joints.has(p)) roots.add(j);
  }
  return roots;
}

function mergeClip(
  base: GltfJson,
  builder: BinBuilder,
  donor: GltfJson,
  donorBin: Uint8Array,
  clipName: string
): number {
  const names = nodeNames(base);
  let merged = 0;
  const donorAnims = donor.animations ?? [];
  for (const anim of donorAnims) {
    const newAnim: GltfJson = {
      name: donorAnims.length === 1 ? clipName : (anim.name ?? clipName),
      samplers: [],
      channels: [],
    };
    for (const smp of anim.samplers) {
      const input = accessorBytes(donor, donorBin, smp.input);
      const output = accessorBytes(donor, donorBin, smp.output);
      newAnim.samplers.push({
        input: appendAccessor(base, builder, input.acc, input.raw),
        output: appendAccessor(base, builder, output.acc, output.raw),
        interpolation: smp.interpolation ?? 'LINEAR',
      });
    }
    let skipped = 0;
    for (const ch of anim.channels) {
      const donorName = donor.nodes[ch.target.node]?.name;
      const baseNode = donorName !== undefined ? names.get(donorName) : undefined;
      if (baseNode === undefined) {
        skipped += 1;
        continue;
      }
      newAnim.channels.push({
        sampler: ch.sampler,
        target: { node: baseNode, path: ch.target.path },
      });
    }
    if (skipped) {
      console.warn(`glbMerge '${newAnim.name}': skipped ${skipped} channels (no matching node)`);
    }
    if (!newAnim.channels.length) {
      console.warn(`glbMerge '${newAnim.name}': NO matching channels — incompatible skeletons?`);
      continue;
    }
    base.animations ??= [];
    base.animations.push(newAnim);
    merged += 1;
  }
  return merged;
}

function fixRootScale(base: GltfJson, builder: BinBuilder): void {
  const roots = rootJoints(base);
  const dv = builder.view();
  for (const anim of base.animations ?? []) {
    const scaleChannels = (anim.channels ?? []).filter(
      (c: GltfJson) => c.target.path === 'scale' && roots.has(c.target.node)
    );
    for (const ch of scaleChannels) {
      const smp = anim.samplers[ch.sampler];
      const acc = base.accessors[smp.output];
      const bv = base.bufferViews[acc.bufferView];
      const start = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0);
      const n = acc.count * 3;
      let sum = 0;
      for (let i = 0; i < n; i++) sum += dv.getFloat32(start + i * 4, true);
      const mean = sum / n;
      if (Math.abs(mean - 1.0) <= SCALE_TOL) continue;
      console.warn(`glbMerge FIX root scale in '${anim.name}': mean ${mean.toFixed(4)} -> 1.0`);
      for (let i = 0; i < n; i++) dv.setFloat32(start + i * 4, 1.0, true);
      delete acc.min;
      delete acc.max;
      for (const ch2 of anim.channels) {
        if (ch2.target.path !== 'translation' || ch2.target.node !== ch.target.node) continue;
        const smp2 = anim.samplers[ch2.sampler];
        const acc2 = base.accessors[smp2.output];
        const bv2 = base.bufferViews[acc2.bufferView];
        const s2 = (bv2.byteOffset ?? 0) + (acc2.byteOffset ?? 0);
        const n2 = acc2.count * 3;
        for (let i = 0; i < n2; i++) {
          dv.setFloat32(s2 + i * 4, dv.getFloat32(s2 + i * 4, true) / mean, true);
        }
        delete acc2.min;
        delete acc2.max;
      }
    }
  }
}

/**
 * Merge the rigged base GLB with one single-clip GLB per animation into a
 * final multi-clip hero GLB, applying the Meshy post-fixes.
 */
export function mergeHeroGlb(baseGlb: ArrayBuffer, clips: GlbClipSource[]): Blob {
  const { json: base, bin } = parseGlb(baseGlb);
  const builder = new BinBuilder(bin);
  for (const clip of clips) {
    const donor = parseGlb(clip.data);
    const merged = mergeClip(base, builder, donor.json, donor.bin, clip.clipName);
    if (!merged) {
      throw new Error(`clip '${clip.clipName}' did not merge (incompatible rig)`);
    }
  }
  fixRootScale(base, builder);
  for (const mat of base.materials ?? []) {
    mat.alphaMode = 'OPAQUE';
    delete mat.alphaCutoff;
    mat.doubleSided = true;
  }
  return serializeGlb(base, builder.bytes());
}
