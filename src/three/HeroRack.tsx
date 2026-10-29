"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useRouter } from "next/navigation";
import { memo, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { getProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import { Garment } from "./Garment";
import { HOOK_CENTER, Hanger } from "./Hanger";
import { concreteTextures } from "./concrete";
import { makeCanvas } from "./noise";

/**
 * The hero: a concrete room with a steel rail. Garments hang on hangers and
 * behave like they do in a shop — dragging slides them along the rail, they
 * swing and bump into each other, hovering turns one towards you, clicking
 * lifts it off the rail into its product page.
 */

export interface RackHandle {
  /** px/s of the rail, smoothed; drives the stretch headline. */
  speed: number;
  hovered: number;
  onHover?: (i: number) => void;
  focus: (i: number) => void;
  open: (i: number) => void;
}

const RAIL_Y = 0.62;
const SPACING = 0.66;
const PENDULUM = 0.55;

interface ItemState {
  x: number;
  v: number;
  a: number;
  theta: number;
  omega: number;
  tag: number;
  tagW: number;
  turn: number;
  lift: number;
}

function hangerFor(p: Product) {
  const k = p.garment.kind;
  if (k === "jeans" || k === "sweatpants" || k === "shorts") return { kind: "clip" as const, width: 0.2 };
  return { kind: "top" as const, width: k === "vest" ? 0.16 : 0.205 };
}

function priceTagTexture(p: Product) {
  const c = makeCanvas(200, 300);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = p.oldPrice ? "#e2fb50" : "#efe9dd";
  ctx.fillRect(0, 0, 200, 300);
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(100, 34, 13, 0, Math.PI * 2);
  ctx.fill();
  const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-archivo").trim() || "sans-serif";
  ctx.textAlign = "center";
  ctx.font = `expanded 900 30px ${fam}`;
  ctx.fillText("BOX", 100, 102);
  ctx.fillRect(30, 124, 140, 3);
  ctx.font = `800 46px ${fam}`;
  ctx.fillText(p.price.toFixed(2).replace(".", ","), 100, 198);
  ctx.font = `600 26px ${fam}`;
  ctx.fillText("KM", 100, 238);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const RackItem = memo(function RackItem({
  product,
  index,
  state,
  hovered,
  onHover,
  onOpen,
  step,
  shadows,
}: {
  product: Product;
  index: number;
  state: ItemState;
  hovered: boolean;
  onHover: (i: number | null) => void;
  onOpen: (i: number) => void;
  step: number;
  shadows: boolean;
}) {
  const root = useRef<THREE.Group>(null);
  const pivot = useRef<THREE.Group>(null);
  const tag = useRef<THREE.Group>(null);
  const tagTex = useMemo(() => priceTagTexture(product), [product]);
  const h = hangerFor(product);

  useFrame(() => {
    if (!root.current || !pivot.current || !tag.current) return;
    root.current.position.x = state.x;
    root.current.position.z = state.lift * 0.22;
    pivot.current.rotation.z = state.theta;
    pivot.current.rotation.y = state.turn;
    tag.current.rotation.z = state.tag - state.theta * 0.4;
    tag.current.rotation.y = -state.turn * 1.4 + 0.25;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(index);
  };

  return (
    <group ref={root} position={[state.x, RAIL_Y, 0]}>
      <group ref={pivot}>
        <group position={[-HOOK_CENTER.x, -HOOK_CENTER.y, 0]}>
          <group onPointerOver={over} onPointerOut={() => onHover(null)} onClick={(e) => (e.stopPropagation(), onOpen(index))}>
            <Garment spec={product.garment} step={step} castShadow={shadows} />
            {/* invisible, generous hit area so thin garments are easy to grab */}
            <mesh position={[0, -0.35, 0]} visible={false}>
              <planeGeometry args={[0.55, 0.8]} />
            </mesh>
          </group>
          <Hanger kind={h.kind} width={h.width} />
          {/* price tag hanging from the hanger by a thread */}
          <group ref={tag} position={[h.kind === "clip" ? h.width - 0.05 : 0.07, h.kind === "clip" ? 0.03 : -0.01, 0.03]}>
            <mesh position={[0, -0.03, 0]}>
              <cylinderGeometry args={[0.0007, 0.0007, 0.06, 4]} />
              <meshBasicMaterial color="#d8d2c4" />
            </mesh>
            <mesh position={[0, -0.1, 0.002]} castShadow={shadows}>
              <planeGeometry args={[0.055, 0.0825]} />
              <meshStandardMaterial map={tagTex} roughness={0.85} side={THREE.DoubleSide} emissive={hovered ? "#222" : "#000"} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
});

function Room({ lowPower }: { lowPower: boolean }) {
  const wall = useMemo(() => {
    const t = concreteTextures({ size: lowPower ? 512 : 1024, tone: 104, boards: 3, ties: [3, 2], seed: 9 });
    t.map.repeat.set(3.2, 1.6);
    t.normalMap.repeat.set(3.2, 1.6);
    return t;
  }, [lowPower]);
  const floor = useMemo(() => {
    const t = concreteTextures({ size: 512, tone: 70, boards: 1, ties: [0, 0], seed: 2 });
    t.map.repeat.set(4, 2);
    t.normalMap.repeat.set(4, 2);
    return t;
  }, []);
  // a dashed lime line where the wall meets the floor: the brand's stitch
  const dashes = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.07, 0.008, 0.008);
    const mat = new THREE.MeshBasicMaterial({ color: "#e2fb50", toneMapped: false });
    const mesh = new THREE.InstancedMesh(geo, mat, 80);
    const m = new THREE.Matrix4();
    for (let i = 0; i < 80; i++) {
      m.makeTranslation(-6 + i * 0.15, -1.012, -0.6);
      mesh.setMatrixAt(i, m);
    }
    return mesh;
  }, []);
  return (
    <group>
      <mesh position={[0, 0, -0.62]} receiveShadow>
        <planeGeometry args={[12, 6]} />
        <meshStandardMaterial map={wall.map} normalMap={wall.normalMap} normalScale={new THREE.Vector2(0.8, 0.8)} roughness={0.95} />
      </mesh>
      <mesh position={[0, -1.02, 1.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 4.1]} />
        <meshStandardMaterial map={floor.map} normalMap={floor.normalMap} roughness={0.8} metalness={0.05} />
      </mesh>
      <primitive object={dashes} />
      {/* rail and wall brackets */}
      <mesh position={[0, RAIL_Y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.011, 0.011, 12, 16]} />
        <meshStandardMaterial color="#2a2c2e" metalness={0.9} roughness={0.3} />
      </mesh>
      {[-2.4, 0, 2.4].map((x) => (
        <group key={x} position={[x, RAIL_Y, 0]}>
          <mesh position={[0, 0, -0.31]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.009, 0.009, 0.62, 10]} />
            <meshStandardMaterial color="#2a2c2e" metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.615]}>
            <cylinderGeometry args={[0.035, 0.035, 0.01, 20]} />
            <meshStandardMaterial color="#202224" metalness={0.8} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Scene({
  products,
  handle,
  onReady,
  lowPower,
  intro,
}: {
  products: Product[];
  handle: RefObject<RackHandle>;
  onReady: () => void;
  lowPower: boolean;
  intro: number;
}) {
  const router = useRouter();
  const { camera, gl, size } = useThree();
  const [hovered, setHovered] = useState<number | null>(null);
  const hoveredRef = useRef<number | null>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const key = useRef<THREE.Group>(null);
  const opening = useRef(false);
  const items = useMemo<ItemState[]>(
    () => products.map((_, i) => ({ x: (i - (products.length - 1) / 2) * SPACING, v: 0, a: 0, theta: (i % 2 ? 1 : -1) * 0.05, omega: 0, tag: 0, tagW: 0, turn: 0, lift: 0 })),
    [products],
  );

  // rail offset driven by drag / wheel / keyboard, with inertia
  const rail = useRef({ offset: 0, target: 0, vel: 0, dragging: false, lastX: 0, lastT: 0, moved: 0, scroll: 0, smoothSpeed: 0 });
  const span = ((products.length - 1) * SPACING) / 2;
  const viewHalf = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera;
    return Math.tan(((cam.fov / 2) * Math.PI) / 180) * cam.position.z * (size.width / size.height);
  }, [camera, size]);
  const limit = Math.max(0, span - viewHalf * 0.55);

  const worldPerPx = useMemo(() => (viewHalf * 2) / size.width, [viewHalf, size]);

  useEffect(() => {
    const el = gl.domElement;
    const r = rail.current;
    const down = (e: PointerEvent) => {
      r.dragging = true;
      r.lastX = e.clientX;
      r.lastT = performance.now();
      r.moved = 0;
      r.vel = 0;
    };
    const move = (e: PointerEvent) => {
      if (!r.dragging) return;
      const px = e.clientX - r.lastX;
      const dx = px * worldPerPx;
      const now = performance.now();
      r.target += dx;
      r.vel = (dx / Math.max(1, now - r.lastT)) * 16;
      r.lastX = e.clientX;
      r.lastT = now;
      r.moved += Math.abs(px);
      if (r.moved > 6) el.style.cursor = "grabbing";
    };
    const up = () => {
      r.dragging = false;
      el.style.cursor = "";
    };
    const wheel = (e: WheelEvent) => {
      // only horizontal intent: vertical wheel keeps scrolling the page
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        r.target -= e.deltaX * worldPerPx;
      }
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl, worldPerPx]);

  const focusItem = (i: number) => {
    const r = rail.current;
    r.target = r.offset - items[i].x;
    hoveredRef.current = i;
    setHovered(i);
    handle.current?.onHover?.(i);
  };

  const open = (i: number) => {
    if (opening.current) return;
    if (rail.current.moved > 8) return; // it was a drag, not a click
    // the garment under the cursor may have swung; open the one the caption names
    if (hoveredRef.current !== null) i = hoveredRef.current;
    opening.current = true;
    const p = products[i];
    const it = items[i];
    router.prefetch(`/proizvod/${p.slug}`);
    const cam = camera as THREE.PerspectiveCamera;
    const tl = gsap.timeline({ onComplete: () => router.push(`/proizvod/${p.slug}`) });
    tl.to(it, { lift: 1, turn: 0, duration: 0.35, ease: "power2.out" }, 0)
      .to(cam.position, { x: it.x, y: RAIL_Y - 0.45, z: 1.35, duration: 0.6, ease: "power3.inOut" }, 0.05)
      .to(spot.current!, { intensity: 0, duration: 0.4 }, 0.15)
      .to(cam, { fov: 26, duration: 0.6, ease: "power3.inOut", onUpdate: () => cam.updateProjectionMatrix() }, 0.05);
  };

  useEffect(() => {
    if (!handle.current) return;
    handle.current.focus = focusItem;
    handle.current.open = (i) => {
      rail.current.moved = 0;
      open(i);
    };
  });

  useEffect(() => {
    const onScroll = () => (rail.current.scroll = Math.min(1.2, window.scrollY / window.innerHeight));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    onReady();
    if (!spot.current || !key.current) return;
    // intro: the lights come on like a shop opening
    const s = spot.current;
    const base = s.intensity;
    s.intensity = 0;
    gsap.to(s, { intensity: base, duration: 1.1 * intro, delay: 0.45 * intro, ease: "power2.inOut" });
    key.current.children.forEach((c) => {
      const l = c as THREE.Light;
      const b = l.intensity;
      l.intensity = 0;
      gsap.to(l, { intensity: b, duration: 1.2 * intro, delay: 0.6 * intro, ease: "power1.inOut" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointer = useRef(new THREE.Vector2());
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    dt = Math.min(dt, 1 / 30);
    const r = rail.current;
    if (!r.dragging) {
      r.target += r.vel;
      r.vel *= Math.pow(0.9, dt * 60);
      // rubber band at the ends
      if (r.target > limit) r.target += (limit - r.target) * 0.12;
      if (r.target < -limit) r.target += (-limit - r.target) * 0.12;
    }
    const prev = r.offset;
    r.offset += (r.target - r.offset) * Math.min(1, dt * 9);
    const railSpeed = (r.offset - prev) / dt;
    r.smoothSpeed += (Math.abs(railSpeed) - r.smoothSpeed) * Math.min(1, dt * 6);
    if (handle.current) handle.current.speed = r.smoothSpeed;

    const scrollShift = -r.scroll * 0.9;
    const t = state.clock.elapsedTime;
    const hov = hoveredRef.current;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const rest = (i - (items.length - 1) / 2) * SPACING + r.offset + scrollShift;
      // each garment follows the rail with a little lag, so they bunch and spread
      const k = 60 - (i % 3) * 8;
      let force = (rest - it.x) * k - it.v * 11;
      if (i > 0) {
        const gap = it.x - items[i - 1].x;
        if (gap < 0.46) force += (0.46 - gap) * 400;
      }
      if (i < items.length - 1) {
        const gap = items[i + 1].x - it.x;
        if (gap < 0.46) force -= (0.46 - gap) * 400;
      }
      const vPrev = it.v;
      it.v += force * dt;
      it.x += it.v * dt;
      it.a = (it.v - vPrev) / dt;
      // pendulum: driven by the hanger's acceleration along the rail
      const breeze = Math.sin(t * 0.7 + i * 1.7) * 0.06;
      const alpha = (-9.8 / PENDULUM) * Math.sin(it.theta) - 2.2 * it.omega - (it.a / PENDULUM) * 0.55 + breeze;
      it.omega += alpha * dt;
      it.theta += it.omega * dt;
      // the price tag swings on its own thread
      const tagAlpha = -40 * it.tag - 4 * it.tagW + it.omega * 6;
      it.tagW += tagAlpha * dt;
      it.tag += it.tagW * dt;
      const wantTurn = hov === i ? 0.32 : 0;
      it.turn += (wantTurn - it.turn) * Math.min(1, dt * 7);
      if (!opening.current) it.lift += ((hov === i ? 0.45 : 0) - it.lift) * Math.min(1, dt * 7);
    }

    // spotlight follows the pointer across the wall
    if (spot.current) {
      pointer.current.lerp(state.pointer, Math.min(1, dt * 3));
      tmp.set(pointer.current.x * viewHalf * 0.8, -0.2 + pointer.current.y * 0.6, -0.6);
      spot.current.target.position.copy(tmp);
      spot.current.target.updateMatrixWorld();
    }
  });

  const onHover = (i: number | null) => {
    hoveredRef.current = i;
    setHovered(i);
    if (handle.current) {
      handle.current.hovered = i ?? -1;
      handle.current.onHover?.(i ?? -1);
    }
    gl.domElement.style.cursor = i === null ? "" : "pointer";
    if (i !== null) router.prefetch(`/proizvod/${products[i].slug}`);
  };

  const step = lowPower ? 0.012 : 0.009;
  return (
    <>
      <color attach="background" args={["#0d0f0e"]} />
      <fog attach="fog" args={["#0d0f0e", 3.2, 7]} />
      <ambientLight intensity={0.05} />
      <group ref={key}>
        <directionalLight position={[-3, 2.5, 3]} intensity={0.35} />
        <directionalLight position={[3, 1, 2]} intensity={0.12} color="#dfe6ff" />
      </group>
      <spotLight
        ref={spot}
        position={[0.4, 2.8, 2.6]}
        angle={0.5}
        penumbra={1}
        intensity={30}
        decay={1.6}
        castShadow={!lowPower}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-intensity={0.85}
      />
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={0.4} position={[0, 2, 3]} scale={[4, 2, 1]} />
      </Environment>
      <Room lowPower={lowPower} />
      {products.map((p, i) => (
        <RackItem key={p.slug} product={p} index={i} state={items[i]} hovered={hovered === i} onHover={onHover} onOpen={open} step={step} shadows={!lowPower} />
      ))}
    </>
  );
}

export default function HeroRack({ slugs, handle, onReady, intro = 1 }: { slugs: string[]; handle: RefObject<RackHandle>; onReady: () => void; intro?: number }) {
  const [lowPower] = useState(() => typeof navigator !== "undefined" && ((navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 700));
  const products = useMemo(() => {
    const list = slugs.map((s) => getProduct(s)!).filter(Boolean);
    return lowPower ? list.slice(0, 6) : list;
  }, [slugs, lowPower]);
  const wrap = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0 });
    if (wrap.current) io.observe(wrap.current);
    return () => io.disconnect();
  }, []);
  const narrow = typeof window !== "undefined" && window.innerWidth < 700;
  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        shadows
        frameloop={visible ? "always" : "never"}
        dpr={[1, lowPower ? 1.25 : 1.75]}
        camera={{ position: [0, narrow ? 0.12 : 0.06, narrow ? 3.4 : 4.0], fov: narrow ? 44 : 32, near: 0.05, far: 20 }}
        gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ camera }) => camera.lookAt(0, narrow ? -0.42 : -0.04, 0)}
        style={{ touchAction: "pan-y" }}
      >
        <Scene products={products} handle={handle} onReady={onReady} lowPower={lowPower} intro={intro} />
      </Canvas>
    </div>
  );
}

