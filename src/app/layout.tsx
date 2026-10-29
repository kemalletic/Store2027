import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import Providers from "@/components/Providers";
import BoxFlightLayer from "@/components/BoxFlightLayer";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "BOX Adem Jeans | Muška odjeća",
    template: "%s | BOX",
  },
  description: "Farmerke, majice, trenerke, džemperi, prsluci, jakne, kaiševi i šorcevi. Dostava po cijeloj BiH za 24–48h, plaćanje pouzećem.",
};

export const viewport: Viewport = {
  themeColor: "#0d0f0e",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bs" className={archivo.variable}>
      <body>
        <Providers />
        <Header />
        <main id="sadrzaj">{children}</main>
        <Footer />
        <CartDrawer />
        <SearchOverlay />
        <BoxFlightLayer />
      </body>
    </html>
  );
}
