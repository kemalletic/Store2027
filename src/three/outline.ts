import type { Fit, GarmentKind, GarmentSpec } from "@/lib/types";

/**
 * Flat garment outlines in metres, as the garment hangs facing the viewer.
 * The origin is the top centre of the garment (collar or waistband) and y
 * grows upwards, so the body sits at negative y.
 */

export type Pt = [number, number];

class PathBuilder {
  pts: Pt[] = [];
  private get last(): Pt {
    return this.pts[this.pts.length - 1];
  }
  move(x: number, y: number) {
    this.pts.push([x, y]);
    return this;
  }
  line(x: number, y: number) {
    const [x0, y0] = this.last;
    const n = Math.max(1, Math.ceil(Math.hypot(x - x0, y - y0) / 0.01));
    for (let i = 1; i <= n; i++) this.pts.push([x0 + ((x - x0) * i) / n, y0 + ((y - y0) * i) / n]);
    return this;
  }
  quad(cx: number, cy: number, x: number, y: number) {
    const [x0, y0] = this.last;
    const n = Math.max(4, Math.ceil((Math.hypot(cx - x0, cy - y0) + Math.hypot(x - cx, y - cy)) / 0.01));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const a = (1 - t) * (1 - t);
      const b = 2 * (1 - t) * t;
      const c = t * t;
      this.pts.push([a * x0 + b * cx + c * x, a * y0 + b * cy + c * y]);
    }
    return this;
  }
  /** Samples y -> x along a vertical run, for leg seams. */
  run(fn: (t: number) => Pt, steps: number) {
    for (let i = 1; i <= steps; i++) this.pts.push(fn(i / steps));
    return this;
  }
}

/** Mirrors a right-hand half outline (top centre → bottom centre) into a closed polygon. */
function mirror(half: Pt[]): Pt[] {
  const left = half
    .slice(1, -1)
    .reverse()
    .map(([x, y]) => [-x, y] as Pt);
  return [...half, ...left];
}

export interface LegProfile {
  hip: number;
  crotchY: number;
  hemY: number;
  /** Outer seam x at thigh, knee and hem. */
  outer: [number, number, number];
  /** Leg width at thigh, knee and hem. */
  width: [number, number, number];
}

export const FIT_PROFILES: Record<Fit, LegProfile> = {
  slim: { hip: 0.235, crotchY: -0.29, hemY: -1.04, outer: [0.235, 0.228, 0.226], width: [0.228, 0.172, 0.152] },
  tapered: { hip: 0.245, crotchY: -0.3, hemY: -1.02, outer: [0.248, 0.238, 0.222], width: [0.248, 0.19, 0.152] },
  regular: { hip: 0.245, crotchY: -0.3, hemY: -1.04, outer: [0.247, 0.25, 0.255], width: [0.245, 0.205, 0.19] },
  relaxed: { hip: 0.252, crotchY: -0.31, hemY: -1.04, outer: [0.256, 0.268, 0.278], width: [0.258, 0.235, 0.228] },
  loose: { hip: 0.262, crotchY: -0.32, hemY: -1.05, outer: [0.268, 0.292, 0.31], width: [0.278, 0.272, 0.272] },
};

function lerp3(v: [number, number, number], t: number) {
  // thigh at t=0, knee at t=0.45, hem at t=1, with smooth interpolation
  if (t < 0.45) {
    const k = t / 0.45;
    const s = k * k * (3 - 2 * k);
    return v[0] + (v[1] - v[0]) * s;
  }
  const k = (t - 0.45) / 0.55;
  return v[1] + (v[2] - v[1]) * k;
}

/** Outer and inner seam x of the right leg at parameter t (0 crotch, 1 hem). */
export function legAt(p: LegProfile, t: number) {
  const outer = lerp3(p.outer, t);
  let width = lerp3(p.width, t);
  // at the crotch the inner seam meets the centre line
  if (t < 0.08) width = width + (outer - width) * (1 - t / 0.08) * (1 - t / 0.08);
  return { outer, inner: outer - width };
}

function pants(profile: LegProfile, waist: number, cuff = 0): Pt[] {
  const p = new PathBuilder().move(0, 0).line(waist, 0);
  p.quad(profile.hip + 0.004, -0.06, profile.hip, -0.2);
  p.line(legAt(profile, 0).outer, profile.crotchY);
  const legLen = profile.crotchY - profile.hemY;
  p.run((t) => [legAt(profile, t).outer, profile.crotchY - legLen * t], 70);
  if (cuff) {
    // jogger cuff: the leg gathers into a narrower rib band
    const { outer, inner } = legAt(profile, 1);
    const mid = (outer + inner) / 2;
    const half = (outer - inner) / 2;
    p.line(mid + half * 0.72, profile.hemY - 0.012);
    p.line(mid + half * 0.72, profile.hemY - cuff);
    p.line(mid - half * 0.72, profile.hemY - cuff);
    p.line(mid - half * 0.72, profile.hemY - 0.012);
    p.line(inner, profile.hemY);
  } else {
    p.line(legAt(profile, 1).inner, profile.hemY);
  }
  p.run((t) => {
    const tt = 1 - t;
    return [Math.max(0, legAt(profile, tt).inner), profile.crotchY - legLen * tt];
  }, 70);
  const pts = p.pts;
  pts[pts.length - 1] = [0, profile.crotchY];
  return mirror(pts);
}

export const SWEATPANT_PROFILE: LegProfile = {
  hip: 0.25,
  crotchY: -0.33,
  hemY: -0.98,
  outer: [0.256, 0.258, 0.238],
  width: [0.262, 0.215, 0.165],
};

export const SHORTS_PROFILE: LegProfile = {
  hip: 0.25,
  crotchY: -0.3,
  hemY: -0.52,
  outer: [0.258, 0.268, 0.276],
  width: [0.262, 0.262, 0.262],
};

function tee(oversized: boolean): Pt[] {
  const w = oversized ? 0.3 : 0.255;
  const sh = oversized ? 0.27 : 0.225;
  const len = oversized ? -0.76 : -0.72;
  const p = new PathBuilder().move(0, -0.012);
  p.quad(0.05, -0.01, 0.088, 0.004);
  p.line(sh, -0.05);
  if (oversized) {
    p.line(0.43, -0.2).line(0.37, -0.31).line(w, -0.27);
  } else {
    p.line(0.395, -0.205).line(0.33, -0.28).line(w, -0.235);
  }
  p.line(w + 0.004, len + 0.02);
  p.quad(w * 0.6, len - 0.004, 0, len);
  return mirror(p.pts);
}

function longSleeveTop(opts: { body: number; len: number; shoulder: number; cuffOuter: Pt; cuffInner: Pt; neck: number; collarUp?: number; hood?: boolean }): Pt[] {
  const { body, len, shoulder, cuffOuter, cuffInner, neck, collarUp = 0, hood = false } = opts;
  const p = new PathBuilder().move(0, hood ? 0.19 : collarUp ? collarUp - 0.008 : -0.012);
  if (hood) {
    // the hood stands up behind the neck when the hoodie hangs
    p.quad(0.1, 0.19, 0.125, 0.11);
    p.quad(0.135, 0.04, neck * 1.25, 0.0);
  } else if (collarUp) {
    p.line(neck * 0.7, collarUp);
    p.quad(neck * 1.05, collarUp, neck * 1.05, 0.0);
  } else {
    p.quad(neck * 0.6, -0.01, neck, 0.004);
  }
  p.line(shoulder, -0.055);
  p.quad(shoulder + 0.06, -0.12, cuffOuter[0], cuffOuter[1]);
  p.line(cuffInner[0], cuffInner[1]);
  p.line(body + 0.005, -0.26);
  p.line(body, len + 0.012);
  p.quad(body * 0.6, len, 0, len);
  return mirror(p.pts);
}

function vest(): Pt[] {
  const p = new PathBuilder().move(0, 0.05);
  p.line(0.085, 0.055);
  p.quad(0.105, 0.05, 0.11, 0.0);
  p.line(0.175, -0.035);
  p.quad(0.18, -0.2, 0.262, -0.27);
  p.line(0.27, -0.66);
  p.quad(0.16, -0.672, 0, -0.67);
  return mirror(p.pts);
}

function belt(): Pt[] {
  // a belt is hung by its buckle; it is modelled separately (see beltGeometry)
  return [];
}

export interface Outline {
  polygon: Pt[];
  /** Leg profile when the garment has legs (used for fit morphs). */
  legs?: LegProfile;
  waist?: number;
  /** Fold lines used by the fold-into-box animation. */
  foldX: number;
  foldY: number;
  /** 0 tops (sleeves fold in), 1 bottoms (one leg over the other). */
  foldMode: 0 | 1;
  /** Where the hanger touches the garment (y of hook). */
  hangY: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
}

function bounds(poly: Pt[]) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

export function outlineFor(spec: GarmentSpec): Outline {
  const kind: GarmentKind = spec.kind;
  let polygon: Pt[];
  let legs: LegProfile | undefined;
  let waist: number | undefined;
  let foldX = 0.16;
  let foldY = -0.36;
  let foldMode: 0 | 1 = 0;
  switch (kind) {
    case "jeans": {
      legs = FIT_PROFILES[spec.fit ?? "regular"];
      waist = legs.hip - 0.045;
      polygon = pants(legs, waist);
      foldMode = 1;
      foldY = -0.56;
      break;
    }
    case "sweatpants":
      legs = SWEATPANT_PROFILE;
      waist = 0.2;
      polygon = pants(legs, waist, 0.07);
      foldMode = 1;
      foldY = -0.55;
      break;
    case "shorts":
      legs = SHORTS_PROFILE;
      waist = 0.205;
      polygon = pants(legs, waist);
      foldMode = 1;
      foldY = -0.26;
      break;
    case "tee":
      polygon = tee(!!spec.oversized);
      foldX = spec.oversized ? 0.17 : 0.15;
      foldY = -0.38;
      break;
    case "sweater":
      polygon = longSleeveTop({ body: 0.25, len: -0.68, shoulder: 0.225, cuffOuter: [0.43, -0.66], cuffInner: [0.35, -0.69], neck: 0.085 });
      break;
    case "hoodie":
      polygon = longSleeveTop({ body: 0.27, len: -0.7, shoulder: 0.24, cuffOuter: [0.45, -0.68], cuffInner: [0.365, -0.71], neck: 0.1, hood: true });
      foldX = 0.17;
      break;
    case "jacket":
      polygon = longSleeveTop({ body: 0.27, len: -0.62, shoulder: 0.245, cuffOuter: [0.46, -0.64], cuffInner: [0.375, -0.665], neck: 0.095, collarUp: 0.03 });
      foldX = 0.17;
      foldY = -0.33;
      break;
    case "bomber":
      polygon = longSleeveTop({ body: 0.28, len: -0.6, shoulder: 0.25, cuffOuter: [0.47, -0.62], cuffInner: [0.385, -0.645], neck: 0.095, collarUp: 0.025 });
      foldX = 0.17;
      foldY = -0.32;
      break;
    case "vest":
      polygon = vest();
      foldX = 0.14;
      foldY = -0.33;
      break;
    case "belt":
      polygon = belt();
      break;
  }
  return {
    polygon,
    legs,
    waist,
    foldX,
    foldY,
    foldMode,
    hangY: 0,
    bounds: polygon.length ? bounds(polygon) : { minX: -0.2, maxX: 0.2, minY: -0.4, maxY: 0.05 },
  };
}

// ---------------------------------------------------------------- geometry helpers

export function pointInPolygon(x: number, y: number, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Distance to the polygon boundary and the closest boundary point. */
export function closestOnPolygon(x: number, y: number, poly: Pt[]): { d: number; p: Pt } {
  let best = Infinity;
  let bx = 0,
    by = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = poly[j];
    const [cx, cy] = poly[i];
    const dx = cx - ax;
    const dy = cy - ay;
    const l2 = dx * dx + dy * dy || 1e-12;
    let t = ((x - ax) * dx + (y - ay) * dy) / l2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const px = ax + t * dx;
    const py = ay + t * dy;
    const d2 = (x - px) * (x - px) + (y - py) * (y - py);
    if (d2 < best) {
      best = d2;
      bx = px;
      by = py;
    }
  }
  return { d: Math.sqrt(best), p: [bx, by] };
}
