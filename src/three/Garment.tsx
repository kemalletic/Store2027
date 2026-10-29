"use client";

import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { GarmentSpec } from "@/lib/types";
import { garmentGeometry, beltGeometry } from "./garmentGeometry";
import { FABRIC_SURFACE, leatherTexture, paintGarment, weaveNormal } from "./fabric";
import { applyFold, type FoldUniforms } from "./fold";

export function useGarment(spec: GarmentSpec, opts: { step?: number; fitMorphs?: boolean } = {}) {
  const { step, fitMorphs } = opts;
  return useMemo(() => {
    const g = garmentGeometry(spec, { step, fitMorphs });
    const tex = paintGarment(spec, g.outline);
    const surface = FABRIC_SURFACE[spec.fabric];
    const normalMap = weaveNormal(spec.fabric);
    const make = (map: THREE.Texture) =>
      new THREE.MeshPhysicalMaterial({
        map,
        normalMap,
        normalScale: new THREE.Vector2(surface.normal, surface.normal),
        roughness: surface.roughness,
        sheen: surface.sheen,
        sheenRoughness: 0.7,
        // dark cloth needs a stronger sheen or it reads as a flat silhouette
        sheenColor: new THREE.Color("#ffffff").multiplyScalar(new THREE.Color(spec.fabric === "denim" ? "#555" : spec.color).getHSL({ h: 0, s: 0, l: 0 }).l < 0.2 ? 0.75 : 0.35),
        side: THREE.FrontSide,
      });
    return { ...g, materials: [make(tex.front), make(tex.back)] as THREE.MeshPhysicalMaterial[] };
  }, [spec, step, fitMorphs]);
}

interface GarmentProps {
  spec: GarmentSpec;
  step?: number;
  fitMorphs?: boolean;
  fold?: FoldUniforms;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Invisible but still casting a shadow (for baked banner backgrounds). */
  shadowOnly?: boolean;
}

const shadowOnlyMaterial = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });

/** A garment mesh whose origin is the top centre (collar / waistband). */
export const Garment = forwardRef<THREE.Mesh, GarmentProps>(function Garment({ spec, step, fitMorphs, fold, castShadow, receiveShadow, shadowOnly }, ref) {
  const g = useGarment(spec, { step, fitMorphs });
  const materials = useMemo(() => {
    if (shadowOnly) return [shadowOnlyMaterial, shadowOnlyMaterial];
    if (!fold) return g.materials;
    // folding needs its own material instances so the shader patch stays local
    return g.materials.map((m) => {
      const c = m.clone();
      applyFold(c, fold);
      return c;
    });
  }, [g.materials, fold, shadowOnly]);
  useEffect(() => {
    if (!fold) return;
    return () => materials.forEach((m) => m.dispose());
  }, [fold, materials]);
  return <mesh ref={ref} geometry={g.geometry} material={materials} castShadow={castShadow} receiveShadow={receiveShadow} />;
});

export function Belt({ color, metal = "#b9bcbf" }: { color: string; metal?: string }) {
  const { strap, buckle, mat, metalMat } = useMemo(() => {
    const { strap, buckle } = beltGeometry();
    const tex = leatherTexture(color);
    tex.repeat.set(1, 1);
    const mat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5, side: THREE.DoubleSide });
    const metalMat = new THREE.MeshStandardMaterial({ color: metal, metalness: 1, roughness: 0.28 });
    return { strap, buckle, mat, metalMat };
  }, [color, metal]);
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={strap} material={mat} castShadow receiveShadow />
      <mesh geometry={buckle} material={metalMat} castShadow />
    </group>
  );
}
