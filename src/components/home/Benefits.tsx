const ITEMS = [
  { title: "Dostava za 24–48h", text: "Po cijeloj BiH. Besplatno za narudžbe od 100 KM." },
  { title: "Plaćanje pouzećem", text: "Platiš kuriru kad paket stigne, ili karticom online." },
  { title: "Besplatna zamjena veličine", text: "Ne odgovara broj? Šaljemo drugi, ti ne plaćaš dostavu." },
  { title: "Povrat u roku od 14 dana", text: "Bez objašnjavanja, novac vraćamo za 3 radna dana." },
];

export default function Benefits() {
  return (
    <section aria-label="Kupovina kod nas" className="mx-auto max-w-[1440px] px-4 py-24 sm:px-6 lg:px-10">
      <ul className="grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map((it, i) => (
          <li key={it.title} className="relative lg:px-8 lg:first:pl-0">
            {i > 0 && <span className="stitch-y absolute bottom-1 left-0 top-1 hidden opacity-30 lg:block" style={{ ["--stitch" as string]: "var(--kreda)" }} />}
            <h3 className="text-[18px] font-semibold">{it.title}</h3>
            <p className="mt-1.5 max-w-[34ch] text-[15px] text-beton-300">{it.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
