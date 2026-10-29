"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatKM, getProduct, imageFor } from "@/lib/products";
import { FREE_SHIPPING, SHIPPING_PRICE, cartTotal, useShop } from "@/lib/store";
import { ShippingProgress } from "../CartDrawer";
import { CheckIcon } from "../icons";

type Field = "ime" | "prezime" | "telefon" | "email" | "adresa" | "grad" | "postanski";

const FIELDS: { id: Field; label: string; type?: string; auto: string; half?: boolean; hint?: string }[] = [
  { id: "ime", label: "Ime", auto: "given-name", half: true },
  { id: "prezime", label: "Prezime", auto: "family-name", half: true },
  { id: "telefon", label: "Broj telefona", type: "tel", auto: "tel", hint: "Kurir te zove prije dostave." },
  { id: "email", label: "Email", type: "email", auto: "email", hint: "Na ovu adresu šaljemo potvrdu i broj za praćenje." },
  { id: "adresa", label: "Ulica i broj", auto: "street-address" },
  { id: "grad", label: "Grad", auto: "address-level2", half: true },
  { id: "postanski", label: "Poštanski broj", auto: "postal-code", half: true },
];

function validate(v: Record<Field, string>) {
  const e: Partial<Record<Field, string>> = {};
  if (!v.ime.trim()) e.ime = "Upiši ime.";
  if (!v.prezime.trim()) e.prezime = "Upiši prezime.";
  if (!/^\+?[\d\s/-]{8,}$/.test(v.telefon)) e.telefon = "Upiši broj u obliku 061 234 567.";
  if (!/^\S+@\S+\.\S+$/.test(v.email)) e.email = "Upiši email u obliku ime@domena.ba.";
  if (!v.adresa.trim()) e.adresa = "Upiši ulicu i kućni broj.";
  if (!v.grad.trim()) e.grad = "Upiši grad.";
  if (!/^\d{5}$/.test(v.postanski)) e.postanski = "Poštanski broj ima 5 cifara, npr. 71000.";
  return e;
}

export default function Checkout() {
  const { cart, clear } = useShop();
  const [values, setValues] = useState<Record<Field, string>>({ ime: "", prezime: "", telefon: "", email: "", adresa: "", grad: "", postanski: "" });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [pay, setPay] = useState<"pouzece" | "kartica">("pouzece");
  const [done, setDone] = useState<string | null>(null);
  const subtotal = cartTotal(cart);
  const shipping = subtotal >= FREE_SHIPPING || subtotal === 0 ? 0 : SHIPPING_PRICE;
  const total = subtotal + shipping + (pay === "pouzece" && subtotal > 0 ? 2 : 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`f-${first}`)?.focus();
      return;
    }
    setDone(`BX-${Math.floor(100000 + Math.random() * 899999)}`);
    clear();
  };

  if (done) {
    return (
      <div className="on-light min-h-[80vh] bg-kreda pt-[calc(var(--header-h)+80px)] text-tinta">
        <div className="mx-auto max-w-[640px] px-4 pb-24">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className="grid size-16 place-items-center rounded-full bg-limeta">
            <CheckIcon size={30} />
          </motion.div>
          <h1 className="display mt-8 text-[48px] sm:text-[64px]" style={{ ["--wdth" as string]: 115 }}>
            Narudžba je primljena.
          </h1>
          <p className="mt-4 text-[17px]">
            Broj narudžbe <strong className="tabular">{done}</strong>. Potvrdu smo poslali na {values.email}. Kurir te zove na {values.telefon} prije dostave.
          </p>
          <Link href="/" className="btn btn-ink mt-8">
            Nazad na početnu
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="on-light min-h-[80vh] bg-kreda pt-[calc(var(--header-h)+80px)] text-tinta">
        <div className="mx-auto max-w-[640px] px-4 pb-24">
          <h1 className="display text-[48px]" style={{ ["--wdth" as string]: 115 }}>
            Korpa je prazna.
          </h1>
          <p className="mt-3 text-[17px]">Dodaj nešto u korpu pa se vrati ovdje da završiš kupovinu.</p>
          <Link href="/kategorija/sve" className="btn btn-ink mt-8">
            Pogledaj proizvode
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="on-light bg-kreda pt-[calc(var(--header-h)+40px)] text-tinta">
      <form onSubmit={submit} noValidate className="mx-auto grid max-w-[1200px] gap-12 px-4 pb-24 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="display text-[44px] sm:text-[56px]" style={{ ["--wdth" as string]: 115 }}>
            Plaćanje
          </h1>
          <p className="mt-2 text-[15px] text-tinta/65">Bez registracije. Treba nam samo adresa za dostavu.</p>

          <fieldset className="mt-10">
            <legend className="mb-4 text-[18px] font-semibold">Dostava</legend>
            <div className="grid grid-cols-2 gap-x-3 gap-y-4">
              {FIELDS.map((f) => (
                <div key={f.id} className={f.half ? "col-span-1" : "col-span-2"}>
                  <label htmlFor={`f-${f.id}`} className="mb-1.5 block text-[14px] font-medium">
                    {f.label}
                  </label>
                  <input
                    id={`f-${f.id}`}
                    type={f.type ?? "text"}
                    autoComplete={f.auto}
                    value={values[f.id]}
                    onChange={(e) => {
                      setValues({ ...values, [f.id]: e.target.value });
                      if (errors[f.id]) setErrors({ ...errors, [f.id]: undefined });
                    }}
                    aria-invalid={!!errors[f.id]}
                    aria-describedby={errors[f.id] ? `e-${f.id}` : f.hint ? `h-${f.id}` : undefined}
                    className={`h-12 w-full rounded-[6px] border bg-white px-4 text-[16px] outline-none transition-colors focus:border-tinta ${errors[f.id] ? "border-[#c2410c]" : "border-black/15"}`}
                  />
                  {errors[f.id] ? (
                    <p id={`e-${f.id}`} className="mt-1.5 text-[13px] text-[#b4380a]">
                      {errors[f.id]}
                    </p>
                  ) : (
                    f.hint && (
                      <p id={`h-${f.id}`} className="mt-1.5 text-[13px] text-tinta/55">
                        {f.hint}
                      </p>
                    )
                  )}
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-10">
            <legend className="mb-4 text-[18px] font-semibold">Način plaćanja</legend>
            <div className="grid gap-3">
              {(
                [
                  ["pouzece", "Pouzećem", "Plaćaš kuriru gotovinom ili karticom kad paket stigne. Naknada 2 KM."],
                  ["kartica", "Karticom online", "Visa, Mastercard i Maestro. Plaćanje je zaštićeno."],
                ] as const
              ).map(([id, label, text]) => (
                <label key={id} className={`flex cursor-pointer gap-4 rounded-xl border-2 bg-white p-4 transition-colors ${pay === id ? "border-tinta" : "border-transparent"}`}>
                  <input type="radio" name="placanje" value={id} checked={pay === id} onChange={() => setPay(id)} className="mt-1 size-4 accent-[var(--tinta)]" />
                  <span>
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-[14px] text-tinta/65">{text}</span>
                  </span>
                </label>
              ))}
            </div>
            <AnimatePresence>
              {pay === "kartica" && (
                <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden pt-3 text-[14px] text-tinta/65">
                  Nakon potvrde narudžbe otvara se sigurna stranica banke za unos kartice.
                </motion.p>
              )}
            </AnimatePresence>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h)+40px)] lg:self-start">
          <div className="rounded-2xl bg-white p-6">
            <h2 className="mb-5 text-[18px] font-semibold">Tvoja narudžba</h2>
            <ul className="space-y-4">
              {cart.map((i) => {
                const p = getProduct(i.slug)!;
                return (
                  <li key={`${i.slug}-${i.size}`} className="flex gap-4">
                    <span className="relative w-16 shrink-0 overflow-hidden rounded-[4px] bg-kreda">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageFor(p.slug)} alt="" className="aspect-[3/4] w-full object-cover" />
                      <span className="tabular absolute -right-0 -top-0 grid h-5 min-w-5 place-items-center rounded-bl-md bg-tinta px-1 text-[11px] font-bold text-kreda">{i.qty}</span>
                    </span>
                    <span className="flex-1">
                      <span className="block font-medium">{p.name}</span>
                      <span className="block text-[13px] text-tinta/60">
                        {p.colorName}, veličina {i.size}
                      </span>
                    </span>
                    <span className="tabular font-semibold">{formatKM(p.price * i.qty)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6">
              <ShippingProgress total={subtotal} tone="light" />
            </div>
            <dl className="tabular mt-6 space-y-2 border-t border-black/10 pt-5 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-tinta/65">Proizvodi</dt>
                <dd>{formatKM(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tinta/65">Dostava</dt>
                <dd>{shipping ? formatKM(shipping) : "Besplatno"}</dd>
              </div>
              {pay === "pouzece" && (
                <div className="flex justify-between">
                  <dt className="text-tinta/65">Naknada za pouzeće</dt>
                  <dd>{formatKM(2)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-black/10 pt-3 text-[19px] font-semibold">
                <dt>Ukupno</dt>
                <dd>{formatKM(total)}</dd>
              </div>
            </dl>
            <button className="btn btn-ink mt-6 h-14 w-full text-[16px]">{pay === "pouzece" ? "Naruči i plati pouzećem" : "Naruči i plati karticom"}</button>
            <p className="mt-3 text-center text-[13px] text-tinta/55">Narudžbu možeš otkazati telefonom dok ne bude poslana.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}
