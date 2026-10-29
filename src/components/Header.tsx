"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES } from "@/lib/products";
import { cartCount, useShop } from "@/lib/store";
import { BoxIcon, ChevronIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "./icons";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="display text-[26px] tracking-[-0.01em]" style={{ ["--wdth" as string]: 125 }}>
        BOX
      </span>
      <span className="mt-[3px] text-[9.5px] font-semibold tracking-[0.32em] text-beton-300">ADEM JEANS</span>
    </span>
  );
}

const NAV = [
  { href: "/kategorija/novo", label: "Novo" },
  { href: "/kategorija/farmerke", label: "Farmerke" },
  { href: "/kategorija/akcije", label: "Akcije" },
  { href: "/o-nama", label: "O nama" },
];

export default function Header() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const lastY = useRef(0);
  const { cart, wishlist, landed, setCartOpen, setSearchOpen, menuOpen, setMenuOpen } = useShop();
  const count = cartCount(cart);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // hide while reading downwards, come back as soon as the user scrolls up
      setHidden(y > 320 && y > lastY.current + 4);
      if (y < lastY.current - 4 || y < 320) setHidden(false);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  // close the mega menu when the route changes
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setShopOpen(false);
  }

  const solid = scrolled || !overHero || shopOpen;

  return (
    <>
      <a href="#sadrzaj" className="sr-only-focusable fixed left-4 top-3 z-[80] rounded-full bg-limeta px-4 py-2 text-sm font-semibold text-limeta-ink">
        Preskoči na sadržaj
      </a>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-[var(--ease-out)] ${hidden && !shopOpen ? "-translate-y-full" : ""} ${
          solid ? "border-b border-white/[0.07] bg-asfalt/85 backdrop-blur-xl" : "border-b border-transparent"
        }`}
        onMouseLeave={() => setShopOpen(false)}
      >
        <div className="mx-auto flex h-[var(--header-h)] max-w-[1440px] items-center gap-6 px-4 sm:px-6 lg:px-10">
          <button className="-ml-2 grid size-11 place-items-center rounded-full lg:hidden" aria-label="Otvori meni" onClick={() => setMenuOpen(true)}>
            <MenuIcon />
          </button>
          <Link href="/" aria-label="BOX Adem Jeans, početna" className="shrink-0" onClick={() => setMenuOpen(false)}>
            <Logo />
          </Link>

          <nav aria-label="Glavna navigacija" className="ml-8 hidden items-center gap-1 lg:flex">
            <button
              className={`flex h-11 items-center gap-1 rounded-full px-4 text-[14.5px] font-medium transition-colors hover:text-white ${shopOpen ? "text-white" : "text-kreda/80"}`}
              aria-expanded={shopOpen}
              aria-controls="meni-kategorije"
              onClick={() => setShopOpen((v) => !v)}
              onMouseEnter={() => setShopOpen(true)}
            >
              Muškarci <ChevronIcon size={16} style={{ transition: "transform .3s", transform: shopOpen ? "rotate(180deg)" : undefined }} />
            </button>
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`relative flex h-11 items-center rounded-full px-4 text-[14.5px] font-medium transition-colors hover:text-white ${active ? "text-white" : "text-kreda/80"}`}
                  aria-current={active ? "page" : undefined}
                  onMouseEnter={() => setShopOpen(false)}
                >
                  {n.label}
                  {active && <span className="stitch-x absolute inset-x-4 bottom-1.5" />}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden h-11 w-[260px] items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 text-left text-[14px] text-beton-300 transition-colors hover:border-white/25 md:flex"
            >
              <SearchIcon size={18} />
              <span className="flex-1">Pretraži proizvode</span>
              <kbd className="rounded-md border border-white/10 px-1.5 text-[11px] text-beton-300">Ctrl K</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} className="grid size-11 place-items-center rounded-full md:hidden" aria-label="Pretraga">
              <SearchIcon />
            </button>
            <Link href="/racun" className="hidden size-11 place-items-center rounded-full sm:grid" aria-label="Moj račun">
              <UserIcon />
            </Link>
            <Link href="/lista-zelja" className="relative grid size-11 place-items-center rounded-full" aria-label={`Lista želja, ${wishlist.length === 1 ? "1 proizvod" : `${wishlist.length} proizvoda`}`}>
              <HeartIcon />
              {wishlist.length > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-limeta" />}
            </Link>
            <button id="cart-target" onClick={() => setCartOpen(true)} className="relative grid size-11 place-items-center rounded-full" aria-label={`Korpa, ${count === 1 ? "1 proizvod" : `${count} proizvoda`}`}>
              <motion.span key={landed} initial={landed ? { scale: 1.35, rotate: -8 } : false} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 500, damping: 14 }}>
                <BoxIcon />
              </motion.span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="tabular absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-limeta px-1 text-[10.5px] font-bold text-limeta-ink"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {shopOpen && (
            <motion.div
              id="meni-kategorije"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-white/[0.06]"
            >
              <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_1fr_1.2fr] gap-10 px-10 py-9">
                <div>
                  <p className="mb-4 text-[13px] text-beton-300">Kategorije</p>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
                    {CATEGORIES.map((c) => (
                      <li key={c.slug}>
                        <Link href={`/kategorija/${c.slug}`} className="group flex items-center gap-2 py-1.5 text-[17px] font-medium hover:text-limeta">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-4 text-[13px] text-beton-300">Izdvojeno</p>
                  <ul className="space-y-1">
                    <li>
                      <Link href="/kategorija/novo" className="block py-1.5 text-[17px] font-medium hover:text-limeta">
                        Nova kolekcija
                      </Link>
                    </li>
                    <li>
                      <Link href="/kategorija/akcije" className="block py-1.5 text-[17px] font-medium hover:text-limeta">
                        Na akciji
                      </Link>
                    </li>
                    <li>
                      <Link href="/#denim-lab" className="block py-1.5 text-[17px] font-medium hover:text-limeta">
                        Pronađi svoj kroj farmerki
                      </Link>
                    </li>
                    <li>
                      <Link href="/kategorija/sve" className="block py-1.5 text-[17px] font-medium hover:text-limeta">
                        Svi proizvodi
                      </Link>
                    </li>
                  </ul>
                </div>
                <Link href="/kategorija/farmerke" className="group relative block overflow-hidden rounded-[4px] bg-beton-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/categories/farmerke.jpg" alt="" className="h-[190px] w-full object-cover object-[50%_30%] transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]" />
                  <span className="absolute bottom-4 left-5 text-[19px] font-semibold">Farmerke od 79,90 KM</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="beton fixed inset-0 z-[60] flex flex-col lg:hidden"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            exit={{ clipPath: "inset(0 100% 0 0)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="Meni"
            data-lenis-prevent
          >
            <div className="flex h-[var(--header-h)] items-center justify-between px-4">
              <Logo />
              <button className="grid size-11 place-items-center rounded-full" aria-label="Zatvori meni" onClick={() => setMenuOpen(false)}>
                <CloseIcon />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-5 pb-10 pt-4" aria-label="Kategorije">
              <ul>
                {CATEGORIES.map((c, i) => (
                  <motion.li key={c.slug} initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.12 + i * 0.03 }}>
                    <Link href={`/kategorija/${c.slug}`} onClick={() => setMenuOpen(false)} className="display block py-2.5 text-[34px]" style={{ ["--wdth" as string]: 112 }}>
                      {c.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="stitch-x my-6 opacity-60" />
              <ul className="space-y-1 text-[18px]">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} onClick={() => setMenuOpen(false)} className="block py-2">
                      {n.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/racun" onClick={() => setMenuOpen(false)} className="block py-2">
                    Moj račun
                  </Link>
                </li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
