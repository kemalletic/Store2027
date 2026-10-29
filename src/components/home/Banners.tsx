"use client";

import Link from "next/link";
import { useRef } from "react";

const BANNERS = [
  {
    href: "/kategorija/farmerke",
    name: "farmerke",
    title: "Savršen kroj za svaki dan.",
    cta: "Pogledaj farmerke",
  },
  {
    href: "/kategorija/trenerke",
    name: "trenerke",
    title: "Udobnost bez kompromisa.",
    cta: "Pogledaj trenerke",
  },
];

/** Two layers (wall with baked shadow, garment) that shift against each other. */
function DepthBanner({ b }: { b: (typeof BANNERS)[number] }) {
  const root = useRef<HTMLAnchorElement>(null);
  const fg = useRef<HTMLImageElement>(null);
  const bg = useRef<HTMLImageElement>(null);

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = root.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    fg.current!.style.transform = `translate3d(${x * -26}px, ${y * -14}px, 0) scale(1.06)`;
    bg.current!.style.transform = `translate3d(${x * 10}px, ${y * 6}px, 0) scale(1.06)`;
  };
  const onLeave = () => {
    fg.current!.style.transform = "translate3d(0,0,0) scale(1.06)";
    bg.current!.style.transform = "translate3d(0,0,0) scale(1.06)";
  };

  return (
    <Link ref={root} href={b.href} onPointerMove={onMove} onPointerLeave={onLeave} className="group relative block aspect-[14/10] overflow-hidden rounded-[4px] bg-beton-900 sm:aspect-[14/9]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={bg} src={`/banners/${b.name}-bg.jpg`} alt="" loading="lazy" className="absolute inset-0 size-full scale-[1.06] object-cover transition-transform duration-[900ms] ease-[var(--ease-out)]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={fg} src={`/banners/${b.name}-fg.webp`} alt="" loading="lazy" className="absolute inset-0 size-full scale-[1.06] object-cover transition-transform duration-[900ms] ease-[var(--ease-out)]" />
      <span className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/25 to-transparent" />
      <span className="absolute bottom-0 left-0 max-w-[60%] p-6 sm:p-10">
        <span className="display block text-[34px] sm:text-[48px] lg:text-[56px]" style={{ ["--wdth" as string]: 110 }}>
          {b.title}
        </span>
        <span className="btn btn-ghost mt-6 bg-black/20 backdrop-blur-sm group-hover:border-kreda">{b.cta}</span>
      </span>
    </Link>
  );
}

export default function Banners() {
  return (
    <section aria-label="Kolekcije" className="mx-auto grid max-w-[1440px] gap-3 px-4 pt-24 sm:px-6 md:grid-cols-2 lg:px-10">
      {BANNERS.map((b) => (
        <DepthBanner key={b.name} b={b} />
      ))}
    </section>
  );
}
