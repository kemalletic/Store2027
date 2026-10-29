"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatKM, getProduct, imageFor } from "@/lib/products";
import { FREE_SHIPPING, cartCount, cartTotal, useShop } from "@/lib/store";
import { CloseIcon, MinusIcon, PlusIcon } from "./icons";

export function ShippingProgress({ total, tone = "dark" }: { total: number; tone?: "dark" | "light" }) {
  const left = Math.max(0, FREE_SHIPPING - total);
  const pct = Math.min(1, total / FREE_SHIPPING);
  return (
    <div>
      <p className="text-[14px]">
        {left > 0 ? (
          <>
            Do besplatne dostave fali još <strong className="tabular font-semibold">{formatKM(left)}</strong>
          </>
        ) : (
          <strong className="font-semibold">Dostava je besplatna.</strong>
        )}
      </p>
      <div className={`relative mt-2.5 h-[2px] ${tone === "dark" ? "bg-white/10" : "bg-black/10"}`} aria-hidden>
        <motion.div
          className="stitch-x absolute inset-y-0 left-0"
          style={{ ["--stitch" as string]: tone === "dark" ? "var(--limeta)" : "var(--tinta)" }}
          initial={false}
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, remove, setSize } = useShop();
  const total = cartTotal(cart);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!cartOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Korpa"
            data-lenis-prevent
            className="beton fixed inset-y-0 right-0 z-[71] flex w-full max-w-[440px] flex-col border-l border-white/10 sm:rounded-l-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 32 }}
          >
            <div className="flex items-center justify-between px-6 pb-4 pt-5">
              <h2 className="text-[20px] font-semibold">
                Korpa <span className="tabular text-beton-300">({cartCount(cart)})</span>
              </h2>
              <button ref={closeRef} onClick={() => setCartOpen(false)} className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-white/5" aria-label="Zatvori korpu">
                <CloseIcon />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-start justify-center gap-5 px-6 pb-24">
                <p className="display text-[40px]" style={{ ["--wdth" as string]: 110 }}>
                  Kutija je prazna.
                </p>
                <p className="max-w-[30ch] text-beton-300">Dodaj nešto s police i ovdje će te čekati spakovano.</p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/kategorija/novo" className="btn btn-primary" onClick={() => setCartOpen(false)}>
                    Pogledaj novu kolekciju
                  </Link>
                  <Link href="/kategorija/farmerke" className="btn btn-ghost" onClick={() => setCartOpen(false)}>
                    Farmerke
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="px-6 pb-4">
                  <ShippingProgress total={total} />
                </div>
                <ul className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
                  <AnimatePresence initial={false}>
                    {cart.map((item) => {
                      const p = getProduct(item.slug);
                      if (!p) return null;
                      return (
                        <motion.li
                          key={`${item.slug}-${item.size}`}
                          layout
                          initial={{ opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                          className="flex gap-4 rounded-xl bg-white/[0.04] p-3"
                        >
                          <Link href={`/proizvod/${p.slug}`} onClick={() => setCartOpen(false)} className="relative block w-[84px] shrink-0 overflow-hidden rounded-[4px] bg-kreda">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageFor(p.slug)} alt="" className="aspect-[3/4] w-full object-cover" />
                            {/* the item arrives as a box: the tape across the top */}
                            <span className="absolute inset-x-0 top-0 h-[7px] bg-[#c9a877]/90" aria-hidden />
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <Link href={`/proizvod/${p.slug}`} onClick={() => setCartOpen(false)} className="block truncate font-medium hover:underline">
                                  {p.name}
                                </Link>
                                <p className="text-[13px] text-beton-300">{p.colorName}</p>
                              </div>
                              <p className="tabular shrink-0 font-semibold">{formatKM(p.price * item.qty)}</p>
                            </div>
                            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                              <label className="flex items-center gap-2 text-[13px] text-beton-300">
                                Veličina
                                <select
                                  value={item.size}
                                  onChange={(e) => setSize(item.slug, item.size, e.target.value)}
                                  className="rounded-md border border-white/15 bg-beton-900 px-2 py-1 text-[14px] text-kreda"
                                >
                                  {p.sizes.map((s) => (
                                    <option key={s} value={s} disabled={p.soldOut?.includes(s)}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <div className="flex items-center rounded-full border border-white/15">
                                <button className="grid size-9 place-items-center" aria-label={`Smanji količinu za ${p.name}`} onClick={() => setQty(item.slug, item.size, item.qty - 1)}>
                                  <MinusIcon size={16} />
                                </button>
                                <span className="tabular w-6 text-center text-[14px]" aria-live="polite">
                                  {item.qty}
                                </span>
                                <button className="grid size-9 place-items-center" aria-label={`Povećaj količinu za ${p.name}`} onClick={() => setQty(item.slug, item.size, item.qty + 1)}>
                                  <PlusIcon size={16} />
                                </button>
                              </div>
                            </div>
                            <button onClick={() => remove(item.slug, item.size)} className="mt-2 self-start text-[13px] text-beton-300 underline-offset-2 hover:text-kreda hover:underline">
                              Ukloni
                            </button>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
                <div className="border-t border-white/10 px-6 pb-6 pt-4">
                  <div className="mb-1 flex justify-between text-[15px]">
                    <span className="text-beton-300">Ukupno</span>
                    <span className="tabular text-[18px] font-semibold">{formatKM(total)}</span>
                  </div>
                  <p className="mb-4 text-[13px] text-beton-300">Dostava se računa u sljedećem koraku. Plaćanje pouzećem ili karticom.</p>
                  <Link href="/naplata" onClick={() => setCartOpen(false)} className="btn btn-primary w-full">
                    Nastavi na plaćanje
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
