import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PRODUCTS, getProduct } from "@/lib/products";
import ProductView from "@/components/product/ProductView";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/proizvod/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  return p ? { title: `${p.name}, ${p.colorName}`, description: p.description } : {};
}

async function Product({ params }: { params: PageProps<"/proizvod/[slug]">["params"] }) {
  const { slug } = await params;
  const p = getProduct(slug);
  if (!p) notFound();
  return <ProductView slug={p.slug} />;
}

// the shell (header, layout) renders instantly; the product streams in
export default function ProductPage({ params }: PageProps<"/proizvod/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <Product params={params} />
    </Suspense>
  );
}
