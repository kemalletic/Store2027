import Link from "next/link";
import { CATEGORIES, productsIn } from "@/lib/products";

export default function Categories() {
  return (
    <section aria-labelledby="kategorije" className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 lg:px-10">
      <h2 id="kategorije" className="sr-only">
        Kategorije
      </h2>
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 xl:grid-cols-8">
        {CATEGORIES.map((c) => (
          <li key={c.slug} className="w-[42vw] shrink-0 snap-start sm:w-auto">
            <Link href={`/kategorija/${c.slug}`} className="group relative block overflow-hidden rounded-[4px] bg-beton-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/categories/${c.slug}.jpg`}
                alt=""
                loading="lazy"
                className="aspect-[4/5] w-full object-cover transition-transform duration-[900ms] ease-[var(--ease-out)] group-hover:scale-[1.06]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span className="absolute inset-x-4 bottom-4">
                <span className="block text-[19px] font-semibold leading-tight">{c.name}</span>
                <span className="tabular text-[13px] text-kreda/70">{productsIn(c.slug).length} modela</span>
                <span className="stitch-x mt-2 block w-0 transition-[width] duration-500 ease-[var(--ease-out)] group-hover:w-full group-focus-visible:w-full" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
