"use client";

import { useMemo } from "react";
import * as THREE from "three";

/**
 * Black steel hangers. Local origin is the garment's top centre; the hook's
 * centre (where the rail passes) is at HOOK_CENTER.
 */
export const HOOK_CENTER = new THREE.Vector3(0.014, 0.085, 0);

const steel = new THREE.MeshStandardMaterial({ color: "#1a1b1c", metalness: 0.85, roughness: 0.35 });

function tube(points: [number, number][], radius = 0.0035, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), closed, "catmullrom", 0.2);
  return new THREE.TubeGeometry(curve, points.length * 12, radius, 8, closed);
}

function hookPoints(): [number, number][] {
  const pts: [number, number][] = [
    [0, 0.012],
    [0, 0.04],
    [-0.006, 0.062],
  ];
  const c = HOOK_CENTER;
  const r = 0.021;
  for (let a = 170; a >= -50; a -= 15) {
    const t = (a * Math.PI) / 180;
    pts.push([c.x + Math.cos(t) * r, c.y + Math.sin(t) * r]);
  }
  return pts;
}

export function Hanger({ kind, width = 0.21 }: { kind: "top" | "clip"; width?: number }) {
  const geos = useMemo(() => {
    const hook = tube(hookPoints());
    if (kind === "top") {
      const frame = tube(
        [
          [-width, -0.048],
          [-width * 0.5, -0.02],
          [0, 0.012],
          [width * 0.5, -0.02],
          [width, -0.048],
          [width * 0.98, -0.058],
          [0, -0.058],
          [-width * 0.98, -0.058],
        ],
        0.0035,
        true,
      );
      return { hook, parts: [frame] };
    }
    const bar = tube(
      [
        [-width, 0.03],
        [0, 0.03],
        [width, 0.03],
      ],
      0.0045,
    );
    const stem = tube([
      [0, 0.03],
      [0, 0.012],
    ]);
    return { hook, parts: [bar, stem] };
  }, [kind, width]);
  return (
    <group>
      <mesh geometry={geos.hook} material={steel} castShadow />
      {geos.parts.map((g, i) => (
        <mesh key={i} geometry={g} material={steel} castShadow />
      ))}
      {kind === "clip" &&
        [-1, 1].map((s) => (
          <group key={s} position={[s * (width - 0.03), 0.012, 0]}>
            <mesh material={steel} castShadow>
              <boxGeometry args={[0.03, 0.04, 0.03]} />
            </mesh>
            <mesh position={[0, 0.03, 0]} material={steel} castShadow>
              <boxGeometry args={[0.006, 0.02, 0.006]} />
            </mesh>
          </group>
        ))}
    </group>
  );
}
