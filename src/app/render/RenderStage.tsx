"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { PRODUCTS, getProduct } from "@/lib/products";
import { CenteredGarment, StudioLights, fitDistance, garmentFrame } from "@/three/Studio";
import { Garment } from "@/three/Garment";
import { Hanger } from "@/three/Hanger";
import { concreteTextures } from "@/three/concrete";
import type { GarmentSpec } from "@/lib/types";

declare global {
  interface Window {
    __ready?: boolean;
  }
}

function Ready() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let frames = 0;
    let raf = 0;
    const tick = () => {
      gl.render(scene, camera);
      if (++frames > 6) window.__ready = true;
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gl, scene, camera]);
  return null;
}

function ProductShot({ spec, back }: { spec: GarmentSpec; back: boolean }) {
  const f = garmentFrame(spec);
  const dist = fitDistance(f.w, f.h, 22, 3 / 4, spec.kind === "belt" ? 1.5 : 1.16);
  return (
    <>
      <color attach="background" args={["#eceded"]} />
      <PerspectiveCam fov={22} position={[0, 0, dist]} />
      <StudioLights />
      <CenteredGarment spec={spec} back={back} step={0.005} />
      <mesh position={[0, 0, spec.kind === "belt" ? -0.4 : -0.07]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <shadowMaterial opacity={0.11} />
      </mesh>
    </>
  );
}

function PerspectiveCam({ fov, position, target = [0, 0, 0] }: { fov: number; position: [number, number, number]; target?: [number, number, number] }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fov;
    cam.aspect = size.width / size.height;
    cam.position.set(...position);
    cam.lookAt(...target);
    cam.updateProjectionMatrix();
  }, [camera, fov, position, target, size]);
  return null;
}

function ConcreteWall({ z = -0.2, tone = 120, repeat = 1 }: { z?: number; tone?: number; repeat?: number }) {
  const tex = useMemo(() => {
    const t = concreteTextures({ tone });
    t.map.repeat.set(repeat, repeat);
    t.normalMap.repeat.set(repeat, repeat);
    return t;
  }, [tone, repeat]);
  return (
    <mesh position={[0, 0, z]} receiveShadow>
      <planeGeometry args={[4, 4]} />
      <meshStandardMaterial map={tex.map} normalMap={tex.normalMap} roughness={0.95} />
    </mesh>
  );
}

function hangerFor(spec: GarmentSpec): { kind: "top" | "clip"; width: number } {
  if (spec.kind === "jeans" || spec.kind === "sweatpants" || spec.kind === "shorts") return { kind: "clip", width: 0.2 };
  return { kind: "top", width: spec.kind === "vest" ? 0.16 : 0.2 };
}

/** Moody tile: the garment on a hanger against concrete, lit from above. */
function CategoryTile({ spec }: { spec: GarmentSpec }) {
  const f = garmentFrame(spec);
  const dist = spec.kind === "belt" ? fitDistance(f.w, f.h, 28, 4 / 5, 1.25) : fitDistance(f.w, f.h + 0.12, 28, 4 / 5, 1.12);
  const h = hangerFor(spec);
  return (
    <>
      <color attach="background" args={["#1a1c1c"]} />
      <PerspectiveCam fov={28} position={[0.04, 0.04, dist]} target={[0, 0.04, 0]} />
      <ambientLight intensity={0.06} />
      <spotLight position={[-0.5, 1.8, 1.1]} angle={0.42} penumbra={1} intensity={9} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} />
      <directionalLight position={[1.5, 0.3, 1]} intensity={0.25} />
      <ConcreteWall z={-0.14} tone={118} repeat={1.4} />
      {spec.kind === "belt" ? (
        <group position={[0, 0.03, 0]} rotation={[0.35, 0, 0]}>
          <pointLight position={[0.1, 0.3, 0.3]} intensity={0.6} />
          <CenteredGarment spec={spec} />
        </group>
      ) : (
        <group position={[0, -f.cy, 0]} rotation={[0, -0.12, 0.02]}>
          <Garment spec={spec} step={0.005} castShadow />
          <Hanger kind={h.kind} width={h.width} />
        </group>
      )}
    </>
  );
}

/** Banner layers for the parallax banners: background wall (with shadow) and garment. */
function BannerLayer({ spec, layer, align }: { spec: GarmentSpec; layer: "bg" | "fg"; align: number }) {
  const f = garmentFrame(spec);
  const h = hangerFor(spec);
  return (
    <>
      {layer === "bg" && <color attach="background" args={["#161818"]} />}
      <PerspectiveCam fov={30} position={[0, 0.02, 2.9]} target={[0, 0.02, 0]} />
      <ambientLight intensity={0.06} />
      <spotLight position={[align * 0.9, 2.2, 1.6]} angle={0.42} penumbra={1} intensity={16} castShadow shadow-intensity={0.8} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0003} />
      <directionalLight position={[-align * 2, 0.4, 1.2]} intensity={0.2} />
      {layer === "bg" && <ConcreteWall z={-0.25} tone={110} repeat={1} />}
      <group position={[align * 0.62, -f.cy - 0.04, 0]} rotation={[0, align * -0.18, align * 0.03]}>
        <Garment spec={spec} step={0.005} castShadow={layer === "bg"} shadowOnly={layer === "bg"} />
        {layer === "bg" ? null : <Hanger kind={h.kind} width={h.width} />}
      </group>
    </>
  );
}

export default function RenderStage() {
  const sp = useSearchParams();
  const slug = sp.get("slug");
  const mode = sp.get("mode") ?? "product";
  const view = sp.get("view") ?? "front";
  const w = Number(sp.get("w") ?? 900);
  const h = Number(sp.get("h") ?? 1200);
  const product = slug ? getProduct(slug) : undefined;
  const spec = product?.garment ?? PRODUCTS[0].garment;

  return (
    <div style={{ width: w, height: h, background: "transparent" }} id="stage">
      <Canvas
        shadows="soft"
        frameloop="demand"
        dpr={1}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ fov: 22, near: 0.01, far: 50 }}
        style={{ width: w, height: h }}
      >
        {mode === "product" && <ProductShot spec={spec} back={view === "back"} />}
        {mode === "tile" && <CategoryTile spec={spec} />}
        {mode === "banner" && <BannerLayer spec={spec} layer={(sp.get("layer") as "bg" | "fg") ?? "fg"} align={Number(sp.get("align") ?? 1)} />}
        <Ready />
      </Canvas>
    </div>
  );
}
