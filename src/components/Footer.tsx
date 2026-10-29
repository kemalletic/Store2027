"use client";

import Link from "next/link";
import { useState } from "react";
import { CATEGORIES } from "@/lib/products";
import { Logo } from "./Header";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setState("error");
    setState("done");
  };

  return (
    <footer className="beton relative border-t border-white/[0.07]">
      <div className="mx-auto max-w-[1440px] px-4 pb-10 pt-16 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <h2 className="display max-w-[12ch] text-[44px] sm:text-[56px]" style={{ ["--wdth" as string]: 118 }}>
              Nova kolekcija prvo stiže u inbox.
            </h2>
            {state === "done" ? (
              <p className="mt-6 max-w-[40ch] text-[17px]" role="status">
                Prijavljen si. Prvi mail stiže kad izađe nova kolekcija, bez spama između.
              </p>
            ) : (
              <form onSubmit={submit} noValidate className="mt-6 max-w-[460px]">
                <label htmlFor="newsletter" className="mb-2 block text-[14px] text-beton-300">
                  Email adresa
                </label>
                <div className="flex gap-2">
                  <input
                    id="newsletter"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setState("idle");
                    }}
                    aria-invalid={state === "error"}
                    aria-describedby={state === "error" ? "newsletter-err" : undefined}
                    placeholder="ime@primjer.ba"
                    className="h-12 min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.04] px-5 text-[16px] outline-none placeholder:text-beton-600 focus:border-limeta"
                  />
                  <button className="btn btn-primary shrink-0">Prijavi me</button>
                </div>
                {state === "error" && (
                  <p id="newsletter-err" className="mt-2 text-[14px] text-greska">
                    Upiši email u obliku ime@domena.ba.
                  </p>
                )}
              </form>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h3 className="mb-4 text-[14px] text-beton-300">Kupovina</h3>
              <ul className="space-y-2.5 text-[15px]">
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/kategorija/${c.slug}`} className="hover:text-limeta">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-[14px] text-beton-300">Pomoć</h3>
              <ul className="space-y-2.5 text-[15px]">
                <li>
                  <Link href="/o-nama#dostava" className="hover:text-limeta">
                    Dostava
                  </Link>
                </li>
                <li>
                  <Link href="/o-nama#povrat" className="hover:text-limeta">
                    Zamjena i povrat
                  </Link>
                </li>
                <li>
                  <Link href="/o-nama#velicine" className="hover:text-limeta">
                    Tabela veličina
                  </Link>
                </li>
                <li>
                  <Link href="/racun" className="hover:text-limeta">
                    Praćenje narudžbe
                  </Link>
                </li>
                <li>
                  <Link href="/o-nama#kontakt" className="hover:text-limeta">
                    Kontakt
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-[14px] text-beton-300">Plaćanje</h3>
              <ul className="space-y-2.5 text-[15px]">
                <li>Pouzećem</li>
                <li>Visa i Mastercard</li>
                <li>Uplata na račun</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="stitch-x mt-16 opacity-25" style={{ ["--stitch" as string]: "var(--kreda)" }} />
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <Logo />
          <p className="text-[13px] text-beton-300">© 2027 BOX Adem Jeans. Sva prava zadržana.</p>
        </div>
      </div>
    </footer>
  );
}
