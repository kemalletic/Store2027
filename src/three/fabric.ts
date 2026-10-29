import * as THREE from "three";
import type { Fabric, GarmentSpec, Wash } from "@/lib/types";
import { legAt, type Outline, type Pt } from "./outline";
import { heightToNormal, makeCanvas, mulberry32, noiseCanvas, fbm } from "./noise";

/**
 * Procedural cloth: each garment gets a painted front and back texture
 * (seams, pockets, rivets, ribs, prints) mapped over its outline, plus a small
 * tiled normal map for the weave itself.
 */

export const WASH_COLORS: Record<Wash, string> = {
  raw: "#1b2741",
  dark: "#22314f",
  mid: "#3f587c",
  light: "#7f9aba",
  black: "#1d1e21",
};

/** Brand topstitch: a muted lime, the "šav" of the identity. */
export const BRAND_THREAD = "#cfdc4c";

const PPM = 1300; // texture pixels per metre

type Ctx = CanvasRenderingContext2D;

interface Painter {
  ctx: Ctx;
  w: number;
  h: number;
  /** garment metres → canvas px */
  p: (x: number, y: number) => Pt;
  /** metres → px length */
  s: (m: number) => number;
  outline: Outline;
  spec: GarmentSpec;
  side: "front" | "back";
  base: string;
  thread: string;
  metal: string;
  rand: () => number;
}

function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l + amt)));
  return `#${c.getHexString()}`;
}

/** Lightens dark cloth and darkens light cloth, so details stay visible on black. */
function detail(hex: string, amt: number) {
  const l = new THREE.Color(hex).getHSL({ h: 0, s: 0, l: 0 }).l;
  return shade(hex, l < 0.2 ? Math.abs(amt) + 0.03 : amt);
}

function rgba(hex: string, a: number) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}

let family: string | null = null;
/** The page's Archivo family (next/font exposes it as a CSS variable). */
function fontFamily() {
  if (family) return family;
  const v = typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim() : "";
  family = v ? `${v}, "Arial Black", sans-serif` : `"Arial Black", sans-serif`;
  return family;
}

// ---------------------------------------------------------------- primitives

function path(P: Painter, pts: Pt[], close = false) {
  const { ctx } = P;
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const [a, b] = P.p(x, y);
    if (i === 0) ctx.moveTo(a, b);
    else ctx.lineTo(a, b);
  });
  if (close) ctx.closePath();
}

function quadPts(a: Pt, c: Pt, b: Pt, n = 24): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]);
  }
  return out;
}

function offsetPts(pts: Pt[], d: number): Pt[] {
  return pts.map((pt, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [pt[0] - (dy / l) * d, pt[1] + (dx / l) * d] as Pt;
  });
}

/** Topstitching: short dashes with a soft shadow so they sit in the cloth. */
function stitch(P: Painter, pts: Pt[], opts: { color?: string; width?: number; double?: number; dash?: number } = {}) {
  const { ctx } = P;
  const color = opts.color ?? P.thread;
  const lines = opts.double ? [offsetPts(pts, -opts.double / 2), offsetPts(pts, opts.double / 2)] : [pts];
  ctx.save();
  ctx.lineCap = "round";
  for (const l of lines) {
    ctx.setLineDash([P.s(opts.dash ?? 0.004), P.s((opts.dash ?? 0.004) * 0.75)]);
    ctx.lineWidth = P.s(opts.width ?? 0.0016);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.translate(0, 1.2);
    path(P, l);
    ctx.stroke();
    ctx.translate(0, -1.2);
    ctx.strokeStyle = color;
    path(P, l);
    ctx.stroke();
  }
  ctx.restore();
}

/** A seam: a soft dark fold line, optionally with stitching beside it. */
function seam(P: Painter, pts: Pt[], stitchOffset = 0.006, withStitch = true) {
  const { ctx } = P;
  ctx.save();
  ctx.lineWidth = P.s(0.004);
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.filter = `blur(${P.s(0.0015)}px)`;
  path(P, pts);
  ctx.stroke();
  ctx.filter = "none";
  ctx.lineWidth = P.s(0.0012);
  ctx.strokeStyle = rgba(shade(P.base, 0.16), 0.6);
  path(P, offsetPts(pts, 0.0018));
  ctx.stroke();
  ctx.restore();
  if (withStitch) stitch(P, offsetPts(pts, stitchOffset));
}

function rivet(P: Painter, x: number, y: number, r = 0.0045) {
  const { ctx } = P;
  const [cx, cy] = P.p(x, y);
  const g = ctx.createRadialGradient(cx - P.s(r) * 0.35, cy - P.s(r) * 0.35, 0, cx, cy, P.s(r));
  g.addColorStop(0, shade(P.metal, 0.35));
  g.addColorStop(0.6, P.metal);
  g.addColorStop(1, shade(P.metal, -0.25));
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = P.s(0.003);
  ctx.shadowOffsetY = P.s(0.001);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, P.s(r), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function button(P: Painter, x: number, y: number, r = 0.009) {
  rivet(P, x, y, r);
  const { ctx } = P;
  const [cx, cy] = P.p(x, y);
  ctx.save();
  ctx.strokeStyle = rgba(shade(P.metal, -0.3), 0.7);
  ctx.lineWidth = P.s(0.0012);
  ctx.beginPath();
  ctx.arc(cx, cy, P.s(r * 0.62), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function fillShape(P: Painter, pts: Pt[], color: string, shadow = 0.004) {
  const { ctx } = P;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = P.s(shadow);
  ctx.shadowOffsetY = P.s(shadow * 0.35);
  ctx.fillStyle = color;
  path(P, pts, true);
  ctx.fill();
  ctx.restore();
}

function texturedFill(P: Painter, pts: Pt[], color: string, shadow = 0.004) {
  fillShape(P, pts, color, shadow);
  const { ctx } = P;
  ctx.save();
  path(P, pts, true);
  ctx.clip();
  grain(P, 0.5);
  ctx.restore();
}

function rib(P: Painter, pts: Pt[], color: string, pitch = 0.004, vertical = true) {
  const { ctx } = P;
  fillShape(P, pts, color, 0.003);
  ctx.save();
  path(P, pts, true);
  ctx.clip();
  ctx.lineWidth = P.s(pitch * 0.4);
  const step = P.s(pitch);
  for (const [style, off] of [
    ["rgba(0,0,0,0.3)", 0],
    ["rgba(255,255,255,0.07)", step / 2],
  ] as const) {
    ctx.strokeStyle = style;
    if (vertical) {
      for (let x = off; x < P.w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, P.h);
        ctx.stroke();
      }
    } else {
      for (let y = off; y < P.h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(P.w, y);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}

/** Angled rib that follows a polyline (cuffs that are not axis aligned). */
function ribAlong(P: Painter, a: Pt, b: Pt, depth: number, color: string) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  const nx = -dy / l;
  const ny = dx / l;
  // depth goes towards the inside of the garment (the side the normal points to)
  const pts: Pt[] = [a, b, [b[0] + nx * depth, b[1] + ny * depth], [a[0] + nx * depth, a[1] + ny * depth]];
  fillShape(P, pts, color, 0.003);
  const { ctx } = P;
  ctx.save();
  path(P, pts, true);
  ctx.clip();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = P.s(0.0015);
  const n = Math.round(l / 0.004);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a[0] + dx * t;
    const y = a[1] + dy * t;
    path(P, [
      [x, y],
      [x + nx * depth, y + ny * depth],
    ]);
    ctx.stroke();
  }
  ctx.restore();
}

function text(P: Painter, str: string, x: number, y: number, size: number, color: string, opts: { weight?: number; stretch?: string; rotate?: number; align?: CanvasTextAlign; tracking?: number } = {}) {
  const { ctx } = P;
  const [cx, cy] = P.p(x, y);
  ctx.save();
  ctx.translate(cx, cy);
  if (opts.rotate) ctx.rotate(opts.rotate);
  ctx.fillStyle = color;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "middle";
  ctx.font = `${opts.stretch ?? ""} ${opts.weight ?? 800} ${P.s(size)}px ${fontFamily()}`;
  if (opts.tracking) (ctx as Ctx & { letterSpacing: string }).letterSpacing = `${P.s(opts.tracking)}px`;
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

function grain(P: Painter, strength = 1) {
  const { ctx } = P;
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.55 * strength;
  ctx.fillStyle = ctx.createPattern(noiseCanvas(128, 48, 2, 5), "repeat")!;
  ctx.fillRect(0, 0, P.w, P.h);
  // broad, gentle tone variation
  ctx.globalAlpha = 0.12 * strength;
  ctx.drawImage(noiseCanvas(128, 3, 3, 9), 0, 0, P.w, P.h);
  ctx.restore();
}

// ---------------------------------------------------------------- base cloth

function baseCloth(P: Painter) {
  const { ctx, w, h, spec } = P;
  ctx.fillStyle = P.base;
  ctx.fillRect(0, 0, w, h);
  const fabric: Fabric = spec.fabric;

  if (fabric === "denim") {
    // slub: vertical streaks of lighter yarn
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = spec.wash === "black" ? 0.08 : 0.16;
    // a thin slice of noise stretched vertically reads as yarn slubs
    for (let x = 0; x < w; x += 256) ctx.drawImage(noiseCanvas(256, 64, 2, 31), 0, 0, 256, 6, x, 0, 256, h);
    ctx.restore();
    // 3x1 twill diagonals
    ctx.save();
    ctx.strokeStyle = spec.wash === "black" ? "rgba(255,255,255,0.05)" : "rgba(220,230,255,0.08)";
    ctx.lineWidth = 1.4;
    for (let i = -h; i < w; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, h);
      ctx.lineTo(i + h, 0);
      ctx.stroke();
    }
    ctx.restore();
  } else if (fabric === "twill") {
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    for (let i = -h; i < w; i += 3) {
      ctx.beginPath();
      ctx.moveTo(i, h);
      ctx.lineTo(i + h, 0);
      ctx.stroke();
    }
    ctx.restore();
  } else if (fabric === "fleece" || fabric === "knit") {
    // heather: tiny light and dark flecks
    const r = P.rand;
    ctx.save();
    const n = Math.round((w * h) / (fabric === "fleece" ? 60 : 110));
    for (let i = 0; i < n; i++) {
      const light = r() > 0.5;
      ctx.fillStyle = light ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
      ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 3);
    }
    ctx.restore();
  } else if (fabric === "nylon") {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(255,255,255,0.06)");
    g.addColorStop(0.5, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  grain(P, fabric === "nylon" ? 0.4 : 1);
}

/** Darkens the cloth towards the outline so the silhouette reads as volume. */
function edgeShade(P: Painter, amount = 0.32) {
  const { ctx } = P;
  ctx.save();
  ctx.strokeStyle = `rgba(0,0,0,${amount})`;
  ctx.lineWidth = P.s(0.05);
  ctx.filter = `blur(${P.s(0.016)}px)`;
  path(P, P.outline.polygon, true);
  ctx.stroke();
  ctx.restore();
}

/** Lighter wear on the front of denim: thighs, knees, whiskers. */
function denimWear(P: Painter, legs: boolean) {
  const { ctx, spec } = P;
  if (spec.wash === "raw") return;
  const strength = spec.wash === "light" ? 0.34 : spec.wash === "mid" ? 0.26 : spec.wash === "black" ? 0.12 : 0.16;
  const light = spec.wash === "black" ? "#9a9ea6" : "#b9cbe3";
  const blob = (x: number, y: number, rx: number, ry: number, a: number) => {
    const [cx, cy] = P.p(x, y);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, P.s(rx));
    g.addColorStop(0, rgba(light, a));
    g.addColorStop(1, rgba(light, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, P.s(rx), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  if (legs && P.outline.legs) {
    const L = P.outline.legs;
    const len = L.crotchY - L.hemY;
    for (const s of [-1, 1]) {
      const thigh = legAt(L, 0.2);
      const knee = legAt(L, 0.47);
      blob(s * (thigh.outer + thigh.inner) / 2, L.crotchY - len * 0.15, 0.08, 0.2, strength);
      blob(s * (knee.outer + knee.inner) / 2, L.crotchY - len * 0.47, 0.06, 0.09, strength * 0.7);
    }
    if (P.side === "front") {
      // whiskers fanning out from the crotch
      ctx.save();
      ctx.lineCap = "round";
      ctx.filter = `blur(${P.s(0.003)}px)`;
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const y = L.crotchY + 0.045 - i * 0.022;
          const pts = quadPts([s * 0.04, y - 0.01], [s * 0.1, y + 0.012], [s * (0.15 + i * 0.012), y + 0.022 - i * 0.004]);
          ctx.lineWidth = P.s(0.006 - i * 0.0008);
          ctx.strokeStyle = rgba(light, strength * 0.9);
          path(P, pts);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  } else {
    const b = P.outline.bounds;
    blob(0.08, (b.minY + b.maxY) / 2, 0.16, 0.2, strength * 0.6);
    blob(-0.08, (b.minY + b.maxY) / 2, 0.16, 0.2, strength * 0.6);
  }
}

// ---------------------------------------------------------------- garments

function paintPants(P: Painter) {
  const { spec, side } = P;
  const L = P.outline.legs!;
  const waist = P.outline.waist ?? 0.2;
  const len = L.crotchY - L.hemY;
  const legPt = (t: number, s: number, k: number): Pt => {
    const a = legAt(L, t);
    return [s * (a.inner + (a.outer - a.inner) * k), L.crotchY - len * t];
  };

  if (spec.kind === "sweatpants") {
    // elastic waistband
    rib(P, [[-waist - 0.01, 0.002], [waist + 0.01, 0.002], [waist + 0.01, -0.05], [-waist - 0.01, -0.05]], detail(P.base, -0.03), 0.005, true);
    seam(P, [[-waist, -0.05], [waist, -0.05]], 0.0, false);
    if (side === "front") {
      // drawstrings
      for (const s of [-1, 1]) {
        const pts = quadPts([s * 0.02, -0.03], [s * 0.035, -0.12], [s * 0.028, -0.2]);
        const { ctx } = P;
        ctx.save();
        ctx.lineCap = "round";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = P.s(0.004);
        ctx.lineWidth = P.s(0.0075);
        ctx.strokeStyle = shade(P.base, 0.18);
        path(P, pts);
        ctx.stroke();
        ctx.restore();
        const end = pts[pts.length - 1];
        fillShape(P, [[end[0] - 0.005, end[1]], [end[0] + 0.005, end[1]], [end[0] + 0.004, end[1] - 0.026], [end[0] - 0.004, end[1] - 0.026]], P.metal, 0.002);
        rivet(P, s * 0.02, -0.028, 0.005);
      }
      // slanted side pockets
      for (const s of [-1, 1]) seam(P, [[s * (waist - 0.035), -0.055], [s * (L.hip - 0.012), -0.2]], 0.005, false);
      text(P, "BOX", -0.16, -0.36, 0.022, rgba(shade(P.base, 0.28), 0.9), { stretch: "expanded", tracking: 0.002 });
    } else {
      fillShape(P, [[0.06, -0.09], [0.15, -0.09], [0.15, -0.2], [0.06, -0.2]], shade(P.base, -0.015), 0.003);
      seam(P, [[0.06, -0.09], [0.15, -0.09]], 0.0, false);
    }
    // cuffs
    for (const s of [-1, 1]) {
      const a = legAt(L, 1);
      const mid = (a.outer + a.inner) / 2;
      const half = ((a.outer - a.inner) / 2) * 0.72;
      rib(P, [[s * (mid - half - 0.002), L.hemY - 0.012], [s * (mid + half + 0.002), L.hemY - 0.012], [s * (mid + half + 0.002), L.hemY - 0.075], [s * (mid - half - 0.002), L.hemY - 0.075]], detail(P.base, -0.04), 0.004, true);
      // gathered fabric above the cuff
      const { ctx } = P;
      ctx.save();
      ctx.strokeStyle = "rgba(0,0,0,0.16)";
      ctx.lineWidth = P.s(0.003);
      ctx.filter = `blur(${P.s(0.002)}px)`;
      for (let i = 0; i < 5; i++) {
        const x = s * (mid - half + (i + 0.5) * ((half * 2) / 5));
        path(P, [[x, L.hemY + 0.004], [x + s * 0.004, L.hemY + 0.07]]);
        ctx.stroke();
      }
      ctx.restore();
    }
    // side seams following the outer leg
    for (const s of [-1, 1]) {
      const pts: Pt[] = [];
      for (let i = 0; i <= 30; i++) pts.push(legPt(i / 30, s, 0.97));
      seam(P, [[s * (L.hip - 0.006), -0.06], ...pts], 0, false);
    }
    return;
  }

  // ---------------- jeans / shorts (five pocket construction)
  const band = 0.042;
  texturedFill(P, [[-waist - 0.01, 0.003], [waist + 0.01, 0.003], [waist + 0.004, -band], [-waist - 0.004, -band]], shade(P.base, 0.02), 0.003);
  stitch(P, [[-waist, -0.008], [waist, -0.008]]);
  stitch(P, [[-waist, -band + 0.006], [waist, -band + 0.006]]);
  seam(P, [[-waist - 0.004, -band], [waist + 0.004, -band]], 0, false);

  const loops = side === "front" ? [-0.17, -0.075, 0.075, 0.17] : [-0.13, 0, 0.13];
  for (const x of loops) {
    texturedFill(P, [[x - 0.007, 0.004], [x + 0.007, 0.004], [x + 0.007, -band - 0.006], [x - 0.007, -band - 0.006]], shade(P.base, 0.04), 0.004);
    stitch(P, [[x - 0.007, -0.001], [x + 0.007, -0.001]], { dash: 0.002 });
    stitch(P, [[x - 0.007, -band - 0.001], [x + 0.007, -band - 0.001]], { dash: 0.002 });
  }

  if (side === "front") {
    button(P, 0, -band / 2, 0.009);
    // fly with J-stitch
    const fly: Pt[] = [[0.034, -band], [0.034, -0.17], ...quadPts([0.034, -0.17], [0.034, -0.205], [0.004, -0.215], 12)];
    stitch(P, fly);
    seam(P, [[0, -band], [0, L.crotchY + 0.02]], 0, false);
    // front pockets
    for (const s of [-1, 1]) {
      const mouth = quadPts([s * (waist - 0.085), -band], [s * (waist - 0.06), -0.12], [s * (L.hip - 0.002), -0.135], 20);
      seam(P, mouth, -0.007 * s, false);
      stitch(P, offsetPts(mouth, -0.006 * s), { double: 0.004 });
      rivet(P, s * (L.hip - 0.012), -0.127);
      rivet(P, s * (waist - 0.08), -band - 0.008);
    }
    // coin pocket on the wearer's right (viewer's left)
    const cx = -(waist - 0.03);
    const coin: Pt[] = [[cx - 0.04, -band - 0.004], [cx + 0.02, -band - 0.004], [cx + 0.024, -0.1], [cx - 0.036, -0.1]];
    stitch(P, [coin[1], coin[2], coin[3]]);
    stitch(P, [[cx - 0.04, -band - 0.012], [cx + 0.022, -band - 0.012]]);
  } else {
    // yoke and back rise
    const yoke: Pt[] = [[-L.hip - 0.004, -0.1], [-0.02, -0.075], [0, -0.07], [0.02, -0.075], [L.hip + 0.004, -0.1]];
    seam(P, yoke, -0.006, true);
    stitch(P, offsetPts(yoke, -0.011));
    seam(P, [[0, -0.07], [0, L.crotchY + 0.02]], 0.006, true);
    // back pockets with the brand's arcuate
    for (const s of [-1, 1]) {
      const cx = s * 0.11;
      const top = -0.11;
      const pocket: Pt[] = [
        [cx - 0.07, top],
        [cx + 0.07, top - 0.004 * s],
        [cx + 0.064, top - 0.13],
        [cx, top - 0.155],
        [cx - 0.064, top - 0.13],
      ];
      texturedFill(P, pocket, shade(P.base, 0.025), 0.006);
      stitch(P, offsetPts([...pocket, pocket[0]], 0.005), { double: 0.0035 });
      stitch(P, [[cx - 0.068, top - 0.012], [cx + 0.068, top - 0.016 * s]]);
      const arc1 = quadPts([cx - 0.05, top - 0.045], [cx - 0.02, top - 0.1], [cx, top - 0.06], 16);
      const arc2 = quadPts([cx, top - 0.06], [cx + 0.02, top - 0.1], [cx + 0.05, top - 0.045], 16);
      stitch(P, [...arc1, ...arc2], { color: BRAND_THREAD, width: 0.002 });
      rivet(P, cx - 0.066, top - 0.004, 0.003);
      rivet(P, cx + 0.066, top - 0.004, 0.003);
    }
    // leather patch
    const px = 0.13;
    const patch: Pt[] = [[px - 0.045, -0.006], [px + 0.045, -0.006], [px + 0.045, -0.036], [px - 0.045, -0.036]];
    fillShape(P, patch, spec.wash === "black" ? "#2a2522" : "#7b5233", 0.003);
    text(P, "BOX", px, -0.021, 0.018, spec.wash === "black" ? "#4a423c" : "#5a3a22", { stretch: "expanded", tracking: 0.002 });
    stitch(P, offsetPts([...patch, patch[0]], -0.003), { color: "#d7c7a0", dash: 0.0025 });
  }

  // outseam / inseam stitch and hems
  for (const s of [-1, 1]) {
    const inner: Pt[] = [];
    for (let i = 0; i <= 40; i++) inner.push(legPt(i / 40, s, 0.03));
    stitch(P, inner, { dash: 0.005 });
    const hemA = legPt(1, s, 0);
    const hemB = legPt(1, s, 1);
    const hemY = L.hemY + (spec.kind === "shorts" ? 0.03 : 0.02);
    seam(P, [[hemA[0], hemY], [hemB[0], hemY]], 0, false);
    stitch(P, [[hemA[0], hemY - 0.008], [hemB[0], hemY - 0.008]]);
    if (spec.kind === "shorts" && side === "front" && spec.fabric === "twill") {
      // cargo pockets on the outer thigh
      const top = L.crotchY + 0.01;
      const x1 = s * (legAt(L, 0.1).outer - 0.012);
      const x0 = x1 - s * 0.11;
      const box: Pt[] = [[x0, top], [x1, top], [x1, top - 0.14], [x0, top - 0.14]];
      texturedFill(P, box, shade(P.base, 0.02), 0.006);
      stitch(P, offsetPts([...box, box[0]], 0.004 * s));
      const flap: Pt[] = [[x0 - s * 0.004, top + 0.012], [x1 + s * 0.004, top + 0.012], [x1 + s * 0.004, top - 0.035], [x0 - s * 0.004, top - 0.035]];
      texturedFill(P, flap, shade(P.base, 0.035), 0.007);
      stitch(P, offsetPts([...flap, flap[0]], 0.004 * s));
      button(P, (x0 + x1) / 2, top - 0.022, 0.006);
    }
  }

  if (spec.fabric === "denim" && spec.kind === "jeans") {
    // stacking creases near the hem
    const { ctx } = P;
    ctx.save();
    ctx.filter = `blur(${P.s(0.004)}px)`;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const t = 0.78 + i * 0.05 + P.rand() * 0.02;
        const a = legPt(t, s, 0.05);
        const b = legPt(t + 0.02, s, 0.95);
        ctx.lineWidth = P.s(0.008);
        ctx.strokeStyle = "rgba(0,0,0,0.18)";
        path(P, quadPts(a, [(a[0] + b[0]) / 2, a[1] - 0.02], b, 10));
        ctx.stroke();
        ctx.lineWidth = P.s(0.004);
        ctx.strokeStyle = "rgba(255,255,255,0.07)";
        path(P, quadPts([a[0], a[1] + 0.01], [(a[0] + b[0]) / 2, a[1] - 0.01], [b[0], b[1] + 0.01], 10));
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function neckline(P: Painter, depth: number, width: number, color: string, ribDepth = 0.016) {
  const outer = quadPts([-width, 0.004], [0, -depth * 2 + 0.004], [width, 0.004], 30);
  const inner = quadPts([width - ribDepth * 0.7, 0.004], [0, -depth * 2 + ribDepth * 2 + 0.004], [-width + ribDepth * 0.7, 0.004], 30);
  // inside of the back panel, seen through the neck opening
  fillShape(P, [[-width, 0.01], [width, 0.01], ...inner.slice().reverse().reverse()], shade(P.base, -0.2), 0.0);
  const band = [...outer, ...inner];
  rib(P, band, color, 0.0035, true);
  stitch(P, offsetPts(outer, -0.003), { color: rgba(shade(P.base, 0.15), 0.8) });
}

function sleeveHem(P: Painter, a: Pt, b: Pt, depth = 0.02) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  const nx = -dy / l;
  const ny = dx / l;
  const pa: Pt = [a[0] + nx * depth, a[1] + ny * depth];
  const pb: Pt = [b[0] + nx * depth, b[1] + ny * depth];
  seam(P, [pa, pb], 0, false);
  stitch(P, [[pa[0] - nx * 0.006, pa[1] - ny * 0.006], [pb[0] - nx * 0.006, pb[1] - ny * 0.006]], { color: rgba(shade(P.base, 0.14), 0.85) });
}

function paintTee(P: Painter) {
  const { spec, side } = P;
  const o = !!spec.oversized;
  const b = P.outline.bounds;
  if (side === "front") neckline(P, 0.03, 0.088, detail(P.base, -0.02), 0.016);
  else {
    rib(P, quadPts([-0.088, 0.004], [0, -0.016], [0.088, 0.004], 24).concat(quadPts([0.074, 0.004], [0, -0.0], [-0.074, 0.004], 24)), shade(P.base, -0.02), 0.0035);
    // woven label
    fillShape(P, [[-0.014, -0.006], [0.014, -0.006], [0.014, -0.026], [-0.014, -0.026]], "#151515", 0.001);
    text(P, "BOX", 0, -0.016, 0.008, "#d8f04a", { stretch: "expanded" });
  }
  // shoulder seams
  const sh = o ? 0.27 : 0.225;
  seam(P, [[0.088, 0.004], [sh, -0.05]], 0, false);
  seam(P, [[-0.088, 0.004], [-sh, -0.05]], 0, false);
  // armhole seams
  const arm: Pt[] = o
    ? [[0.27, -0.05], [0.3, -0.16], [0.3, -0.27]]
    : [[0.225, -0.05], [0.245, -0.14], [0.255, -0.235]];
  seam(P, arm, 0, false);
  seam(P, arm.map(([x, y]) => [-x, y] as Pt), 0, false);
  // sleeve hems
  if (o) {
    sleeveHem(P, [0.43, -0.2], [0.37, -0.31], 0.022);
    sleeveHem(P, [-0.37, -0.31], [-0.43, -0.2], 0.022);
  } else {
    sleeveHem(P, [0.395, -0.205], [0.33, -0.28]);
    sleeveHem(P, [-0.33, -0.28], [-0.395, -0.205]);
  }
  // bottom hem
  seam(P, [[b.minX, b.minY + 0.024], [b.maxX, b.minY + 0.024]], 0, false);
  stitch(P, [[b.minX, b.minY + 0.016], [b.maxX, b.minY + 0.016]], { color: rgba(shade(P.base, 0.14), 0.85) });
  // soft drape folds from the shoulders
  drapeFolds(P, b, 0.12);

  const ink = new THREE.Color(P.base).getHSL({ h: 0, s: 0, l: 0 }).l > 0.5 ? "#1a1a1a" : "#ecefe9";
  if (spec.mark) {
    if (side === "front" && !o) text(P, spec.mark, -0.1, -0.13, 0.016, ink, { stretch: "expanded", tracking: 0.0015 });
    if (side === "front" && o) text(P, spec.mark, 0, -0.16, 0.03, ink, { stretch: "expanded", tracking: 0.002 });
    if (side === "back" && o) {
      text(P, "STIL KOJI", 0, -0.2, 0.05, ink, { stretch: "expanded", weight: 900 });
      text(P, "TRAJE.", 0, -0.26, 0.05, ink, { stretch: "expanded", weight: 900 });
      text(P, "BOX / SARAJEVO / 2027", 0, -0.31, 0.012, rgba(ink, 0.7), { tracking: 0.002, weight: 600 });
    }
  }
}

function drapeFolds(P: Painter, b: Outline["bounds"], strength: number) {
  const { ctx } = P;
  ctx.save();
  ctx.filter = `blur(${P.s(0.012)}px)`;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = s * (0.06 + i * 0.06 + P.rand() * 0.02);
      ctx.lineWidth = P.s(0.018);
      ctx.strokeStyle = `rgba(0,0,0,${strength})`;
      path(P, quadPts([x * 0.6, -0.05], [x + s * 0.01, (b.minY - 0.05) * 0.5], [x + s * 0.02, b.minY + 0.05], 12));
      ctx.stroke();
      ctx.lineWidth = P.s(0.01);
      ctx.strokeStyle = `rgba(255,255,255,${strength * 0.4})`;
      path(P, quadPts([x * 0.6 + s * 0.018, -0.05], [x + s * 0.028, (b.minY - 0.05) * 0.5], [x + s * 0.038, b.minY + 0.05], 12));
      ctx.stroke();
    }
  }
  ctx.restore();
}

function paintLongSleeve(P: Painter) {
  const { spec, side } = P;
  const b = P.outline.bounds;
  const kind = spec.kind;
  const ribColor = detail(P.base, -0.035);

  const cuff =
    kind === "sweater"
      ? { o: [0.43, -0.66] as Pt, i: [0.35, -0.69] as Pt }
      : kind === "hoodie"
        ? { o: [0.45, -0.68] as Pt, i: [0.365, -0.71] as Pt }
        : kind === "jacket"
          ? { o: [0.46, -0.64] as Pt, i: [0.375, -0.665] as Pt }
          : { o: [0.47, -0.62] as Pt, i: [0.385, -0.645] as Pt };
  const body = kind === "sweater" ? 0.25 : kind === "hoodie" ? 0.27 : kind === "jacket" ? 0.27 : 0.28;
  const shoulder = kind === "sweater" ? 0.225 : kind === "hoodie" ? 0.24 : kind === "jacket" ? 0.245 : 0.25;

  // armhole seams
  for (const s of [-1, 1]) {
    seam(P, [[s * shoulder, -0.055], [s * (body - 0.012), -0.15], [s * (body + 0.004), -0.26]], 0, kind === "jacket");
  }
  if (kind === "sweater" || kind === "hoodie" || kind === "bomber") {
    for (const s of [-1, 1]) {
      const a: Pt = s > 0 ? cuff.o : [-cuff.i[0], cuff.i[1]];
      const c: Pt = s > 0 ? cuff.i : [-cuff.o[0], cuff.o[1]];
      ribAlong(P, a, c, kind === "bomber" ? 0.055 : 0.065, ribColor);
    }
    const hemH = kind === "bomber" ? 0.06 : 0.06;
    rib(P, [[b.minX - 0.01, b.minY - 0.01], [body + 0.01, b.minY - 0.01], [body + 0.01, b.minY + hemH], [-body - 0.01, b.minY + hemH]].map(([x, y], i) => (i === 0 ? [-body - 0.01, y] : [x, y]) as Pt), ribColor, 0.004, true);
  }

  if (kind === "sweater") {
    if (side === "front") neckline(P, 0.032, 0.085, ribColor, 0.02);
    else rib(P, quadPts([-0.085, 0.004], [0, -0.016], [0.085, 0.004], 24).concat(quadPts([0.068, 0.004], [0, 0.0], [-0.068, 0.004], 24)), ribColor, 0.0035);
    drapeFolds(P, b, 0.1);
    if (side === "front" && spec.mark) text(P, spec.mark, 0, -0.2, 0.02, rgba(shade(P.base, 0.3), 0.9), { stretch: "expanded", tracking: 0.002 });
  }

  if (kind === "hoodie") {
    if (side === "front") {
      // hood lining visible behind the neck
      const lining: Pt[] = [...quadPts([-0.1, 0.0], [-0.1, 0.15], [0, 0.165], 14), ...quadPts([0, 0.165], [0.1, 0.15], [0.1, 0.0], 14), ...quadPts([0.1, -0.005], [0, -0.06], [-0.1, -0.005], 20)];
      fillShape(P, lining, shade(P.base, -0.17), 0.01);
      const edge = quadPts([-0.115, -0.005], [0, -0.075], [0.115, -0.005], 24);
      const { ctx } = P;
      ctx.save();
      ctx.lineWidth = P.s(0.026);
      ctx.strokeStyle = shade(P.base, 0.02);
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = P.s(0.008);
      path(P, edge);
      ctx.stroke();
      ctx.restore();
      stitch(P, offsetPts(edge, 0.008), { color: rgba(shade(P.base, 0.16), 0.8) });
      // drawstrings
      for (const s of [-1, 1]) {
        const pts = quadPts([s * 0.035, -0.055], [s * 0.05, -0.15], [s * 0.04, -0.24]);
        ctx.save();
        ctx.lineCap = "round";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = P.s(0.004);
        ctx.lineWidth = P.s(0.008);
        ctx.strokeStyle = shade(P.base, 0.14);
        path(P, pts);
        ctx.stroke();
        ctx.restore();
        const e = pts[pts.length - 1];
        fillShape(P, [[e[0] - 0.005, e[1]], [e[0] + 0.005, e[1]], [e[0] + 0.004, e[1] - 0.028], [e[0] - 0.004, e[1] - 0.028]], P.metal, 0.002);
        rivet(P, s * 0.035, -0.055, 0.005);
      }
      // kangaroo pocket
      const top = -0.38;
      const pocket: Pt[] = [[-0.12, top], [0.12, top], [0.17, top - 0.12], [0.19, top - 0.24], [-0.19, top - 0.24], [-0.17, top - 0.12]];
      texturedFill(P, pocket, shade(P.base, 0.012), 0.008);
      stitch(P, offsetPts(pocket, 0.006), { color: rgba(shade(P.base, 0.16), 0.8) });
      seam(P, [[0.12, top], [0.17, top - 0.12]], 0, false);
      seam(P, [[-0.12, top], [-0.17, top - 0.12]], 0, false);
      if (spec.mark) text(P, spec.mark, 0, -0.22, 0.028, rgba(shade(P.base, 0.32), 0.95), { stretch: "expanded", tracking: 0.002 });
    } else {
      // the hood itself hanging on the back
      const hood: Pt[] = [[-0.13, 0.02], [-0.16, -0.12], [-0.1, -0.3], [0, -0.34], [0.1, -0.3], [0.16, -0.12], [0.13, 0.02]];
      texturedFill(P, hood, shade(P.base, 0.01), 0.018);
      seam(P, [[0, 0.02], [0, -0.335]], 0, false);
    }
    drapeFolds(P, b, 0.08);
  }

  if (kind === "jacket") {
    if (side === "front") {
      // collar points
      for (const s of [-1, 1]) {
        const collar: Pt[] = [[s * 0.004, 0.03], [s * 0.1, 0.03], [s * 0.1, 0.0], [s * 0.14, -0.06], [s * 0.06, -0.12], [s * 0.012, -0.035]];
        texturedFill(P, collar, shade(P.base, 0.025), 0.012);
        stitch(P, offsetPts(collar.slice(1, 6), -0.006 * s));
      }
      // placket with buttons
      seam(P, [[0.018, -0.04], [0.018, b.minY + 0.06]], 0.012, true);
      for (let i = 0; i < 5; i++) button(P, 0.0, -0.13 - i * 0.095, 0.0095);
      // yoke
      for (const s of [-1, 1]) {
        const yoke = quadPts([s * 0.03, -0.12], [s * 0.15, -0.115], [s * (body + 0.004), -0.135], 14);
        seam(P, yoke, -0.006, true);
        // chest pocket + flap
        const cx = s * 0.14;
        const pk: Pt[] = [[cx - 0.06, -0.15], [cx + 0.06, -0.15], [cx + 0.06, -0.26], [cx, -0.28], [cx - 0.06, -0.26]];
        stitch(P, offsetPts([...pk, pk[0]], 0.0));
        const flap: Pt[] = [[cx - 0.065, -0.14], [cx + 0.065, -0.14], [cx + 0.065, -0.18], [cx, -0.2], [cx - 0.065, -0.18]];
        texturedFill(P, flap, shade(P.base, 0.03), 0.008);
        stitch(P, offsetPts([...flap, flap[0]], 0.004));
        button(P, cx, -0.183, 0.007);
        // pleat lines
        seam(P, [[cx - 0.03, -0.28], [cx - 0.034, b.minY + 0.06]], 0.006, true);
        seam(P, [[cx + 0.03, -0.28], [cx + 0.034, b.minY + 0.06]], 0.006, true);
        // hand warmer
        seam(P, [[s * 0.07, -0.42], [s * 0.1, -0.5]], 0.006, true);
      }
      // waistband
      seam(P, [[-body, b.minY + 0.055], [body, b.minY + 0.055]], -0.006, true);
      stitch(P, [[-body, b.minY + 0.012], [body, b.minY + 0.012]]);
      button(P, -0.21, b.minY + 0.03, 0.007);
      button(P, 0.21, b.minY + 0.03, 0.007);
    } else {
      seam(P, [[-body, -0.16], [0, -0.21], [body, -0.16]], -0.006, true);
      seam(P, [[-body, b.minY + 0.055], [body, b.minY + 0.055]], -0.006, true);
      seam(P, [[-0.1, -0.2], [-0.12, b.minY + 0.06]], 0.006, true);
      seam(P, [[0.1, -0.2], [0.12, b.minY + 0.06]], 0.006, true);
      fillShape(P, [[-0.035, 0.02], [0.035, 0.02], [0.035, -0.008], [-0.035, -0.008]], "#141414", 0.002);
      text(P, "BOX", 0, 0.006, 0.014, "#d8f04a", { stretch: "expanded" });
    }
    // sleeve cuffs
    for (const s of [-1, 1]) {
      const a: Pt = s > 0 ? cuff.o : [-cuff.i[0], cuff.i[1]];
      const c: Pt = s > 0 ? cuff.i : [-cuff.o[0], cuff.o[1]];
      sleeveHem(P, a, c, 0.05);
      if (side === "front") button(P, (a[0] + c[0]) / 2 + s * 0.012, (a[1] + c[1]) / 2 + 0.03, 0.006);
    }
    drapeFolds(P, b, 0.06);
  }

  if (kind === "bomber") {
    // rib collar
    rib(P, [[-0.1, 0.028], [0.1, 0.028], [0.105, -0.01], [0.05, -0.04], [-0.05, -0.04], [-0.105, -0.01]], ribColor, 0.004, true);
    if (side === "front") {
      zipper(P, [[0, -0.03], [0, b.minY + 0.06]], 0.03);
      // sleeve utility pocket
      const pk: Pt[] = [[0.33, -0.2], [0.39, -0.2], [0.405, -0.3], [0.345, -0.3]];
      texturedFill(P, pk, shade(P.base, 0.02), 0.006);
      stitch(P, offsetPts([...pk, pk[0]], 0.004), { color: rgba(shade(P.base, 0.2), 0.8) });
      for (const s of [-1, 1]) seam(P, [[s * 0.08, -0.36], [s * 0.16, -0.46]], 0.006, false);
    }
    // satin sheen
    const { ctx } = P;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.filter = `blur(${P.s(0.03)}px)`;
    for (const s of [-1, 1]) {
      ctx.lineWidth = P.s(0.05);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      path(P, quadPts([s * 0.12, -0.08], [s * 0.18, -0.3], [s * 0.15, -0.5], 12));
      ctx.stroke();
    }
    ctx.restore();
  }
}

function zipper(P: Painter, line: Pt[], tapeW = 0.024) {
  const [a, b] = line;
  fillShape(P, [[a[0] - tapeW / 2, a[1]], [a[0] + tapeW / 2, a[1]], [b[0] + tapeW / 2, b[1]], [b[0] - tapeW / 2, b[1]]], shade(P.base, -0.06), 0.004);
  const { ctx } = P;
  ctx.save();
  ctx.fillStyle = P.metal;
  const n = Math.round(Math.abs(b[1] - a[1]) / 0.0035);
  for (let i = 0; i < n; i++) {
    const y = a[1] + ((b[1] - a[1]) * i) / n;
    const s = i % 2 ? 1 : -1;
    const [x0, y0] = P.p(a[0] + s * 0.0028, y);
    ctx.fillRect(x0 - P.s(0.0028), y0, P.s(0.0056), P.s(0.0022));
  }
  ctx.restore();
  // puller
  fillShape(P, [[a[0] - 0.007, a[1] - 0.01], [a[0] + 0.007, a[1] - 0.01], [a[0] + 0.005, a[1] - 0.05], [a[0] - 0.005, a[1] - 0.05]], P.metal, 0.004);
}

function paintVest(P: Painter) {
  const { side } = P;
  const b = P.outline.bounds;
  // channel stitching (matches the quilted geometry)
  const ch = 0.082;
  for (let y = b.maxY - ch; y > b.minY; y -= ch) {
    seam(P, [[b.minX, y], [b.maxX, y]], 0, false);
    stitch(P, [[b.minX, y], [b.maxX, y]], { color: rgba(shade(P.base, 0.1), 0.8), dash: 0.003 });
  }
  // collar stand
  seam(P, [[-0.11, 0.0], [0.11, 0.0]], 0, false);
  if (side === "front") {
    zipper(P, [[0, 0.05], [0, b.minY + 0.005]], 0.022);
    for (const s of [-1, 1]) seam(P, [[s * 0.15, -0.42], [s * 0.19, -0.55]], 0.006, false);
    fillShape(P, [[-0.17, -0.16], [-0.12, -0.16], [-0.12, -0.18], [-0.17, -0.18]], "#d8f04a", 0.002);
    text(P, "BOX", -0.145, -0.17, 0.011, "#111", { stretch: "expanded" });
  }
  // armhole binding
  for (const s of [-1, 1]) {
    const arm = quadPts([s * 0.175, -0.035], [s * 0.18, -0.2], [s * 0.262, -0.27], 16);
    const { ctx } = P;
    ctx.save();
    ctx.lineWidth = P.s(0.012);
    ctx.strokeStyle = shade(P.base, -0.05);
    path(P, arm);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------- public API

const texCache = new Map<string, { front: THREE.CanvasTexture; back: THREE.CanvasTexture }>();

export function baseColor(spec: GarmentSpec) {
  return spec.fabric === "denim" ? WASH_COLORS[spec.wash ?? "mid"] : spec.color;
}

function threadFor(spec: GarmentSpec) {
  if (spec.thread) return spec.thread;
  if (spec.fabric === "denim") return spec.wash === "black" ? "#8d8f86" : BRAND_THREAD;
  return shade(spec.color, 0.12);
}

export function paintGarment(spec: GarmentSpec, outline: Outline) {
  const key = JSON.stringify(spec);
  const hit = texCache.get(key);
  if (hit) return hit;
  const { minX, maxX, minY, maxY } = outline.bounds;
  const W = maxX - minX;
  const H = maxY - minY;
  const make = (side: "front" | "back") => {
    const w = Math.round(W * PPM);
    const h = Math.round(H * PPM);
    const canvas = makeCanvas(w, h);
    const ctx = canvas.getContext("2d")!;
    const P: Painter = {
      ctx,
      w,
      h,
      // the back texture is mirrored by the UVs, so paint it as seen from behind
      p: (x, y) => [((side === "front" ? x - minX : maxX - x) / W) * w, ((maxY - y) / H) * h],
      s: (m) => m * PPM,
      outline,
      spec,
      side,
      base: baseColor(spec),
      thread: threadFor(spec),
      metal: spec.metal ?? (spec.fabric === "denim" ? "#a27a4d" : "#8e9092"),
      rand: mulberry32(side === "front" ? 7 : 13),
    };
    baseCloth(P);
    if (spec.fabric === "denim") denimWear(P, !!outline.legs);
    switch (spec.kind) {
      case "jeans":
      case "shorts":
      case "sweatpants":
        paintPants(P);
        break;
      case "tee":
        paintTee(P);
        break;
      case "sweater":
      case "hoodie":
      case "jacket":
      case "bomber":
        paintLongSleeve(P);
        break;
      case "vest":
        paintVest(P);
        break;
    }
    edgeShade(P, spec.fabric === "jersey" ? 0.2 : 0.3);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  };
  const result = { front: make("front"), back: make("back") };
  texCache.set(key, result);
  return result;
}

const weaveCache = new Map<Fabric, THREE.CanvasTexture>();

/** Tiled weave normal map in uv1 space (6 repeats per metre). */
export function weaveNormal(fabric: Fabric) {
  const hit = weaveCache.get(fabric);
  if (hit) return hit;
  const size = 256;
  const c = makeCanvas(size, size);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let h = 0.5;
      const n = fbm((x / size) * 16, (y / size) * 16, 2, 3);
      switch (fabric) {
        case "denim":
          h = 0.5 + 0.35 * Math.sin(((x + y) / 5) * Math.PI * 2) + (n - 0.5) * 0.4;
          break;
        case "twill":
          h = 0.5 + 0.25 * Math.sin(((x + y) / 3.5) * Math.PI * 2) + (n - 0.5) * 0.3;
          break;
        case "knit": {
          const col = (x % 8) / 8;
          const row = (y % 6) / 6;
          h = 0.5 + 0.4 * Math.sin(col * Math.PI) * (0.6 + 0.4 * Math.cos((row + (col > 0.5 ? 1 - col : col)) * Math.PI * 2)) + (n - 0.5) * 0.2;
          break;
        }
        case "jersey":
          h = 0.5 + 0.2 * Math.sin((x / 3) * Math.PI * 2) * Math.sin((y / 4) * Math.PI) + (n - 0.5) * 0.3;
          break;
        case "fleece":
          h = n;
          break;
        case "nylon":
          h = 0.5 + (fbm((x / size) * 4, (y / size) * 4, 2, 5) - 0.5) * 0.3;
          break;
        case "leather":
          h = Math.abs(fbm((x / size) * 28, (y / size) * 28, 3, 8) - 0.5) * 2;
          break;
      }
      const v = Math.max(0, Math.min(255, h * 255));
      const i = (y * size + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const normal = heightToNormal(c, fabric === "fleece" ? 1.5 : 3);
  const tex = new THREE.CanvasTexture(normal);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(fabric === "denim" ? 16 : fabric === "knit" ? 10 : 20, fabric === "denim" ? 16 : fabric === "knit" ? 10 : 20);
  tex.channel = 1;
  tex.anisotropy = 8;
  weaveCache.set(fabric, tex);
  return tex;
}

export const FABRIC_SURFACE: Record<Fabric, { roughness: number; sheen: number; normal: number }> = {
  denim: { roughness: 0.92, sheen: 0.35, normal: 0.55 },
  twill: { roughness: 0.9, sheen: 0.3, normal: 0.35 },
  fleece: { roughness: 0.98, sheen: 0.8, normal: 0.3 },
  jersey: { roughness: 0.95, sheen: 0.5, normal: 0.25 },
  knit: { roughness: 0.97, sheen: 0.7, normal: 0.8 },
  nylon: { roughness: 0.58, sheen: 0.2, normal: 0.15 },
  leather: { roughness: 0.55, sheen: 0, normal: 0.5 },
};

/** Leather texture for belts. */
export function leatherTexture(color: string) {
  const w = 2048;
  const h = 64;
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = 0.6;
  ctx.drawImage(noiseCanvas(256, 40, 3, 21), 0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.setLineDash([10, 7]);
  ctx.strokeStyle = shade(color, 0.2);
  ctx.lineWidth = 2;
  for (const y of [8, h - 8]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}
