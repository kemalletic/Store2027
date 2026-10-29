"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { useShop } from "@/lib/store";

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

/** Restores the persisted cart and runs smooth scrolling (off for reduced motion). */
export default function Providers() {
  const pathname = usePathname();

  useEffect(() => {
    useShop.persist.rehydrate();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis?.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // stop page scroll while a drawer or overlay is open
  const locked = useShop((s) => s.cartOpen || s.searchOpen || s.menuOpen);
  useEffect(() => {
    if (locked) lenis?.stop();
    else lenis?.start();
    document.documentElement.style.overflow = locked ? "hidden" : "";
  }, [locked]);

  useEffect(() => {
    if (!window.location.hash) lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
