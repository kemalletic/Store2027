"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES, formatKM, imageFor, searchProducts } from "@/lib/products";
import { useShop } from "@/lib/store";
import { CloseIcon, SearchIcon } from "./icons";

const POPULAR = ["farmerke regular", "trenerka", "dzemper", "crna majica", "prsluk", "kais"];

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useShop();
  const [q, setQ] = useState("");
  const deferred = useDeferredValue(q);
  const results = searchProducts(deferred).slice(0, 8);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, setSearchOpen]);

  const close = () => setSearchOpen(false);

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Pretraga"
          data-lenis-prevent
          className="fixed inset-0 z-[75] overflow-y-auto bg-asfalt/[0.97] backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mx-auto max-w-[1100px] px-4 pt-5 sm:px-8 sm:pt-10">
            <div className="flex items-center gap-3">
              <label className="flex flex-1 items-center gap-4 border-b border-white/20 pb-3 focus-within:border-limeta">
                <SearchIcon size={26} className="shrink-0 text-beton-300" />
                <span className="sr-only">Pretraži proizvode</span>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Šta tražiš? Npr. crne farmerke"
                  className="w-full bg-transparent text-[24px] font-medium outline-none placeholder:text-beton-600 sm:text-[34px]"
                  style={{ fontVariationSettings: '"wdth" 110' }}
                />
              </label>
              <button onClick={close} className="grid size-12 shrink-0 place-items-center rounded-full hover:bg-white/5" aria-label="Zatvori pretragu">
                <CloseIcon size={26} />
              </button>
            </div>

            {!deferred.trim() ? (
              <div className="grid gap-10 py-10 sm:grid-cols-2">
                <div>
                  <p className="mb-4 text-[14px] text-beton-300">Ljudi najčešće traže</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR.map((p) => (
                      <button key={p} onClick={() => setQ(p)} className="rounded-full border border-white/15 px-4 py-2 text-[15px] hover:border-limeta hover:text-limeta">
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-4 text-[14px] text-beton-300">Kategorije</p>
                  <ul className="grid grid-cols-2 gap-1">
                    {CATEGORIES.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/kategorija/${c.slug}`} onClick={close} className="block py-1.5 text-[17px] hover:text-limeta">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="py-14">
                <p className="text-[20px] font-medium">Nema proizvoda za „{deferred}”.</p>
                <p className="mt-2 text-beton-300">Probaj kraći pojam, na primjer samo „farmerke” ili boju.</p>
              </div>
            ) : (
              <div className="py-8">
                <p className="mb-4 text-[14px] text-beton-300" aria-live="polite">
                  {results.length === 1 ? "1 proizvod" : `${results.length} proizvoda`}
                </p>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {results.map((p, i) => (
                    <motion.li key={p.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}>
                      <Link href={`/proizvod/${p.slug}`} onClick={close} className="group block">
                        <span className="block overflow-hidden rounded-[4px] bg-kreda">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageFor(p.slug)} alt="" className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                        </span>
                        <span className="mt-2 block text-[14.5px] font-medium">{p.name}</span>
                        <span className="block text-[13px] text-beton-300">
                          {p.colorName}, <span className="tabular">{formatKM(p.price)}</span>
                        </span>
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
