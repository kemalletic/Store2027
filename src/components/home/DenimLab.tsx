"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PRODUCTS } from "@/lib/products";
import type { Fit, Wash } from "@/lib/types";
import { WASH_COLORS } from "@/three/fabric";
import { RotateIcon } from "../icons";

const DenimLabCanvas = dynamic(() => import("@/three/DenimLabCanvas"), { ssr: false });

const FITS: { fit: Fit; label: string; note: string }[] = [
  { fit: "slim", label: "Slim", note: "Uska nogavica od koljena prema dolje." },
  { fit: "regular", label: "Regular", note: "Ravna nogavica, malo prostora u butinama." },
  { fit: "relaxed", label: "Relaxed", note: "Opuštena butina, blago šira nogavica." },
  { fit: "loose", label: "Loose", note: "Široko cijelom dužinom." },
];

const WASHES: { wash: Wash; label: string }[] = [
  { wash: "raw", label: "Raw" },
  { wash: "dark", label: "Tamno" },
  { wash: "mid", label: "Srednje" },
  { wash: "light", label: "Svijetlo" },
  { wash: "black", label: "Crno" },
];

export default function DenimLab() {
  const [fit, setFit] = useState<Fit>("regular");
  const [wash, setWash] = useState<Wash>("mid");
  const [show3d, setShow3d] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // only start the 3D scene when the section comes near the viewport
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShow3d(true), { rootMargin: "300px" });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const matching = PRODUCTS.filter((p) => p.category === "farmerke" && p.garment.fit === fit);
  const current = FITS.find((f) => f.fit === fit)!;

  return (
    <section id="denim-lab" aria-labelledby="denim-lab-naslov" className="relative mt-28 overflow-hidden border-y border-white/[0.07] bg-beton-900">
      <div className="mx-auto grid max-w-[1440px] items-center gap-6 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:px-10 lg:py-20">
        <div className="order-2 lg:order-1">
          <h2 id="denim-lab-naslov" className="display text-[44px] sm:text-[60px]" style={{ ["--wdth" as string]: 116 }}>
            Pronađi svoj kroj.
          </h2>
          <p className="mt-4 max-w-[44ch] text-[17px] text-kreda/75">Izaberi kroj i pranje, pa pogledaj farmerke sa svih strana. Model se okreće sam, a možeš ga i povući.</p>

          <fieldset className="mt-10">
            <legend className="mb-3 text-[14px] text-beton-300">Kroj</legend>
            <div className="flex flex-wrap gap-2">
              {FITS.map((f) => (
                <button
                  key={f.fit}
                  onClick={() => setFit(f.fit)}
                  aria-pressed={fit === f.fit}
                  className={`h-12 rounded-full border px-6 text-[15px] font-semibold transition-colors ${fit === f.fit ? "border-limeta bg-limeta text-limeta-ink" : "border-white/20 hover:border-white/60"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="mt-3 min-h-6 text-[15px] text-kreda/80" aria-live="polite">
              {current.note}
            </p>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="mb-3 text-[14px] text-beton-300">
              Pranje: <span className="text-kreda">{WASHES.find((w) => w.wash === wash)?.label}</span>
            </legend>
            <div className="flex gap-3">
              {WASHES.map((w) => (
                <button
                  key={w.wash}
                  onClick={() => setWash(w.wash)}
                  aria-pressed={wash === w.wash}
                  aria-label={`Pranje ${w.label}`}
                  className={`grid size-12 place-items-center rounded-full border-2 transition-colors ${wash === w.wash ? "border-limeta" : "border-transparent hover:border-white/40"}`}
                >
                  <span className="size-9 rounded-full border border-white/15" style={{ background: WASH_COLORS[w.wash] }} />
                </button>
              ))}
            </div>
          </fieldset>

          <div className="stitch-x mt-10 opacity-50" />
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <Link href={`/kategorija/farmerke?kroj=${fit}`} className="btn btn-primary">
              Prikaži farmerke {current.label}
            </Link>
            <span className="tabular text-[15px] text-beton-300">{matching.length === 1 ? "1 model" : `${matching.length} modela`} u ovom kroju</span>
          </div>
        </div>

        <div ref={ref} className="relative order-1 h-[520px] sm:h-[620px] lg:order-2 lg:h-[700px]">
          <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,#3a3d3c_0%,transparent_65%)]" aria-hidden />
          {show3d && <DenimLabCanvas fit={fit} wash={wash} />}
          <p className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 text-[13px] text-beton-300">
            <RotateIcon size={16} /> Povuci da okreneš
          </p>
        </div>
      </div>
    </section>
  );
}
