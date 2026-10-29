"use client";

import Link from "next/link";
import { ViewTransition, useRef, useState } from "react";
import { motion } from "motion/react";
import { discount, formatKM, imageFor } from "@/lib/products";
import type { Product } from "@/lib/types";
import { useShop } from "@/lib/store";
import { HeartIcon } from "./icons";

export function HangTag({ children, tone = "lime" }: { children: React.ReactNode; tone?: "lime" | "copper" | "ink" | "chalk" }) {
  const cls = tone === "lime" ? "bg-limeta text-limeta-ink" : tone === "copper" ? "bg-bakar text-bakar-ink" : tone === "ink" ? "bg-tinta text-kreda" : "bg-kreda text-tinta";
  return <span className={`hangtag inline-flex h-[26px] items-center pr-2.5 text-[12px] font-bold ${cls}`}>{children}</span>;
}

export function PriceLine({ p, size = "md" }: { p: Product; size?: "md" | "lg" }) {
  return (
    <span className={`tabular flex flex-wrap items-baseline gap-x-2 ${size === "lg" ? "text-[24px]" : "text-[16px]"} font-semibold`}>
      <span>{formatKM(p.price)}</span>
      {p.oldPrice && (
        <span className={`${size === "lg" ? "text-[16px]" : "text-[13px]"} font-normal line-through opacity-55`}>
          <span className="sr-only">Stara cijena </span>
          {formatKM(p.oldPrice)}
        </span>
      )}
    </span>
  );
}

export default function ProductCard({ p, priority = false }: { p: Product; priority?: boolean }) {
  const { wishlist, toggleWish, add } = useShop();
  const wished = wishlist.includes(p.slug);
  const img = useRef<HTMLDivElement>(null);
  const [added, setAdded] = useState<string | null>(null);
  const off = discount(p);

  const quickAdd = (size: string) => {
    const r = img.current?.getBoundingClientRect();
    add(p.slug, size, r ? { x: r.left, y: r.top, w: r.width, h: r.height } : undefined);
    setAdded(size);
    setTimeout(() => setAdded(null), 1600);
  };

  return (
    <article className="group relative">
      <div ref={img} className="relative overflow-hidden rounded-[4px] bg-kreda">
        <Link href={`/proizvod/${p.slug}`} className="block" aria-label={`${p.name}, ${p.colorName}`}>
          <ViewTransition name={`product-${p.slug}`} share="morph" default="none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageFor(p.slug)}
              alt=""
              loading={priority ? "eager" : "lazy"}
              className="aspect-[3/4] w-full object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.03]"
            />
          </ViewTransition>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageFor(p.slug, "back")}
            alt=""
            loading="lazy"
            className="absolute inset-0 aspect-[3/4] w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 max-md:hidden"
          />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {p.isNew && <HangTag tone="copper">Novo</HangTag>}
          {off > 0 && <HangTag>−{off}%</HangTag>}
        </div>
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => toggleWish(p.slug)}
          className={`absolute right-2 top-2 grid size-10 place-items-center rounded-full bg-kreda/80 text-tinta backdrop-blur transition-colors hover:bg-kreda ${wished ? "text-tinta" : ""}`}
          aria-pressed={wished}
          aria-label={wished ? `Ukloni ${p.name} sa liste želja` : `Dodaj ${p.name} na listu želja`}
        >
          <motion.span key={String(wished)} initial={wished ? { scale: 0.4 } : false} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 600, damping: 12 }}>
            <HeartIcon size={19} filled={wished} />
          </motion.span>
        </motion.button>

        {/* quick add: sizes slide up on hover (desktop) */}
        <div className="absolute inset-x-2 bottom-2 translate-y-[calc(100%+12px)] rounded-[4px] bg-asfalt/90 p-2 backdrop-blur transition-transform duration-300 ease-[var(--ease-out)] group-focus-within:translate-y-0 group-hover:translate-y-0 max-md:hidden">
          <p className="mb-1.5 px-1 text-[12px] text-beton-300">{added ? `Dodano, veličina ${added}` : "Brzo dodaj u korpu"}</p>
          <div className="flex flex-wrap gap-1">
            {p.sizes.map((s) => {
              const out = p.soldOut?.includes(s);
              return (
                <button
                  key={s}
                  disabled={out}
                  onClick={() => quickAdd(s)}
                  className="tabular h-8 min-w-9 rounded-[3px] border border-white/15 px-1.5 text-[13px] font-medium text-kreda transition-colors hover:border-limeta hover:bg-limeta hover:text-limeta-ink disabled:cursor-not-allowed disabled:border-transparent disabled:text-beton-600 disabled:line-through"
                  aria-label={out ? `Veličina ${s}, rasprodano` : `Dodaj veličinu ${s} u korpu`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-1 px-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <Link href={`/proizvod/${p.slug}`} className="block truncate text-[15px] font-medium hover:underline">
            {p.name}
          </Link>
          <p className="text-[13px] text-beton-300">{p.colorName}</p>
        </div>
        <PriceLine p={p} />
      </div>
    </article>
  );
}
