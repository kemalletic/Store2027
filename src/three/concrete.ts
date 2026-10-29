import * as THREE from "three";
import { fbm, heightToNormal, makeCanvas, mulberry32, noiseCanvas } from "./noise";

/**
 * Board-formed concrete: cloudy tone, pores, faint formwork board lines and
 * tie holes in a grid, like the brutalist walls in the brand photography.
 */
export function concreteTextures(opts: { size?: number; tone?: number; boards?: number; ties?: [number, number]; seed?: number } = {}) {
  const { size = 1024, tone = 112, boards = 4, ties = [3, 2], seed = 4 } = opts;
  const rand = mulberry32(seed);
  const color = makeCanvas(size, size);
  const height = makeCanvas(size, size);
  const c = color.getContext("2d")!;
  const hc = height.getContext("2d")!;

  // tone: large cloudy variation
  const img = c.createImageData(size, size);
  const himg = hc.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const cloud = fbm(u * 3, v * 3, 4, seed);
      const fine = fbm(u * 40, v * 40, 2, seed + 7);
      const t = tone * (0.82 + cloud * 0.36) + (fine - 0.5) * 14;
      const i = (y * size + x) * 4;
      img.data[i] = t;
      img.data[i + 1] = t * 0.995;
      img.data[i + 2] = t * 0.975;
      img.data[i + 3] = 255;
      const hv = 128 + (fine - 0.5) * 60 + (cloud - 0.5) * 30;
      himg.data[i] = himg.data[i + 1] = himg.data[i + 2] = hv;
      himg.data[i + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  hc.putImageData(himg, 0, 0);

  // board lines with slight offsets and grain
  const bh = size / boards;
  for (let b = 1; b < boards; b++) {
    const y = b * bh + (rand() - 0.5) * 6;
    c.fillStyle = "rgba(0,0,0,0.18)";
    c.fillRect(0, y - 1, size, 2);
    c.fillStyle = "rgba(255,255,255,0.05)";
    c.fillRect(0, y + 1, size, 1);
    hc.fillStyle = "rgb(70,70,70)";
    hc.fillRect(0, y - 1, size, 3);
  }
  c.save();
  c.globalAlpha = 0.12;
  c.globalCompositeOperation = "multiply";
  c.drawImage(noiseCanvas(256, 60, 2, 41), 0, 0, 256, 32, 0, 0, size, size);
  c.restore();

  // pores
  for (let i = 0; i < size * 1.1; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = rand() < 0.96 ? 0.35 + rand() * 0.8 : 1.2 + rand() * 1.4;
    c.fillStyle = `rgba(25,25,25,${0.25 + rand() * 0.35})`;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    hc.fillStyle = "rgb(20,20,20)";
    hc.beginPath();
    hc.arc(x, y, r, 0, Math.PI * 2);
    hc.fill();
  }

  // tie holes
  const [tx, ty] = ties;
  for (let j = 0; j < ty; j++) {
    for (let i = 0; i < tx; i++) {
      const x = ((i + 0.5) / tx) * size;
      const y = ((j + 0.5) / ty) * size;
      const r = size * 0.011;
      const g = c.createRadialGradient(x, y, r * 0.2, x, y, r * 1.6);
      g.addColorStop(0, "rgba(10,10,10,0.95)");
      g.addColorStop(0.55, "rgba(30,30,30,0.7)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r * 1.6, 0, Math.PI * 2);
      c.fill();
      const hg = hc.createRadialGradient(x, y, 0, x, y, r * 1.3);
      hg.addColorStop(0, "rgb(0,0,0)");
      hg.addColorStop(0.7, "rgb(60,60,60)");
      hg.addColorStop(1, "rgba(128,128,128,0)");
      hc.fillStyle = hg;
      hc.beginPath();
      hc.arc(x, y, r * 1.3, 0, Math.PI * 2);
      hc.fill();
    }
  }

  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.CanvasTexture(heightToNormal(height, 2.2));
  for (const t of [map, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
  }
  return { map, normalMap };
}
