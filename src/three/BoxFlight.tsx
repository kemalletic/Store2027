"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import type { BoxFlight as Flight } from "@/lib/store";
import { getProduct } from "@/lib/products";
import type { GarmentSpec } from "@/lib/types";
import { Belt, Garment, useGarment } from "./Garment";
import { createFoldUniforms } from "./fold";
import { makeCanvas, noiseCanvas } from "./noise";

/**
 * "Složi u kutiju": the garment folds (sleeves, then in half), drops into a
 * cardboard BOX, the flaps close and the box flies into the cart icon.
 */

function cardboardTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#c4a275";
  ctx.fillRect(0, 0, 512, 512);
  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = 0.35;
  ctx.drawImage(noiseCanvas(256, 30, 3, 51), 0, 0, 512, 512);
  ctx.globalAlpha = 0.2;
  // corrugation lines
  ctx.strokeStyle = "#7d6040";
  for (let x = 0; x < 512; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function frontTexture() {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext("2d")!;
  ctx.drawImage(cardboardTexture().image as HTMLCanvasElement, 0, 0);
  const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim() || "sans-serif";
  ctx.fillStyle = "rgba(20,18,15,0.85)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `expanded 900 150px ${fam}`;
  ctx.fillText("BOX", 256, 250);
  ctx.font = `600 34px ${fam}`;
  ctx.fillText("adem jeans", 256, 345);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

interface Size {
  w: number;
  h: number;
  cx: number;
  cy: number;
}

/** Bounding box of the garment once both folds are done (garment metres). */
function foldedSize(spec: GarmentSpec, outline: ReturnType<typeof useGarment>["outline"]): Size {
  if (spec.kind === "belt") return { w: 0.24, h: 0.08, cx: 0, cy: 0 };
  const { foldX, foldY, foldMode, bounds } = outline;
  const w = foldMode === 0 ? Math.min(foldX * 2, bounds.maxX - bounds.minX) : bounds.maxX;
  const cx = foldMode === 0 ? 0 : bounds.maxX / 2;
  const top = Math.max(bounds.maxY, foldY + (foldY - bounds.minY));
  return { w, h: top - foldY, cx, cy: (top + foldY) / 2 };
}

function Rig({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  const product = getProduct(flight.slug)!;
  const spec = product.garment;
  const g = useGarment(spec, { step: 0.009 });
  const { size, gl, scene, camera } = useThree();
  const fold = useMemo(() => createFoldUniforms(g.outline.foldX, g.outline.foldY, g.thickness, g.outline.foldMode), [g]);
  const folded = useMemo(() => foldedSize(spec, g.outline), [spec, g.outline]);
  // the folded garment lies flat in the box, so its height becomes the box depth
  const box = useMemo(() => ({ w: folded.w * 1.16, h: Math.max(0.09, folded.w * 0.32), d: folded.h * 1.12 }), [folded]);
  const mats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ map: cardboardTexture(), roughness: 0.9 });
    const front = new THREE.MeshStandardMaterial({ map: frontTexture(), roughness: 0.9 });
    const inside = new THREE.MeshStandardMaterial({ color: "#8e714d", roughness: 1, side: THREE.DoubleSide });
    const tape = new THREE.MeshStandardMaterial({ color: "#e2fb50", roughness: 0.6 });
    return { side, front, inside, tape };
  }, []);

  const rig = useRef<THREE.Group>(null);
  const garment = useRef<THREE.Group>(null);
  const boxRef = useRef<THREE.Group>(null);
  const flaps = useRef<(THREE.Group | null)[]>([]);
  const tape = useRef<THREE.Mesh>(null);

  useLayoutEffect(() => {
    const r = rig.current!;
    const gm = garment.current!;
    const b = boxRef.current!;
    const W = size.width;
    const H = size.height;
    const toWorld = (x: number, y: number) => new THREE.Vector3(x - W / 2, H / 2 - y, 0);

    const bounds = g.outline.bounds;
    const fullH = spec.kind === "belt" ? 0.25 : bounds.maxY - bounds.minY;
    const scale = Math.min((flight.from.h * 0.78) / fullH, (flight.from.w * 0.9) / (bounds.maxX - bounds.minX || 0.3));
    const start = toWorld(flight.from.x + flight.from.w / 2, flight.from.y + flight.from.h / 2);
    const cart = document.getElementById("cart-target")?.getBoundingClientRect();
    const end = cart ? toWorld(cart.left + cart.width / 2, cart.top + cart.height / 2) : toWorld(W - 40, 34);

    // the rig's origin is where the folded garment ends up; start it so the
    // unfolded garment sits exactly over the product image it came from
    gm.position.set(0, 0, 0);
    gm.rotation.set(0, 0, 0);
    gm.scale.set(1, 1, 1);
    const mid = spec.kind === "belt" ? 0 : (bounds.maxY + bounds.minY) / 2;
    start.x += folded.cx * scale;
    start.y -= (mid - folded.cy) * scale;
    r.position.copy(start);
    r.scale.setScalar(scale);
    b.position.set(0, -box.h * 2.2, 0);
    b.scale.setScalar(0.001);

    const openA = Math.PI / 2 + 0.38;
    const [fF, fB, fL, fR] = flaps.current as THREE.Group[];
    fF.rotation.x = openA;
    fB.rotation.x = -openA;
    fL.rotation.z = openA;
    fR.rotation.z = -openA;
    tape.current!.scale.x = 0.0001;

    // paused until shaders are compiled, or a slow first frame would skip the folding
    const tl = gsap.timeline({ paused: true, onComplete: onDone, defaults: { ease: "power2.inOut" } });
    const debugScale = (window as Window & { __boxTimeScale?: number }).__boxTimeScale;
    if (process.env.NODE_ENV !== "production" && debugScale) tl.timeScale(debugScale);
    const lift = box.h * 0.5 + folded.h * 0.55;
    tl.fromTo(r.scale, { x: scale * 0.94, y: scale * 0.94, z: scale * 0.94 }, { x: scale, y: scale, z: scale, duration: 0.18, ease: "back.out(2)" }, 0)
      .to(fold.uFoldA, { value: 1, duration: 0.34 }, 0.04)
      .to(fold.uFoldB, { value: 1, duration: 0.34 }, 0.28)
      .to(gm.position, { y: gm.position.y + lift, duration: 0.3, ease: "power2.out" }, 0.3)
      .to(b.scale, { x: 1, y: 1, z: 1, duration: 0.28, ease: "back.out(1.6)" }, 0.34)
      .to(b.position, { y: 0, duration: 0.3, ease: "power3.out" }, 0.34)
      .to(r.rotation, { x: 0.5, duration: 0.45 }, 0.4)
      .to(gm.rotation, { x: -Math.PI / 2, duration: 0.3, ease: "power2.inOut" }, 0.56)
      // the stack settles flat under its own weight
      .to(gm.scale, { z: 0.45, duration: 0.3 }, 0.6)
      .to(gm.position, { y: -box.h * 0.22, duration: 0.26, ease: "power2.in" }, 0.62)
      .to(fL.rotation, { z: 0, duration: 0.16 }, 0.82)
      .to(fR.rotation, { z: 0, duration: 0.16 }, 0.85)
      .to(fF.rotation, { x: 0, duration: 0.16 }, 0.92)
      .to(fB.rotation, { x: 0, duration: 0.16 }, 0.95)
      .to(tape.current!.scale, { x: 1, duration: 0.12, ease: "none" }, 1.08);

    // flight: horizontal ease-in, vertical arc above the straight line
    const fly = { t: 0 };
    const p0 = start.clone();
    const endScale = 30 / (box.w * 1.1);
    tl.to(
      fly,
      {
        t: 1,
        duration: 0.5,
        ease: "power2.in",
        onUpdate: () => {
          const t = fly.t;
          r.position.x = p0.x + (end.x - p0.x) * t;
          r.position.y = p0.y + (end.y - p0.y) * t + Math.sin(t * Math.PI) * 120;
          r.scale.setScalar(scale + (endScale - scale) * t);
          r.rotation.z = -0.6 * t;
          r.rotation.y = 0.8 * t;
        },
      },
      1.2,
    );
    // lets automated visual tests step through the animation frame by frame
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __boxTimeline: tl, __boxRig: r, __boxCam: camera });
    let alive = true;
    gl.compileAsync(scene, camera).then(() => {
      requestAnimationFrame(() => requestAnimationFrame(() => alive && tl.play()));
    });
    return () => {
      alive = false;
      tl.kill();
    };
  }, [flight, size, g, spec, fold, folded, box, onDone, gl, scene, camera]);

  const flapThick = 0.004;
  return (
    <group ref={rig}>
      {/* pivot at the folded garment's centre, so it can tip over into the box */}
      <group ref={garment}>
        {/* folding stacks layers behind the front; centre the stack on the pivot */}
        <group position={[-folded.cx, -folded.cy, g.thickness * 3]}>
          {spec.kind === "belt" ? (
            <group scale={0.9}>
              <Belt color={spec.color} metal={spec.metal} />
            </group>
          ) : (
            <Garment spec={spec} step={0.009} fold={fold} />
          )}
        </group>
      </group>
      <group ref={boxRef}>
        {/* walls */}
        <mesh position={[0, 0, box.d / 2]} material={mats.front}>
          <boxGeometry args={[box.w, box.h, flapThick]} />
        </mesh>
        <mesh position={[0, 0, -box.d / 2]} material={mats.side}>
          <boxGeometry args={[box.w, box.h, flapThick]} />
        </mesh>
        <mesh position={[-box.w / 2, 0, 0]} material={mats.side}>
          <boxGeometry args={[flapThick, box.h, box.d]} />
        </mesh>
        <mesh position={[box.w / 2, 0, 0]} material={mats.side}>
          <boxGeometry args={[flapThick, box.h, box.d]} />
        </mesh>
        <mesh position={[0, -box.h / 2, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.inside}>
          <planeGeometry args={[box.w, box.d]} />
        </mesh>
        {/* flaps: front, back, left, right; each pivots on its top edge */}
        <group ref={(el) => void (flaps.current[0] = el)} position={[0, box.h / 2 + 0.003, box.d / 2]}>
          <mesh position={[0, 0, -box.d / 4]} material={mats.side}>
            <boxGeometry args={[box.w, flapThick, box.d / 2]} />
          </mesh>
        </group>
        <group ref={(el) => void (flaps.current[1] = el)} position={[0, box.h / 2 + 0.003, -box.d / 2]}>
          <mesh position={[0, 0, box.d / 4]} material={mats.side}>
            <boxGeometry args={[box.w, flapThick, box.d / 2]} />
          </mesh>
        </group>
        <group ref={(el) => void (flaps.current[2] = el)} position={[-box.w / 2, box.h / 2, 0]}>
          <mesh position={[box.w / 4, 0, 0]} material={mats.inside}>
            <boxGeometry args={[box.w / 2, flapThick, box.d * 0.98]} />
          </mesh>
        </group>
        <group ref={(el) => void (flaps.current[3] = el)} position={[box.w / 2, box.h / 2, 0]}>
          <mesh position={[-box.w / 4, 0, 0]} material={mats.inside}>
            <boxGeometry args={[box.w / 2, flapThick, box.d * 0.98]} />
          </mesh>
        </group>
        <mesh ref={tape} position={[0, box.h / 2 + 0.008, 0]} material={mats.tape}>
          <boxGeometry args={[box.w * 1.02, 0.002, box.d * 0.18]} />
        </mesh>
      </group>
    </group>
  );
}

function OrthoPixels() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.left = -size.width / 2;
    cam.right = size.width / 2;
    cam.top = size.height / 2;
    cam.bottom = -size.height / 2;
    cam.near = -5000;
    cam.far = 5000;
    cam.position.set(0, 0, 100);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export default function BoxFlight({ flight, onDone }: { flight: Flight; onDone: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden>
      <Canvas orthographic dpr={[1, 2]} gl={{ alpha: true, antialias: true }} style={{ width: "100%", height: "100%" }}>
        <OrthoPixels />
        <hemisphereLight args={["#ffffff", "#3a3839", 1.6]} />
        <directionalLight position={[-300, 600, 800]} intensity={2.2} />
        <Rig flight={flight} onDone={onDone} />
      </Canvas>
    </div>
  );
}
