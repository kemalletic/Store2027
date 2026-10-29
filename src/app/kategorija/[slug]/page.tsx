import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CATEGORIES, PRODUCTS, getCategory } from "@/lib/products";
import type { Product } from "@/lib/types";
import Catalog from "@/components/catalog/Catalog";

const SPECIAL: Record<string, { name: string; blurb: string; filter: (p: Product) => boolean }> = {
  sve: { name: "Svi proizvodi", blurb: "Cijela ponuda na jednom mjestu.", filter: () => true },
  novo: { name: "Nova kolekcija", blurb: "Komadi koji su upravo stigli na šipku.", filter: (p) => !!p.isNew },
  akcije: { name: "Akcije", blurb: "Snižene cijene dok ima zaliha.", filter: (p) => !!p.oldPrice },
};

export function generateStaticParams() {
  return [...CATEGORIES.map((c) => ({ slug: c.slug })), ...Object.keys(SPECIAL).map((slug) => ({ slug }))];
}

function resolve(slug: string) {
  const special = SPECIAL[slug];
  if (special) return { name: special.name, blurb: special.blurb, products: PRODUCTS.filter(special.filter) };
  const c = getCategory(slug);
  if (!c) return null;
  return { name: c.name, blurb: c.blurb, products: PRODUCTS.filter((p) => p.category === c.slug) };
}

export async function generateMetadata({ params }: PageProps<"/kategorija/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = resolve(slug);
  return r ? { title: r.name, description: r.blurb } : {};
}

export default function CategoryPage({ params }: PageProps<"/kategorija/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Category params={params} />
    </Suspense>
  );
}

async function Category({ params }: { params: PageProps<"/kategorija/[slug]">["params"] }) {
  const { slug } = await params;
  const r = resolve(slug);
  if (!r) notFound();
  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-[calc(var(--header-h)+40px)] sm:px-6 lg:px-10">
      <nav aria-label="Putanja" className="mb-6 text-[14px] text-beton-300">
        <Link href="/" className="hover:text-kreda">
          Početna
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-kreda" aria-current="page">
          {r.name}
        </span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[52px] sm:text-[84px]" style={{ ["--wdth" as string]: 118 }}>
          {r.name}
        </h1>
        <p className="max-w-[38ch] pb-2 text-[16px] text-beton-300">{r.blurb}</p>
      </div>
      <Suspense fallback={<div className="h-[60vh]" />}>
        <Catalog slugs={r.products.map((p) => p.slug)} isJeans={slug === "farmerke"} />
      </Suspense>
    </div>
  );
}
