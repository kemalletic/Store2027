#!/usr/bin/env node
/**
 * Renders every product, category and banner image from the procedural 3D
 * garments, using the dev-only /render route.
 *
 *   npm run dev            # in another terminal
 *   node scripts/render-images.mjs [filter]
 *
 * Output: public/products, public/categories, public/banners
 */
import { createRequire } from "node:module";
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// CommonJS resolution so a globally installed Playwright (NODE_PATH) is found too
const { chromium } = createRequire(import.meta.url)("playwright");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.RENDER_URL ?? "http://localhost:3000";
const filter = process.argv[2] ?? "";

// product slugs are read from the data file so this script needs no TS build
const src = readFileSync(join(root, "src/lib/products.ts"), "utf8");
const slugs = [...src.matchAll(/^\s{4}slug: "([^"]+)"/gm)].map((m) => m[1]);

const CATEGORY_PICKS = {
  farmerke: "farmerke-regular-fit",
  trenerke: "trenerka-essential-siva",
  majice: "majica-basic-crna",
  dzemperi: "dzemper-kamen",
  prsluci: "prsluk-urban",
  jakne: "jakna-trucker-indigo",
  kaisevi: "kais-kozni-smedji",
  sorcevi: "sorc-cargo",
};

const BANNERS = {
  farmerke: "farmerke-relaxed-fit",
  trenerke: "trenerka-essential-siva",
};

const jobs = [];
for (const slug of slugs) {
  for (const view of ["front", "back"]) {
    jobs.push({ out: `public/products/${slug}-${view}.jpg`, q: `mode=product&slug=${slug}&view=${view}&w=900&h=1200`, w: 900, h: 1200, fmt: "jpg" });
  }
}
for (const [cat, slug] of Object.entries(CATEGORY_PICKS)) {
  jobs.push({ out: `public/categories/${cat}.jpg`, q: `mode=tile&slug=${slug}&w=640&h=800`, w: 640, h: 800, fmt: "jpg" });
}
for (const [name, slug] of Object.entries(BANNERS)) {
  jobs.push({ out: `public/banners/${name}-bg.jpg`, q: `mode=banner&layer=bg&slug=${slug}&w=1400&h=900`, w: 1400, h: 900, fmt: "jpg" });
  jobs.push({ out: `public/banners/${name}-fg.webp`, q: `mode=banner&layer=fg&slug=${slug}&w=1400&h=900`, w: 1400, h: 900, fmt: "webp" });
}

const todo = jobs.filter((j) => j.out.includes(filter));
const browser = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
page.on("pageerror", (e) => console.error("pageerror:", e.message));

for (const [i, job] of todo.entries()) {
  const t0 = Date.now();
  await page.setViewportSize({ width: job.w, height: job.h });
  await page.goto(`${base}/render?${job.q}`, { waitUntil: "load", timeout: 180000 });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000, polling: 300 });
  const data = await page.evaluate(() => document.querySelector("canvas").toDataURL("image/png"));
  const buf = Buffer.from(data.split(",")[1], "base64");
  const out = join(root, job.out);
  mkdirSync(dirname(out), { recursive: true });
  const img = sharp(buf);
  if (job.fmt === "jpg") await img.jpeg({ quality: 82, mozjpeg: true }).toFile(out);
  else await img.webp({ quality: 84, alphaQuality: 90 }).toFile(out);
  console.log(`[${i + 1}/${todo.length}] ${job.out} ${Date.now() - t0}ms`);
}

await browser.close();
