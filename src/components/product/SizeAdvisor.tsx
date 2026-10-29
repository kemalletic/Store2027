"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Product } from "@/lib/types";
import { CloseIcon } from "../icons";

type Pref = "uze" | "normalno" | "sire";

const TOPS = ["S", "M", "L", "XL", "XXL"];

/** A simple height/weight model; good enough to start from, the fit note covers the rest. */
export function recommend(p: Product, height: number, weight: number, pref: Pref) {
  const shift = pref === "uze" ? -1 : pref === "sire" ? 1 : 0;
  const k = p.garment.kind;
  if (k === "belt") {
    const waistCm = (weight * 0.25 + 13.5) * 2.54 + 10;
    return nearest(p.sizes, waistCm);
  }
  if (k === "jeans" || k === "shorts") {
    const waist = weight * 0.25 + 13.5 + (height > 190 ? 0.5 : 0) + shift;
    return nearest(p.sizes.filter((s) => !p.soldOut?.includes(s)), waist);
  }
  let i = weight < 68 ? 0 : weight < 78 ? 1 : weight < 88 ? 2 : weight < 100 ? 3 : 4;
  if (height > 190) i += 1;
  if (height < 168 && i > 0) i -= 1;
  i = Math.max(0, Math.min(TOPS.length - 1, i + shift));
  if (p.garment.oversized && pref !== "sire") i = Math.max(0, i - 1);
  return TOPS[i];
}

function nearest(sizes: string[], value: number) {
  return sizes.reduce((best, s) => (Math.abs(Number(s) - value) < Math.abs(Number(best) - value) ? s : best), sizes[0]);
}

export default function SizeAdvisor({ p, open, onClose, onPick }: { p: Product; open: boolean; onClose: () => void; onPick: (s: string) => void }) {
  const [height, setHeight] = useState(180);
  const [weight, setWeight] = useState(78);
  const [pref, setPref] = useState<Pref>("normalno");
  const first = useRef<HTMLInputElement>(null);
  const size = recommend(p, height, weight, pref);
  const soldOut = p.soldOut?.includes(size);

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[72] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <div className="pointer-events-none fixed inset-0 z-[73] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="savjetnik"
            data-lenis-prevent
            className="pointer-events-auto max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-t-2xl border border-white/10 bg-beton-900 p-6 sm:rounded-2xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="savjetnik" className="text-[22px] font-semibold">
                  Koja je moja veličina?
                </h2>
                <p className="mt-1 text-[14px] text-beton-300">Za {p.name.toLowerCase()}, na osnovu visine i težine.</p>
              </div>
              <button onClick={onClose} className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/5" aria-label="Zatvori savjetnik">
                <CloseIcon />
              </button>
            </div>

            <div className="space-y-6">
              <label className="block">
                <span className="flex justify-between text-[14px]">
                  <span className="text-beton-300">Visina</span>
                  <span className="tabular font-semibold">{height} cm</span>
                </span>
                <input ref={first} type="range" min={155} max={205} value={height} onChange={(e) => setHeight(+e.target.value)} className="mt-2 w-full accent-[var(--limeta)]" />
              </label>
              <label className="block">
                <span className="flex justify-between text-[14px]">
                  <span className="text-beton-300">Težina</span>
                  <span className="tabular font-semibold">{weight} kg</span>
                </span>
                <input type="range" min={50} max={130} value={weight} onChange={(e) => setWeight(+e.target.value)} className="mt-2 w-full accent-[var(--limeta)]" />
              </label>
              <fieldset>
                <legend className="mb-2 text-[14px] text-beton-300">Kako voliš da sjedi?</legend>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ["uze", "Uže"],
                      ["normalno", "Normalno"],
                      ["sire", "Šire"],
                    ] as [Pref, string][]
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setPref(id)}
                      aria-pressed={pref === id}
                      className={`h-11 rounded-full border text-[14px] font-medium ${pref === id ? "border-limeta bg-limeta text-limeta-ink" : "border-white/15 hover:border-white/50"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div className="mt-7 rounded-xl bg-white/[0.05] p-5" aria-live="polite">
              <p className="text-[14px] text-beton-300">Preporučujemo</p>
              <p className="display mt-1 text-[56px]" style={{ ["--wdth" as string]: 125 }}>
                {size}
              </p>
              <p className="mt-2 text-[14px] text-kreda/80">{soldOut ? "Ova veličina je trenutno rasprodana. Ostavi nam email na stranici i javimo kad stigne." : p.fitNote}</p>
            </div>
            <button
              className="btn btn-primary mt-5 w-full"
              disabled={soldOut}
              onClick={() => {
                onPick(size);
                onClose();
              }}
            >
              Izaberi veličinu {size}
            </button>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
