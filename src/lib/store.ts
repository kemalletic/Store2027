"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getProduct } from "./products";

export interface CartItem {
  slug: string;
  size: string;
  qty: number;
}

/** A request for the fold-into-box animation, from where the product is on screen. */
export interface BoxFlight {
  id: number;
  slug: string;
  from: { x: number; y: number; w: number; h: number };
}

interface ShopState {
  cart: CartItem[];
  wishlist: string[];
  cartOpen: boolean;
  searchOpen: boolean;
  menuOpen: boolean;
  flight: BoxFlight | null;
  /** Bumps whenever something lands in the cart, for the badge animation. */
  landed: number;
  add: (slug: string, size: string, from?: BoxFlight["from"]) => void;
  remove: (slug: string, size: string) => void;
  setQty: (slug: string, size: string, qty: number) => void;
  setSize: (slug: string, size: string, next: string) => void;
  clear: () => void;
  toggleWish: (slug: string) => void;
  setCartOpen: (v: boolean) => void;
  setSearchOpen: (v: boolean) => void;
  setMenuOpen: (v: boolean) => void;
  finishFlight: () => void;
}

let flightId = 0;

export const useShop = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      cartOpen: false,
      searchOpen: false,
      menuOpen: false,
      flight: null,
      landed: 0,
      add: (slug, size, from) => {
        const cart = [...get().cart];
        const hit = cart.find((i) => i.slug === slug && i.size === size);
        if (hit) hit.qty += 1;
        else cart.push({ slug, size, qty: 1 });
        if (from) set({ cart, flight: { id: ++flightId, slug, from } });
        else set({ cart, landed: get().landed + 1 });
      },
      remove: (slug, size) => set({ cart: get().cart.filter((i) => !(i.slug === slug && i.size === size)) }),
      setQty: (slug, size, qty) =>
        set({
          cart: get()
            .cart.map((i) => (i.slug === slug && i.size === size ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        }),
      setSize: (slug, size, next) => {
        const cart = get().cart;
        const target = cart.find((i) => i.slug === slug && i.size === next);
        const current = cart.find((i) => i.slug === slug && i.size === size);
        if (!current || size === next) return;
        if (target) {
          set({ cart: cart.filter((i) => i !== current).map((i) => (i === target ? { ...i, qty: i.qty + current.qty } : i)) });
        } else {
          set({ cart: cart.map((i) => (i === current ? { ...i, size: next } : i)) });
        }
      },
      clear: () => set({ cart: [] }),
      toggleWish: (slug) => {
        const w = get().wishlist;
        set({ wishlist: w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug] });
      },
      setCartOpen: (cartOpen) => set({ cartOpen, searchOpen: false, menuOpen: false }),
      setSearchOpen: (searchOpen) => set({ searchOpen, cartOpen: false, menuOpen: false }),
      setMenuOpen: (menuOpen) => set({ menuOpen }),
      finishFlight: () => set({ flight: null, landed: get().landed + 1 }),
    }),
    {
      name: "box-shop",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ cart: s.cart, wishlist: s.wishlist }),
      skipHydration: true,
    },
  ),
);

export function cartCount(cart: CartItem[]) {
  return cart.reduce((n, i) => n + i.qty, 0);
}

export function cartTotal(cart: CartItem[]) {
  return cart.reduce((n, i) => n + (getProduct(i.slug)?.price ?? 0) * i.qty, 0);
}

export const FREE_SHIPPING = 100;
export const SHIPPING_PRICE = 7;
