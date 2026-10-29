"use client";

import { useMemo } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import type { GarmentSpec } from "@/lib/types";
import { outlineFor } from "./outline";
import { Belt, Garment } from "./Garment";

/** Size of the garment's bounding box (metres), used to frame cameras. */
export function garmentFrame(spec: GarmentSpec) {
  if (spec.kind === "belt") return { w: 0.26, h: 0.2, cy: 0 };
  const b = outlineFor(spec).bounds;
  return { w: b.maxX - b.minX, h: b.maxY - b.minY, cy: (b.minY + b.maxY) / 2 };
}

/** Camera distance that fits a w×h box into a viewport with the given fov/aspect. */
export function fitDistance(w: number, h: number, fov: number, aspect: number, margin = 1.18) {
  const vfov = (fov * Math.PI) / 180;
  const dh = (h * margin) / 2 / Math.tan(vfov / 2);
  const dw = (w * margin) / 2 / Math.tan(vfov / 2) / aspect;
  return Math.max(dh, dw);
}

export function StudioLights({ intensity = 1 }: { intensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.08 * intensity} />
      <directionalLight
        position={[-2.2, 2.4, 1.6]}
        intensity={2.6 * intensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-1}
        shadow-camera-right={1}
        shadow-camera-top={1}
        shadow-camera-bottom={-1}
        shadow-bias={-0.0004}
        shadow-radius={10}
      />
      <directionalLight position={[2.4, 0.2, 1.2]} intensity={0.35 * intensity} />
      <directionalLight position={[0.5, 1.5, -2]} intensity={0.9 * intensity} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={0.9} position={[-2, 2, 3]} scale={[3, 2, 1]} />
        <Lightformer form="rect" intensity={0.35} position={[3, 0, 2]} scale={[2, 3, 1]} />
        <Lightformer form="rect" intensity={0.5} position={[0, 3, -2]} scale={[4, 1, 1]} />
        <Lightformer form="ring" intensity={0.4} position={[0, -2, 2]} scale={2} />
      </Environment>
    </>
  );
}

/** A garment centred on the origin, optionally turned to show the back. */
export function CenteredGarment({ spec, back = false, step }: { spec: GarmentSpec; back?: boolean; step?: number }) {
  const f = useMemo(() => garmentFrame(spec), [spec]);
  if (spec.kind === "belt") {
    return (
      <group rotation={[0.55, back ? 2.2 : -0.4, 0]} position={[0, -0.01, 0]}>
        <Belt color={spec.color} metal={spec.metal} />
      </group>
    );
  }
  return (
    <group rotation={[0, back ? Math.PI : 0, 0]}>
      <group position={[0, -f.cy, 0]}>
        <Garment spec={spec} step={step} castShadow />
      </group>
    </group>
  );
}
