import type { Metadata } from "next";
import Wishlist from "@/components/Wishlist";

export const metadata: Metadata = { title: "Lista želja" };

export default function WishlistPage() {
  return <Wishlist />;
}
