"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RACK, formatKM, getProduct } from "@/lib/products";
import type { RackHandle } from "@/three/HeroRack";
import { ArrowIcon } from "../icons";

const HeroRack = dynamic(() => import("@/three/HeroRack"), { ssr: false });

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Hero() {
  const handle = useRef<RackHandle>({ speed: 0, hovered: -1, focus: () => {}, open: () => {} });
  const headline = useRef<HTMLHeadingElement>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"pending" | "3d" | "flat">("pending");
  const [hovered, setHovered] = useState(-1);
  const [intro, setIntro] = useState(1);
  const [reduced, setReduced] = useState(false);
  const cursor = useRef(0);

  useEffect(() => {
    const seen = sessionStorage.getItem("box-intro") === "1";
    sessionStorage.setItem("box-intro", "1");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // browser-only facts, read once after mount so the server render stays identical
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReduced(reduce);
    setIntro(reduce ? 0.01 : seen ? 0.35 : 1);
    setMode(hasWebGL() ? "3d" : "flat");
    handle.current.onHover = (i) => setHovered(i);
  }, []);

  // the headline stretches with the speed of the rail, like stretch denim
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let w = 112;
    const loop = () => {
      const target = 112 + Math.min(13, handle.current.speed * 9);
      w += (target - w) * 0.12;
      if (headline.current) headline.current.style.setProperty("--wdth", w.toFixed(1));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const move = (dir: number) => {
    const next = Math.max(0, Math.min(RACK.length - 1, (cursor.current < 0 ? Math.floor(RACK.length / 2) : cursor.current) + dir));
    cursor.current = next;
    handle.current.focus(next);
  };

  const product = hovered >= 0 ? getProduct(RACK[hovered]) : undefined;

  return (
    <section
      aria-label="Izdvojena odjeća na vješalici"
      className="beton relative h-[100svh] max-h-[1000px] min-h-[620px] overflow-hidden"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") move(1);
        if (e.key === "ArrowLeft") move(-1);
      }}
    >
      {/* poster shown until the room is lit */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_52%_30%,#2b2e2d_0%,#141716_60%,#0d0f0e_100%)]" aria-hidden />

      {mode === "3d" && (
        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.6 * intro }}>
          <HeroRack slugs={RACK} handle={handle} onReady={() => setReady(true)} intro={intro} />
        </motion.div>
      )}

      {mode === "flat" && (
        <div className="no-scrollbar absolute inset-x-0 top-[calc(var(--header-h)+24px)] flex snap-x gap-4 overflow-x-auto px-6">
          {RACK.map((s) => {
            const p = getProduct(s)!;
            return (
              <Link key={s} href={`/proizvod/${s}`} className="w-[220px] shrink-0 snap-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/products/${s}-front.jpg`} alt={p.name} className="aspect-[3/4] w-full rounded-[4px] object-cover" />
              </Link>
            );
          })}
        </div>
      )}

      {/* intro: a stitch runs along the rail before the lights come on */}
      {intro > 0.5 && (
        <svg className="pointer-events-none absolute inset-x-0 top-[27%] h-4 w-full" aria-hidden preserveAspectRatio="none" viewBox="0 0 100 2">
          <motion.line
            x1="0"
            y1="1"
            x2="100"
            y2="1"
            stroke="var(--limeta)"
            strokeWidth="0.35"
            strokeDasharray="1.4 1"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 2 }}
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 1, 0] }}
            transition={{ pathLength: { duration: 0.7, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 1.4, times: [0, 0.6, 1] } }}
          />
        </svg>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-asfalt via-asfalt/70 to-transparent pb-8 pt-40 sm:pb-12">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-8 px-4 sm:px-6 lg:px-10">
          <div className="pointer-events-auto max-w-[680px]">
            <motion.h1
              ref={headline}
              className="display text-[clamp(52px,7.6vw,118px)]"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 * intro, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ ["--wdth" as string]: 112 }}
            >
              Stil koji traje.
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 * intro, duration: 0.6 }}>
              <p className="mt-5 max-w-[42ch] text-[17px] text-kreda/80 sm:text-[19px]">Farmerke, majice, trenerke, jakne i sve između. Skini nešto sa šipke.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/kategorija/novo" className="btn btn-primary">
                  Pogledaj kolekciju
                </Link>
                <Link href="/kategorija/farmerke" className="btn btn-ghost">
                  Farmerke
                </Link>
              </div>
            </motion.div>
          </div>

          {mode === "3d" && (
            <div className="pointer-events-auto hidden min-w-[300px] flex-col items-end gap-4 md:flex">
              <div className="h-[62px] text-right" aria-live="polite">
                <AnimatePresence mode="wait">
                  {product ? (
                    <motion.div key={product.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                      <p className="text-[19px] font-semibold">{product.name}</p>
                      <p className="tabular text-beton-300">
                        {formatKM(product.price)}
                        {product.oldPrice && <span className="ml-2 line-through">{formatKM(product.oldPrice)}</span>}
                        <span className="ml-3 text-kreda">Klikni za detalje</span>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4 text-[15px] text-beton-300">
                      Povuci odjeću lijevo ili desno
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-2">
                <button onClick={() => move(-1)} className="grid size-12 place-items-center rounded-full border border-white/20 hover:border-white/60" aria-label="Prethodni komad na šipki">
                  <ArrowIcon dir="left" />
                </button>
                <button onClick={() => move(1)} className="grid size-12 place-items-center rounded-full border border-white/20 hover:border-white/60" aria-label="Sljedeći komad na šipki">
                  <ArrowIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* the same rail as a plain list, for keyboards and screen readers */}
      <ul className="sr-only">
        {RACK.map((s, i) => {
          const p = getProduct(s)!;
          return (
            <li key={s}>
              <Link href={`/proizvod/${s}`} onFocus={() => handle.current.focus(i)}>
                {p.name}, {p.colorName}, {formatKM(p.price)}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
