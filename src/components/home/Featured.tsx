"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { FEATURED, PRODUCTS, getProduct } from "@/lib/products";
import type { CategorySlug } from "@/lib/types";
import ProductCard from "../ProductCard";

const TABS: { label: string; cat: CategorySlug | null }[] = [
  { label: "Sve", cat: null },
  { label: "Farmerke", cat: "farmerke" },
  { label: "Majice", cat: "majice" },
  { label: "Trenerke", cat: "trenerke" },
  { label: "Džemperi", cat: "dzemperi" },
  { label: "Jakne", cat: "jakne" },
  { label: "Prsluci", cat: "prsluci" },
];

export default function Featured() {
  const [cat, setCat] = useState<CategorySlug | null>(null);
  const list = cat ? PRODUCTS.filter((p) => p.category === cat).slice(0, 8) : FEATURED.map((s) => getProduct(s)!);

  return (
    <section aria-labelledby="izdvojeno" className="mx-auto max-w-[1440px] px-4 pt-24 sm:px-6 lg:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <h2 id="izdvojeno" className="display text-[40px] sm:text-[52px]" style={{ ["--wdth" as string]: 112 }}>
          Izdvojeni proizvodi
        </h2>
        <LayoutGroup id="featured-tabs">
          <div role="tablist" aria-label="Filtriraj po kategoriji" className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {TABS.map((t) => {
              const active = cat === t.cat;
              return (
                <button
                  key={t.label}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setCat(t.cat)}
                  className={`relative h-10 shrink-0 rounded-full px-4 text-[14.5px] font-medium transition-colors ${active ? "text-limeta-ink" : "text-kreda/75 hover:text-kreda"}`}
                >
                  {active && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-limeta" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{t.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <motion.ul layout className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {list.map((p) => (
            <motion.li
              key={p.slug}
              layout
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <ProductCard p={p} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <div className="mt-10 flex justify-center">
        <Link href={cat ? `/kategorija/${cat}` : "/kategorija/sve"} className="btn btn-ghost">
          {cat ? `Svi proizvodi u kategoriji ${TABS.find((t) => t.cat === cat)?.label}` : "Svi proizvodi"}
        </Link>
      </div>
    </section>
  );
}
