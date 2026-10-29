"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import type { Fit, GarmentSpec, Wash } from "@/lib/types";
import { useGarment } from "./Garment";
import { FIT_ORDER } from "./garmentGeometry";
import { paintGarment } from "./fabric";
import { Hanger, HOOK_CENTER } from "./Hanger";
import { StudioLights } from "./Studio";

const BASE: GarmentSpec = { kind: "jeans", fabric: "denim", color: "#3f587c", fit: "regular", wash: "mid" };

/** Adds a second map that pours over the first from the waistband down. */
function withWashWipe(material: THREE.MeshPhysicalMaterial) {
  const uniforms = { uMap2: { value: material.map }, uWipe: { value: 0 } };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D uMap2;\nuniform float uWipe;")
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D( map, vMapUv );
          vec4 nextColor = texture2D( uMap2, vMapUv );
          float fromTop = 1.0 - vMapUv.y + sin( vMapUv.x * 26.0 ) * 0.012;
          float reveal = 1.0 - smoothstep( uWipe * 1.15 - 0.12, uWipe * 1.15, fromTop );
          sampledDiffuseColor = mix( sampledDiffuseColor, nextColor, reveal );
          diffuseColor *= sampledDiffuseColor;
        #endif`,
      );
  };
  material.customProgramCacheKey = () => "wash-wipe";
  return uniforms;
}

function Jeans({ fit, wash }: { fit: Fit; wash: Wash }) {
  const g = useGarment(BASE, { fitMorphs: true, step: 0.0075 });
  const mesh = useRef<THREE.Mesh>(null);
  const { materials, wipes } = useMemo(() => {
    const materials = g.materials.map((m) => m.clone());
    const wipes = materials.map(withWashWipe);
    return { materials, wipes };
  }, [g.materials]);
  const current = useRef<Wash>("mid");

  useEffect(() => {
    mesh.current?.updateMorphTargets();
  }, [g.geometry]);

  useEffect(() => {
    const m = mesh.current;
    if (!m?.morphTargetInfluences) return;
    const target = FIT_ORDER.map((f) => (f === fit ? 1 : 0));
    const infl = m.morphTargetInfluences;
    const tw = gsap.to(infl, { ...Object.fromEntries(target.map((v, i) => [i, v])), duration: 0.65, ease: "power3.inOut" });
    return () => {
      tw.kill();
    };
  }, [fit]);

  useEffect(() => {
    if (wash === current.current) return;
    const tex = paintGarment({ ...BASE, wash }, g.outline);
    const next = [tex.front, tex.back];
    const tws = wipes.map((w, i) => {
      w.uMap2.value = next[i];
      w.uWipe.value = 0;
      return gsap.to(w.uWipe, {
        value: 1,
        duration: 0.9,
        ease: "power2.inOut",
        onComplete: () => {
          materials[i].map = next[i];
          w.uWipe.value = 0;
        },
      });
    });
    current.current = wash;
    return () => tws.forEach((t) => t.progress(1).kill());
  }, [wash, wipes, materials, g.outline]);

  return (
    <group position={[0, 0.5, 0]}>
      <group position={[-HOOK_CENTER.x, -HOOK_CENTER.y + 0.04, 0]}>
        <mesh ref={mesh} geometry={g.geometry} material={materials} castShadow />
        <Hanger kind="clip" width={0.2} />
      </group>
    </group>
  );
}

export default function DenimLabCanvas({ fit, wash }: { fit: Fit; wash: Wash }) {
  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [0, -0.02, 2.55], fov: 30 }} gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <StudioLights intensity={1.15} />
      <Jeans fit={fit} wash={wash} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={1.4} minPolarAngle={Math.PI / 2 - 0.25} maxPolarAngle={Math.PI / 2 + 0.15} target={[0, -0.02, 0]} />
    </Canvas>
  );
}
