"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import * as THREE from "three";
import type { GarmentSpec } from "@/lib/types";
import { CenteredGarment, StudioLights, fitDistance, garmentFrame } from "./Studio";

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(onReady));
    return () => cancelAnimationFrame(t);
  }, [onReady]);
  return null;
}

/** Turntable for the product page: drag to rotate, it turns slowly by itself until touched. */
export default function ProductViewer({ spec, onReady }: { spec: GarmentSpec; onReady: () => void }) {
  const f = garmentFrame(spec);
  const [touched, setTouched] = useState(false);
  const dist = fitDistance(f.w, f.h, 22, 3 / 4, spec.kind === "belt" ? 1.5 : 1.16);
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, dist], fov: 22, near: 0.01, far: 20 }} gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <StudioLights />
      <CenteredGarment spec={spec} step={0.006} />
      <mesh position={[0, 0, spec.kind === "belt" ? -0.4 : -0.3]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <shadowMaterial opacity={0.08} />
      </mesh>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={!touched}
        autoRotateSpeed={1.1}
        minPolarAngle={Math.PI / 2 - 0.45}
        maxPolarAngle={Math.PI / 2 + 0.3}
        onStart={() => setTouched(true)}
      />
      <Ready onReady={onReady} />
    </Canvas>
  );
}
