"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { PRODUCTS, discount, getCategory, getProduct } from "@/lib/products";
import type { Product } from "@/lib/types";
import { useShop } from "@/lib/store";
import ProductCard, { HangTag, PriceLine } from "../ProductCard";
import { CARE_LABEL, CareIcon, ChevronIcon, HeartIcon, RulerIcon, TruckIcon } from "../icons";
import ProductMedia from "./ProductMedia";
import SizeAdvisor from "./SizeAdvisor";

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between py-4 text-left text-[16px] font-medium">
        {title}
        <ChevronIcon size={18} style={{ transition: "transform .3s", transform: open ? "rotate(180deg)" : undefined }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
            <div className="pb-5 text-[15px] text-kreda/80">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SizeTable({ p }: { p: Product }) {
  const k = p.garment.kind;
  if (k === "belt") {
    return <p>Dužina kaiša mjeri se od kopče do srednje rupe. Uzmi dužinu za 10 cm veću od obima struka.</p>;
  }
  const pants = k === "jeans" || k === "shorts";
  const rows = pants
    ? p.sizes.map((s) => [s, `${Math.round(Number(s) * 2.54)} cm`, k === "shorts" ? "23 cm" : `${s === "28" || s === "29" ? 80 : 82} cm`])
    : p.sizes.map((s, i) => [s, `${(p.garment.oversized ? 56 : 51) + i * 3} cm`, `${(p.garment.oversized ? 72 : 70) + i * 2} cm`]);
  return (
    <table className="tabular w-full text-left text-[14px]">
      <caption className="sr-only">Tabela veličina</caption>
      <thead className="text-beton-300">
        <tr>
          <th className="py-1.5 font-normal">Veličina</th>
          <th className="py-1.5 font-normal">{pants ? "Struk" : "Širina grudi"}</th>
          <th className="py-1.5 font-normal">{pants ? "Dužina nogavice" : "Dužina"}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r[0]} className="border-t border-white/[0.07]">
            {r.map((c, i) => (
              <td key={i} className="py-1.5">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const COMPLETE: Record<string, string[]> = {
  farmerke: ["majica-basic-bijela", "jakna-premium", "kais-kozni-smedji"],
  trenerke: ["duks-hoodie-siva", "majica-heavy-oversized", "prsluk-urban"],
  majice: ["farmerke-regular-fit", "jakna-trucker-indigo", "kais-kozni-crni"],
  dzemperi: ["farmerke-slim-fit", "prsluk-urban-maslinasti", "kais-kozni-crni"],
  prsluci: ["duks-hoodie-crna", "farmerke-loose-fit", "trenerka-beton"],
  jakne: ["majica-basic-crna", "farmerke-regular-fit-crne", "kais-kozni-crni"],
  kaisevi: ["farmerke-regular-fit", "farmerke-relaxed-fit", "majica-basic-bijela"],
  sorcevi: ["majica-heavy-oversized-asfalt", "majica-basic-bijela", "kais-kozni-smedji"],
};

export default function ProductView({ slug }: { slug: string }) {
  const p = getProduct(slug)!;
  const cat = getCategory(p.category)!;
  const { add, wishlist, toggleWish } = useShop();
  const [size, setSize] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [advisor, setAdvisor] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const sizesCtl = useAnimationControls();
  const media = useRef<HTMLDivElement>(null);
  const mainBtn = useRef<HTMLButtonElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  const wished = wishlist.includes(p.slug);
  const off = discount(p);
  const family = (p.family ?? []).map((s) => getProduct(s)!).filter(Boolean);
  const complete = (COMPLETE[p.category] ?? []).map((s) => getProduct(s)!).filter(Boolean);
  const similar = PRODUCTS.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4);

  useEffect(() => {
    const el = mainBtn.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const addToCart = () => {
    if (!size) {
      setError(true);
      sizesCtl.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } });
      document.getElementById("velicine")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const r = media.current?.getBoundingClientRect();
    const visible = r && r.bottom > 80 && r.top < window.innerHeight;
    add(p.slug, size, visible ? { x: r.left, y: r.top, w: r.width, h: r.width * (4 / 3) } : undefined);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2200);
  };

  return (
    <div className="pt-[calc(var(--header-h)+24px)]">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
        {/* keep the 3:4 media inside the viewport on wide screens */}
        <div ref={media} className="w-full lg:max-w-[calc((100svh-var(--header-h)-150px)*0.75)] lg:justify-self-end">
          <ProductMedia p={p} />
        </div>

        <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <nav aria-label="Putanja" className="mb-5 text-[14px] text-beton-300">
            <Link href="/" className="hover:text-kreda">
              Početna
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <Link href={`/kategorija/${cat.slug}`} className="hover:text-kreda">
              {cat.name}
            </Link>
          </nav>
          <div className="mb-3 flex gap-2">
            {p.isNew && <HangTag>Novo</HangTag>}
            {off > 0 && <HangTag tone="chalk">−{off}%</HangTag>}
          </div>
          <h1 className="display text-[42px] sm:text-[56px]" style={{ ["--wdth" as string]: 112 }}>
            {p.name}
          </h1>
          <p className="mt-2 text-[15px] text-beton-300">
            {p.brand}, {p.colorName.toLowerCase()}
          </p>
          <div className="mt-5">
            <PriceLine p={p} size="lg" />
          </div>
          <p className="mt-6 max-w-[52ch] text-[16px] text-kreda/80">{p.description}</p>

          {family.length > 1 && (
            <div className="mt-7">
              <p className="mb-3 text-[14px] text-beton-300">
                Boja: <span className="text-kreda">{p.colorName}</span>
              </p>
              <div className="flex gap-2">
                {family.map((f) => (
                  <Link
                    key={f.slug}
                    href={`/proizvod/${f.slug}`}
                    aria-current={f.slug === p.slug ? "true" : undefined}
                    aria-label={f.colorName}
                    className={`grid size-12 place-items-center rounded-full border-2 ${f.slug === p.slug ? "border-limeta" : "border-transparent hover:border-white/40"}`}
                  >
                    <span className="size-9 rounded-full border border-white/20" style={{ background: f.swatch }} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7" id="velicine">
            <div className="mb-3 flex items-center justify-between">
              <p className={`text-[14px] ${error ? "text-greska" : "text-beton-300"}`} aria-live="assertive">
                {error && !size ? "Izaberi veličinu da dodaš u korpu." : size ? `Veličina: ${size}` : "Veličina"}
              </p>
              <button onClick={() => setAdvisor(true)} className="flex items-center gap-1.5 text-[14px] font-medium underline underline-offset-4 hover:text-limeta">
                <RulerIcon size={17} /> Koja je moja veličina?
              </button>
            </div>
            <motion.div animate={sizesCtl} role="radiogroup" aria-label="Veličina" className="grid grid-cols-5 gap-2 sm:grid-cols-6">
              {p.sizes.map((s) => {
                const out = p.soldOut?.includes(s);
                const on = size === s;
                return (
                  <button
                    key={s}
                    role="radio"
                    aria-checked={on}
                    disabled={out}
                    onClick={() => {
                      setSize(s);
                      setError(false);
                    }}
                    className={`tabular relative h-12 rounded-[4px] border text-[15px] font-semibold transition-colors ${
                      on ? "border-transparent bg-kreda text-tinta" : out ? "cursor-not-allowed border-white/5 text-beton-600 line-through" : "border-white/15 hover:border-white/60"
                    }`}
                    aria-label={out ? `${s}, rasprodano` : s}
                  >
                    {s}
                    {on && (
                      <motion.span layoutId="size-stitch" className="pointer-events-none absolute -inset-[5px] rounded-[7px] border-2 border-dashed border-limeta" transition={{ type: "spring", stiffness: 500, damping: 32 }} />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </div>

          <div className="mt-7 flex gap-2">
            <button ref={mainBtn} onClick={addToCart} className="btn btn-primary h-14 flex-1 text-[16px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={justAdded ? "a" : "b"} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.18 }}>
                  {justAdded ? "Spakovano u korpu" : "Dodaj u korpu"}
                </motion.span>
              </AnimatePresence>
            </button>
            <button
              onClick={() => toggleWish(p.slug)}
              aria-pressed={wished}
              aria-label={wished ? "Ukloni sa liste želja" : "Dodaj na listu želja"}
              className={`grid size-14 place-items-center rounded-full border ${wished ? "border-limeta text-limeta" : "border-white/20 hover:border-white/60"}`}
            >
              <HeartIcon filled={wished} />
            </button>
          </div>
          <p className="mt-4 flex items-center gap-2 text-[14px] text-beton-300">
            <TruckIcon size={18} /> Dostava za 24–48h, plaćanje pouzećem. Besplatna zamjena veličine.
          </p>

          <div className="mt-8 border-t border-white/10">
            <Accordion title="Materijal" defaultOpen>
              <p>{p.material}</p>
              {p.weight && <p className="mt-1">Gramaža: {p.weight}</p>}
            </Accordion>
            <Accordion title="Kroj i mjere">
              <p className="mb-4">{p.fitNote}</p>
              <SizeTable p={p} />
            </Accordion>
            <Accordion title="Održavanje">
              <ul className="grid grid-cols-2 gap-3">
                {p.care.map((c) => (
                  <li key={c} className="flex items-center gap-2.5">
                    <CareIcon kind={c} size={26} />
                    <span>{CARE_LABEL[c]}</span>
                  </li>
                ))}
              </ul>
            </Accordion>
            <Accordion title="Dostava i povrat">
              <p>Šaljemo brzom poštom po cijeloj BiH, paket stiže za 24–48h. Dostava je 7 KM, a besplatna za narudžbe od 100 KM.</p>
              <p className="mt-2">Ako veličina ne odgovara, zamjena je besplatna. Povrat je moguć u roku od 14 dana.</p>
            </Accordion>
          </div>
        </div>
      </div>

      {complete.length > 0 && (
        <section aria-labelledby="slozi" className="mx-auto max-w-[1440px] px-4 pt-24 sm:px-6 lg:px-10">
          <h2 id="slozi" className="display mb-8 text-[34px] sm:text-[44px]" style={{ ["--wdth" as string]: 112 }}>
            Složi uz ovo
          </h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3">
            {complete.map((x) => (
              <li key={x.slug}>
                <ProductCard p={x} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {similar.length > 0 && (
        <section aria-labelledby="slicno" className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
          <h2 id="slicno" className="display mb-8 text-[34px] sm:text-[44px]" style={{ ["--wdth" as string]: 112 }}>
            Još iz kategorije {cat.name.toLowerCase()}
          </h2>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
            {similar.map((x) => (
              <li key={x.slug}>
                <ProductCard p={x} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* mobile: add to cart stays under the thumb */}
      <AnimatePresence>
        {showSticky && (
          <motion.div
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            exit={{ y: "110%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-asfalt/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl lg:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{p.name}</p>
                <p className="tabular text-[13px] text-beton-300">{size ? `Veličina ${size}` : "Izaberi veličinu"}</p>
              </div>
              <button onClick={addToCart} className="btn btn-primary">
                Dodaj u korpu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SizeAdvisor
        p={p}
        open={advisor}
        onClose={() => setAdvisor(false)}
        onPick={(s) => {
          setSize(s);
          setError(false);
        }}
      />
    </div>
  );
}
