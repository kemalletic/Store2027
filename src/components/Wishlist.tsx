"use client";

import Link from "next/link";
import { getProduct } from "@/lib/products";
import { useShop } from "@/lib/store";
import ProductCard from "./ProductCard";

export default function Wishlist() {
  const wishlist = useShop((s) => s.wishlist);
  const items = wishlist.map((s) => getProduct(s)).filter(Boolean);
  return (
    <div className="mx-auto min-h-[70vh] max-w-[1440px] px-4 pb-24 pt-[calc(var(--header-h)+40px)] sm:px-6 lg:px-10">
      <h1 className="display text-[52px] sm:text-[84px]" style={{ ["--wdth" as string]: 118 }}>
        Lista želja
      </h1>
      {items.length === 0 ? (
        <div className="mt-8">
          <p className="max-w-[44ch] text-[17px] text-beton-300">Ovdje se čuva sve što označiš srcem, da ga lakše nađeš kasnije.</p>
          <Link href="/kategorija/sve" className="btn btn-primary mt-6">
            Pogledaj proizvode
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <li key={p!.slug}>
              <ProductCard p={p!} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
