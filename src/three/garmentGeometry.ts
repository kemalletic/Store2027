import * as THREE from "three";
import type { Fit, GarmentSpec } from "@/lib/types";
import { FIT_PROFILES, legAt, outlineFor, pointInPolygon, closestOnPolygon, type LegProfile, type Outline } from "./outline";
import { fbm } from "./noise";

/**
 * Turns a flat outline into a soft, "inflated" garment: a grid clipped to the
 * outline, with its boundary snapped onto the outline and a rounded thickness
 * profile, so front and back meet in a clean seam.
 *
 * Geometry groups: 0 = front, 1 = back.
 */

export interface GarmentGeometry {
  geometry: THREE.BufferGeometry;
  outline: Outline;
  thickness: number;
}

const THICKNESS: Record<GarmentSpec["fabric"], number> = {
  denim: 0.022,
  fleece: 0.032,
  jersey: 0.016,
  knit: 0.028,
  nylon: 0.04,
  twill: 0.016,
  leather: 0.008,
};

export const FIT_ORDER: Fit[] = ["slim", "regular", "relaxed", "loose"];

interface BuildOptions {
  /** Grid step in metres; smaller = smoother but heavier. */
  step?: number;
  /** Adds morph targets for each fit in FIT_ORDER (jeans only). */
  fitMorphs?: boolean;
}

function profileZ(d: number, T: number, R: number) {
  const s = Math.min(d / R, 1);
  return T * Math.sqrt(1 - (1 - s) * (1 - s));
}

const cache = new Map<string, GarmentGeometry>();

export function garmentGeometry(spec: GarmentSpec, opts: BuildOptions = {}): GarmentGeometry {
  const key = `${spec.kind}|${spec.fabric}|${spec.fit}|${spec.oversized}|${opts.step}|${opts.fitMorphs}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const outline = outlineFor(spec);
  const poly = outline.polygon;
  const T = THICKNESS[spec.fabric] * (spec.kind === "vest" ? 1.2 : 1);
  const R = Math.max(T * 1.6, 0.022);
  const step = opts.step ?? 0.0075;
  const { minX, maxX, minY, maxY } = outline.bounds;
  const x0 = minX - step;
  const y0 = minY - step;
  const nx = Math.ceil((maxX - minX) / step) + 3;
  const ny = Math.ceil((maxY - minY) / step) + 3;
  const W = maxX - minX;
  const H = maxY - minY;

  const inside = new Uint8Array(nx * ny);
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) inside[j * nx + i] = pointInPolygon(x0 + i * step, y0 + j * step, poly) ? 1 : 0;

  const keepCell = (i: number, j: number) =>
    inside[j * nx + i] | inside[j * nx + i + 1] | inside[(j + 1) * nx + i] | inside[(j + 1) * nx + i + 1];

  const index = new Int32Array(nx * ny).fill(-1);
  const px: number[] = [];
  const py: number[] = [];
  const pd: number[] = [];
  const cells: number[] = [];
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      if (!keepCell(i, j)) continue;
      cells.push(i, j);
      for (const [ii, jj] of [
        [i, j],
        [i + 1, j],
        [i, j + 1],
        [i + 1, j + 1],
      ]) {
        const k = jj * nx + ii;
        if (index[k] !== -1) continue;
        const x = x0 + ii * step;
        const y = y0 + jj * step;
        const c = closestOnPolygon(x, y, poly);
        index[k] = px.length;
        if (inside[k]) {
          px.push(x);
          py.push(y);
          pd.push(c.d);
        } else {
          px.push(c.p[0]);
          py.push(c.p[1]);
          pd.push(0);
        }
      }
    }
  }

  const n = px.length;
  const quilt = spec.kind === "vest";
  const zFront = new Float32Array(n);
  const zBack = new Float32Array(n);
  for (let v = 0; v < n; v++) {
    let z = profileZ(pd[v], T, R);
    if (quilt) {
      // horizontal down channels, pinched at the stitch lines
      const ch = 0.082;
      const f = (((maxY - py[v]) / ch) % 1 + 1) % 1;
      z *= 0.45 + 0.55 * Math.sin(Math.PI * f);
    }
    const edge = Math.min(pd[v] / (R * 2.5), 1);
    // broad soft folds plus finer creases; fabric hangs, so folds run mostly vertically
    const broad = fbm(px[v] * 4 + 3, py[v] * 1.6, 3, 11) - 0.5;
    const fine = fbm(px[v] * 14, py[v] * 5, 2, 17) - 0.5;
    const wrinkle = (broad * 1.6 + fine * 0.6) * T * edge;
    zFront[v] = z + wrinkle;
    zBack[v] = -(z + (fbm(px[v] * 4, py[v] * 1.6 + 9, 3, 23) - 0.5) * T * 1.2 * edge);
  }

  const pos = new Float32Array(n * 2 * 3);
  const uv = new Float32Array(n * 2 * 2);
  const uv1 = new Float32Array(n * 2 * 2);
  for (let v = 0; v < n; v++) {
    const u = (px[v] - minX) / W;
    const t = (py[v] - minY) / H;
    pos.set([px[v], py[v], zFront[v]], v * 3);
    pos.set([px[v], py[v], zBack[v]], (n + v) * 3);
    uv.set([u, t], v * 2);
    uv.set([1 - u, t], (n + v) * 2);
    uv1.set([px[v] * 6, py[v] * 6], v * 2);
    uv1.set([-px[v] * 6, py[v] * 6], (n + v) * 2);
  }

  const idxFront: number[] = [];
  const idxBack: number[] = [];
  for (let c = 0; c < cells.length; c += 2) {
    const i = cells[c];
    const j = cells[c + 1];
    const a = index[j * nx + i];
    const b = index[j * nx + i + 1];
    const d = index[(j + 1) * nx + i];
    const e = index[(j + 1) * nx + i + 1];
    idxFront.push(a, b, e, a, e, d);
    idxBack.push(n + a, n + e, n + b, n + a, n + d, n + e);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setAttribute("uv1", new THREE.BufferAttribute(uv1, 2));
  geometry.setIndex([...idxFront, ...idxBack]);
  geometry.addGroup(0, idxFront.length, 0);
  geometry.addGroup(idxFront.length, idxBack.length, 1);
  geometry.computeVertexNormals();

  if (opts.fitMorphs && outline.legs && spec.kind === "jeans") {
    const base = outline.legs;
    const targets: THREE.BufferAttribute[] = [];
    const normals: THREE.BufferAttribute[] = [];
    for (const fit of FIT_ORDER) {
      const warped = warpLegs(pos, base, FIT_PROFILES[fit]);
      targets.push(new THREE.BufferAttribute(warped, 3));
      const tmp = new THREE.BufferGeometry();
      tmp.setAttribute("position", new THREE.BufferAttribute(warped, 3));
      tmp.setIndex(geometry.getIndex());
      tmp.computeVertexNormals();
      normals.push(tmp.getAttribute("normal") as THREE.BufferAttribute);
      tmp.dispose();
    }
    geometry.morphAttributes.position = targets;
    geometry.morphAttributes.normal = normals;
  }

  geometry.computeBoundingSphere();
  const result = { geometry, outline, thickness: T };
  cache.set(key, result);
  return result;
}

/** Re-maps every vertex from one leg profile to another, keeping topology. */
function warpLegs(src: Float32Array, from: LegProfile, to: LegProfile) {
  const out = new Float32Array(src.length);
  const fromLen = from.crotchY - from.hemY;
  const toLen = to.crotchY - to.hemY;
  for (let i = 0; i < src.length; i += 3) {
    const x = src[i];
    const y = src[i + 1];
    const z = src[i + 2];
    let nx = x;
    let ny = y;
    if (y <= from.crotchY) {
      const t = Math.min(1, (from.crotchY - y) / fromLen);
      const s = Math.sign(x) || 1;
      const a = legAt(from, t);
      const b = legAt(to, t);
      const wa = Math.max(a.outer - a.inner, 1e-4);
      const frac = (Math.abs(x) - a.inner) / wa;
      nx = s * (b.inner + frac * (b.outer - b.inner));
      ny = to.crotchY - toLen * t;
    } else {
      // hips: blend from waist (unchanged) to the hip width of the target fit
      // waist unchanged, hip line matches the target, crotch meets the leg's outer seam
      const hipR = to.hip / from.hip;
      const seamR = legAt(to, 0).outer / legAt(from, 0).outer;
      const k = Math.min(1, Math.max(0, y / -0.2));
      const k2 = Math.min(1, Math.max(0, (y + 0.2) / (from.crotchY + 0.2)));
      const ratio = y > -0.2 ? 1 + (hipR - 1) * k : hipR + (seamR - hipR) * k2;
      nx = x * ratio;
      ny = (y / from.crotchY) * to.crotchY;
    }
    out[i] = nx;
    out[i + 1] = ny;
    out[i + 2] = z;
  }
  return out;
}

// ---------------------------------------------------------------- belt

/** A rolled leather belt with a buckle, lying on its side (for product shots). */
export function beltGeometry() {
  const strap = new THREE.BufferGeometry();
  const turns = 3.2;
  const segs = 420;
  const width = 0.035;
  const thick = 0.005;
  const verts: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const ang = t * turns * Math.PI * 2;
    const r = 0.05 + t * 0.055;
    const x = Math.cos(ang) * r;
    const y = Math.sin(ang) * r;
    const nx = Math.cos(ang);
    const ny = Math.sin(ang);
    for (const [dz, off] of [
      [-width / 2, 0],
      [width / 2, 0],
      [width / 2, thick],
      [-width / 2, thick],
    ]) {
      verts.push(x + nx * off, y + ny * off, dz);
      uvs.push(t, dz > 0 ? 1 : 0);
    }
  }
  for (let i = 0; i < segs; i++) {
    for (let k = 0; k < 4; k++) {
      const a = i * 4 + k;
      const b = i * 4 + ((k + 1) % 4);
      const c = (i + 1) * 4 + k;
      const d = (i + 1) * 4 + ((k + 1) % 4);
      idx.push(a, c, b, b, c, d);
    }
  }
  strap.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  strap.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  strap.setIndex(idx);
  strap.computeVertexNormals();

  const endAng = turns * Math.PI * 2;
  const radial = new THREE.Vector2(Math.cos(endAng), Math.sin(endAng));
  const tangent = new THREE.Vector2(-radial.y, radial.x);
  const buckleShape = new THREE.Shape();
  const bw = 0.03,
    bh = 0.026,
    rr = 0.008;
  buckleShape.moveTo(-bw + rr, -bh);
  buckleShape.lineTo(bw - rr, -bh);
  buckleShape.quadraticCurveTo(bw, -bh, bw, -bh + rr);
  buckleShape.lineTo(bw, bh - rr);
  buckleShape.quadraticCurveTo(bw, bh, bw - rr, bh);
  buckleShape.lineTo(-bw + rr, bh);
  buckleShape.quadraticCurveTo(-bw, bh, -bw, bh - rr);
  buckleShape.lineTo(-bw, -bh + rr);
  buckleShape.quadraticCurveTo(-bw, -bh, -bw + rr, -bh);
  const hole = new THREE.Path();
  const iw = bw - 0.007,
    ih = bh - 0.007;
  hole.moveTo(-iw, -ih);
  hole.lineTo(-iw, ih);
  hole.lineTo(iw, ih);
  hole.lineTo(iw, -ih);
  hole.lineTo(-iw, -ih);
  buckleShape.holes.push(hole);
  const buckle = new THREE.ExtrudeGeometry(buckleShape, { depth: 0.004, bevelEnabled: true, bevelSize: 0.0015, bevelThickness: 0.0015, bevelSegments: 3, curveSegments: 8 });
  buckle.translate(0, 0, -0.002);
  buckle.rotateX(Math.PI / 2);
  buckle.rotateZ(endAng + Math.PI / 2);
  const at = radial.clone().multiplyScalar(0.105 + 0.006).add(tangent.clone().multiplyScalar(0.022));
  buckle.translate(at.x, at.y, 0);
  return { strap, buckle };
}
