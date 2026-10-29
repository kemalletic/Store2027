"use client";

import dynamic from "next/dynamic";
import { ViewTransition, forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { imageFor } from "@/lib/products";
import type { Product } from "@/lib/types";
import { CubeIcon, LoupeIcon, PhotoIcon } from "../icons";

const ProductViewer = dynamic(() => import("@/three/ProductViewer"), { ssr: false });

type Mode = "3d" | "foto" | "lupa";

/** Maps garment metres to image fractions, matching the render framing. */
async function lupaSource(p: Product) {
  const [{ outlineFor }, { paintGarment }, { garmentFrame, fitDistance }] = await Promise.all([import("@/three/outline"), import("@/three/fabric"), import("@/three/Studio")]);
  const outline = outlineFor(p.garment);
  const tex = paintGarment(p.garment, outline);
  const canvas = tex.front.image as HTMLCanvasElement;
  const f = garmentFrame(p.garment);
  const dist = fitDistance(f.w, f.h, 22, 3 / 4, 1.16);
  const visH = 2 * dist * Math.tan((11 * Math.PI) / 180);
  const visW = (visH * 3) / 4;
  const b = outline.bounds;
  return {
    url: canvas.toDataURL("image/jpeg", 0.9),
    // where the painted texture sits inside the product image, as fractions
    rect: {
      left: 0.5 + b.minX / visW,
      top: 0.5 - (b.maxY - f.cy) / visH,
      width: (b.maxX - b.minX) / visW,
      height: (b.maxY - b.minY) / visH,
    },
  };
}

const Lupa = forwardRef<HTMLDivElement, { p: Product }>(function Lupa({ p }, ref) {
  const [src, setSrc] = useState<Awaited<ReturnType<typeof lupaSource>> | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    lupaSource(p).then((s) => alive && setSrc(s));
    return () => {
      alive = false;
    };
  }, [p]);

  const ZOOM = 2.6;
  const LENS = 200;
  const [box2, setBox2] = useState<{ w: number; h: number } | null>(null);
  const move = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    setBox2({ w: r.width, h: r.height });
    setPos({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };

  let lensStyle: React.CSSProperties = {};
  if (src && pos && box2) {
    const texW = src.rect.width * box2.w * ZOOM;
    const texH = src.rect.height * box2.h * ZOOM;
    const tx = ((pos.x - src.rect.left) / src.rect.width) * texW;
    const ty = ((pos.y - src.rect.top) / src.rect.height) * texH;
    lensStyle = {
      left: pos.x * box2.w - LENS / 2,
      top: pos.y * box2.h - LENS / 2,
      backgroundImage: `url(${src.url})`,
      backgroundSize: `${texW}px ${texH}px`,
      backgroundPosition: `${LENS / 2 - tx}px ${LENS / 2 - ty}px`,
    };
  }

  return (
    <div ref={ref} className="absolute inset-0">
      <div ref={box} className="absolute inset-0 cursor-none touch-none" onPointerMove={move} onPointerDown={move}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageFor(p.slug)} alt="" className="size-full object-cover" draggable={false} />
        {src && pos && box2 && (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-dashed border-tinta bg-kreda bg-no-repeat shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            style={{ width: LENS, height: LENS, ...lensStyle }}
            aria-hidden
          />
        )}
      </div>
      <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-tinta/85 px-3 py-1.5 text-[13px] text-kreda">Pomjeraj prst ili miš preko tkanine</p>
    </div>
  );
});

export default function ProductMedia({ p }: { p: Product }) {
  const canLupa = p.garment.kind !== "belt";
  const [mode, setMode] = useState<Mode>("3d");
  const [ready3d, setReady3d] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [photo, setPhoto] = useState<"front" | "back">("front");

  useEffect(() => {
    const c = document.createElement("canvas");
    const ok = !!(c.getContext("webgl2") || c.getContext("webgl"));
    // WebGL support is only knowable in the browser
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWebgl(ok);
    if (!ok) setMode("foto");
  }, []);

  const modes = useMemo(
    () =>
      [
        webgl && { id: "3d" as Mode, label: "3D", icon: <CubeIcon size={18} /> },
        { id: "foto" as Mode, label: "Foto", icon: <PhotoIcon size={18} /> },
        canLupa && { id: "lupa" as Mode, label: "Lupa", icon: <LoupeIcon size={18} /> },
      ].filter(Boolean) as { id: Mode; label: string; icon: React.ReactNode }[],
    [webgl, canLupa],
  );

  return (
    <div className="on-light">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[4px] bg-kreda">
        {/* the photo is always underneath: it is what the catalog image morphs into */}
        <ViewTransition name={`product-${p.slug}`} share="morph" default="none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageFor(p.slug, photo)} alt={`${p.name}, ${p.colorName}, ${photo === "front" ? "sprijeda" : "straga"}`} className="absolute inset-0 size-full object-cover" />
        </ViewTransition>

        {mode === "3d" && webgl && (
          <motion.div className="absolute inset-0 cursor-grab active:cursor-grabbing" initial={{ opacity: 0 }} animate={{ opacity: ready3d ? 1 : 0 }} transition={{ duration: 0.5 }}>
            <ProductViewer spec={p.garment} onReady={() => setReady3d(true)} />
          </motion.div>
        )}
        {mode === "3d" && !ready3d && webgl && <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[13px] text-tinta/60">Učitavam 3D model…</p>}
        {mode === "3d" && ready3d && (
          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-tinta/85 px-3 py-1.5 text-[13px] text-kreda">Povuci da okreneš</p>
        )}

        <AnimatePresence>{mode === "lupa" && <Lupa p={p} />}</AnimatePresence>

        {mode === "foto" && (
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {(["front", "back"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setPhoto(v)}
                aria-pressed={photo === v}
                className={`h-9 rounded-full px-4 text-[13px] font-semibold ${photo === v ? "bg-tinta text-kreda" : "bg-white/70 text-tinta"}`}
              >
                {v === "front" ? "Sprijeda" : "Straga"}
              </button>
            ))}
          </div>
        )}

        <div role="tablist" aria-label="Način prikaza" className="absolute left-3 top-3 flex gap-1 rounded-full bg-white/75 p-1 backdrop-blur">
          {modes.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`relative flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-tinta`}
            >
              {mode === m.id && <motion.span layoutId="media-pill" className="absolute inset-0 rounded-full bg-tinta" transition={{ type: "spring", stiffness: 450, damping: 34 }} />}
              <span className={`relative flex items-center gap-1.5 ${mode === m.id ? "text-kreda" : ""}`}>
                {m.icon}
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* thumbnails for quick front/back */}
      <div className="mt-3 grid grid-cols-4 gap-3">
        {(["front", "back"] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setMode("foto");
              setPhoto(v);
            }}
            className={`overflow-hidden rounded-[4px] border-2 bg-kreda ${mode === "foto" && photo === v ? "border-limeta" : "border-transparent"}`}
            aria-label={v === "front" ? "Fotografija sprijeda" : "Fotografija straga"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageFor(p.slug, v)} alt="" className="aspect-[3/4] w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
