"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { getProduct } from "@/lib/products";
import type { Fit, Product } from "@/lib/types";
import ProductCard from "../ProductCard";
import { ChevronIcon, CloseIcon } from "../icons";

const SORTS = [
  { id: "preporuka", label: "Preporučeno" },
  { id: "cijena-rastuce", label: "Cijena: od najniže" },
  { id: "cijena-opadajuce", label: "Cijena: od najviše" },
  { id: "novo", label: "Najnovije" },
] as const;

const PRICES = [
  { id: "do-50", label: "Do 50 KM", test: (p: number) => p <= 50 },
  { id: "50-100", label: "50 – 100 KM", test: (p: number) => p > 50 && p <= 100 },
  { id: "preko-100", label: "Preko 100 KM", test: (p: number) => p > 100 },
];

const FIT_LABEL: Record<Fit, string> = { slim: "Slim", tapered: "Tapered", regular: "Regular", relaxed: "Relaxed", loose: "Loose" };

type Key = "velicina" | "boja" | "kroj" | "cijena";

function useFilters() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = (k: Key) => sp.get(k)?.split(",").filter(Boolean) ?? [];
  const set = (k: Key | "sort", values: string[]) => {
    const next = new URLSearchParams(sp.toString());
    if (values.length) next.set(k, values.join(","));
    else next.delete(k);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };
  const toggle = (k: Key, v: string) => {
    const cur = get(k);
    set(k, cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };
  return { sp, get, set, toggle, clear: () => router.replace(pathname, { scroll: false }) };
}

function Options({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-[14px] text-beton-300">{title}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children, label }: { on: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className={`tabular flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors ${on ? "border-limeta bg-limeta text-limeta-ink" : "border-white/15 hover:border-white/50"}`}
    >
      {children}
    </button>
  );
}

export default function Catalog({ slugs, isJeans }: { slugs: string[]; isJeans: boolean }) {
  const products = useMemo(() => slugs.map((s) => getProduct(s)!), [slugs]);
  const f = useFilters();
  const [open, setOpen] = useState<Key | "sort" | "sheet" | null>(null);
  const bar = useRef<HTMLDivElement>(null);

  const sizes = useMemo(() => [...new Set(products.flatMap((p) => p.sizes))], [products]);
  const colors = useMemo(() => {
    const m = new Map<string, string>();
    products.forEach((p) => m.set(p.colorName, p.swatch));
    return [...m.entries()];
  }, [products]);
  const fits = useMemo(() => [...new Set(products.map((p) => p.garment.fit).filter(Boolean))] as Fit[], [products]);

  const sel = { velicina: f.get("velicina"), boja: f.get("boja"), kroj: f.get("kroj"), cijena: f.get("cijena") };
  const sort = f.sp.get("sort") ?? "preporuka";

  const list = useMemo(() => {
    let out: Product[] = products.filter(
      (p) =>
        (!sel.velicina.length || sel.velicina.some((s) => p.sizes.includes(s) && !p.soldOut?.includes(s))) &&
        (!sel.boja.length || sel.boja.includes(p.colorName)) &&
        (!sel.kroj.length || (p.garment.fit && sel.kroj.includes(p.garment.fit))) &&
        (!sel.cijena.length || sel.cijena.some((id) => PRICES.find((x) => x.id === id)?.test(p.price))),
    );
    if (sort === "cijena-rastuce") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "cijena-opadajuce") out = [...out].sort((a, b) => b.price - a.price);
    if (sort === "novo") out = [...out].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, f.sp]);

  const active: { k: Key; v: string; label: string }[] = [
    ...sel.kroj.map((v) => ({ k: "kroj" as Key, v, label: FIT_LABEL[v as Fit] ?? v })),
    ...sel.velicina.map((v) => ({ k: "velicina" as Key, v, label: `Veličina ${v}` })),
    ...sel.boja.map((v) => ({ k: "boja" as Key, v, label: v })),
    ...sel.cijena.map((v) => ({ k: "cijena" as Key, v, label: PRICES.find((x) => x.id === v)?.label ?? v })),
  ];

  useEffect(() => {
    if (!open || open === "sheet") return;
    const onDown = (e: MouseEvent) => !bar.current?.contains(e.target as Node) && setOpen(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const groups: { k: Key; title: string; show: boolean; body: React.ReactNode }[] = [
    {
      k: "kroj",
      title: "Kroj",
      show: isJeans && fits.length > 1,
      body: fits.map((v) => (
        <Chip key={v} on={sel.kroj.includes(v)} onClick={() => f.toggle("kroj", v)}>
          {FIT_LABEL[v]}
        </Chip>
      )),
    },
    {
      k: "velicina",
      title: "Veličina",
      show: true,
      body: sizes.map((v) => (
        <Chip key={v} on={sel.velicina.includes(v)} onClick={() => f.toggle("velicina", v)}>
          {v}
        </Chip>
      )),
    },
    {
      k: "boja",
      title: "Boja",
      show: colors.length > 1,
      body: colors.map(([name, hex]) => (
        <Chip key={name} on={sel.boja.includes(name)} onClick={() => f.toggle("boja", name)}>
          <span className="size-4 rounded-full border border-white/25" style={{ background: hex }} />
          {name}
        </Chip>
      )),
    },
    {
      k: "cijena",
      title: "Cijena",
      show: true,
      body: PRICES.map((x) => (
        <Chip key={x.id} on={sel.cijena.includes(x.id)} onClick={() => f.toggle("cijena", x.id)}>
          {x.label}
        </Chip>
      )),
    },
  ];

  const countLabel = list.length === 1 ? "1 proizvod" : `${list.length} proizvoda`;

  return (
    <div className="mt-10">
      <div ref={bar} className="sticky top-[var(--header-h)] z-30 -mx-4 border-b border-white/[0.07] bg-asfalt/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen("sheet")} className="flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-[14px] font-medium md:hidden">
            Filteri {active.length > 0 && <span className="tabular rounded-full bg-limeta px-1.5 text-[12px] text-limeta-ink">{active.length}</span>}
          </button>
          <div className="hidden items-center gap-2 md:flex">
            {groups
              .filter((g) => g.show)
              .map((g) => (
                <div key={g.k} className="relative">
                  <button
                    onClick={() => setOpen(open === g.k ? null : g.k)}
                    aria-expanded={open === g.k}
                    className={`flex h-10 items-center gap-1.5 rounded-full border px-4 text-[14px] font-medium transition-colors ${sel[g.k].length ? "border-kreda" : "border-white/15 hover:border-white/50"}`}
                  >
                    {g.title}
                    {sel[g.k].length > 0 && <span className="tabular text-beton-300">({sel[g.k].length})</span>}
                    <ChevronIcon size={16} style={{ transition: "transform .25s", transform: open === g.k ? "rotate(180deg)" : undefined }} />
                  </button>
                  <AnimatePresence>
                    {open === g.k && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-0 top-12 z-10 w-[340px] rounded-2xl border border-white/10 bg-beton-900 p-5 shadow-2xl"
                      >
                        <Options title={g.title}>{g.body}</Options>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="tabular hidden text-[14px] text-beton-300 sm:block" aria-live="polite">
              {countLabel}
            </span>
            <label className="flex items-center gap-2 text-[14px]">
              <span className="sr-only sm:not-sr-only sm:text-beton-300">Poredaj</span>
              <select value={sort} onChange={(e) => f.set("sort", e.target.value === "preporuka" ? [] : [e.target.value])} className="h-10 rounded-full border border-white/15 bg-beton-900 px-3 text-[14px]">
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {active.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {active.map((a) => (
              <button key={`${a.k}-${a.v}`} onClick={() => f.toggle(a.k, a.v)} className="flex h-8 items-center gap-1.5 rounded-full bg-white/[0.08] pl-3 pr-2 text-[13px] hover:bg-white/15" aria-label={`Ukloni filter ${a.label}`}>
                {a.label} <CloseIcon size={14} />
              </button>
            ))}
            <button onClick={f.clear} className="ml-1 text-[13px] text-beton-300 underline underline-offset-2 hover:text-kreda">
              Očisti sve
            </button>
          </div>
        )}
      </div>

      {list.length === 0 ? (
        <div className="py-24">
          <p className="display text-[36px]" style={{ ["--wdth" as string]: 110 }}>
            Ništa ne odgovara ovim filterima.
          </p>
          <p className="mt-3 text-beton-300">Ukloni neki od filtera ili pogledaj cijelu ponudu.</p>
          <button onClick={f.clear} className="btn btn-primary mt-6">
            Očisti filtere
          </button>
        </div>
      ) : (
        <motion.ul layout className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {list.map((p, i) => (
              <motion.li key={p.slug} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
                <ProductCard p={p} priority={i < 4} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {/* mobile filter sheet */}
      <AnimatePresence>
        {open === "sheet" && (
          <>
            <motion.div className="fixed inset-0 z-[70] bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Filteri"
              data-lenis-prevent
              className="fixed inset-x-0 bottom-0 z-[71] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-beton-900 px-5 pb-6 pt-3"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden />
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-[20px] font-semibold">Filteri</h2>
                <button onClick={f.clear} className="text-[14px] text-beton-300 underline">
                  Očisti sve
                </button>
              </div>
              <div className="space-y-7">
                {groups
                  .filter((g) => g.show)
                  .map((g) => (
                    <Options key={g.k} title={g.title}>
                      {g.body}
                    </Options>
                  ))}
              </div>
              <button onClick={() => setOpen(null)} className="btn btn-primary sticky bottom-0 mt-8 w-full">
                Prikaži {countLabel}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
