import * as THREE from "three";

/**
 * Folding as a vertex-shader deformation, used by the "složi u kutiju"
 * animation. uFoldA folds the sleeves (or one leg) behind the garment,
 * uFoldB folds the lower half up behind it. Both run 0 → 1.
 */

export interface FoldUniforms {
  uFoldA: { value: number };
  uFoldB: { value: number };
  uFoldX: { value: number };
  uFoldY: { value: number };
  uFoldT: { value: number };
  uFoldMode: { value: number };
}

export function createFoldUniforms(foldX: number, foldY: number, thickness: number, mode: 0 | 1): FoldUniforms {
  return {
    uFoldA: { value: 0 },
    uFoldB: { value: 0 },
    uFoldX: { value: foldX },
    uFoldY: { value: foldY },
    uFoldT: { value: thickness },
    uFoldMode: { value: mode },
  };
}

const FOLD_GLSL = /* glsl */ `
uniform float uFoldA;
uniform float uFoldB;
uniform float uFoldX;
uniform float uFoldY;
uniform float uFoldT;
uniform float uFoldMode;

vec3 bfFold(vec3 p, vec3 ref, float isPoint) {
  float a = uFoldA * 3.14159265;
  bool regionA = uFoldMode < 0.5 ? abs(ref.x) > uFoldX : ref.x < 0.0;
  if (regionA && a > 0.0) {
    float s = uFoldMode < 0.5 ? sign(ref.x) : -1.0;
    float pivot = uFoldMode < 0.5 ? s * uFoldX * isPoint : 0.0;
    float dx = p.x - pivot;
    float ca = cos(a), sa = sin(a);
    float nx = dx * ca + s * p.z * sa;
    float nz = -s * dx * sa + p.z * ca;
    p.x = pivot + nx;
    p.z = nz - isPoint * 2.1 * uFoldT * min(1.0, uFoldA * 2.0);
  }
  float b = uFoldB * 3.14159265;
  if (ref.y < uFoldY && b > 0.0) {
    float zc = -3.3 * uFoldT * isPoint;
    float dy = p.y - uFoldY * isPoint;
    float dz = p.z - zc;
    float cb = cos(b), sb = sin(b);
    p.y = uFoldY * isPoint + dy * cb - dz * sb;
    p.z = zc + dy * sb + dz * cb;
  }
  return p;
}
`;

export function applyFold(material: THREE.Material, uniforms: FoldUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${FOLD_GLSL}`)
      .replace("#include <defaultnormal_vertex>", "objectNormal = bfFold(objectNormal, position, 0.0);\n#include <defaultnormal_vertex>")
      .replace("#include <morphtarget_vertex>", "#include <morphtarget_vertex>\ntransformed = bfFold(transformed, position, 1.0);");
  };
  material.customProgramCacheKey = () => "bf-fold";
}
