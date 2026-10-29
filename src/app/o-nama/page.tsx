import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "O nama", description: "Ko smo, kako šaljemo i kako funkcionišu zamjena i povrat." };

const SECTIONS = [
  {
    id: "dostava",
    title: "Dostava",
    body: ["Šaljemo brzom poštom na svaku adresu u BiH. Paket stiže za 24 do 48 sati od narudžbe.", "Dostava je 7 KM, a za narudžbe od 100 KM je besplatna. Kurir te zove prije nego što dođe."],
  },
  {
    id: "povrat",
    title: "Zamjena i povrat",
    body: [
      "Zamjena veličine je besplatna: javi nam se, kurir donosi novu veličinu i odmah preuzima staru.",
      "Povrat je moguć u roku od 14 dana. Odjeća treba biti nenošena i s etiketom. Novac vraćamo za 3 radna dana.",
    ],
  },
  {
    id: "velicine",
    title: "Veličine",
    body: [
      "Farmerke su označene obimom struka u inčima (28 do 38). Majice, trenerke i jakne idu od S do XXL.",
      "Na svakom proizvodu je savjetnik za veličinu i tabela mjera, a uz svaki kroj piše kako kroji.",
    ],
  },
  {
    id: "kontakt",
    title: "Kontakt",
    body: ["Na poruke odgovaramo radnim danom od 9 do 17h. Broj telefona i email radnje stoje i na svakoj potvrdi narudžbe."],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-[calc(var(--header-h)+48px)] sm:px-6">
      <h1 className="display max-w-[14ch] text-[52px] sm:text-[88px]" style={{ ["--wdth" as string]: 120 }}>
        Odjeća koja se nosi godinama.
      </h1>
      <div className="mt-10 grid gap-10 text-[18px] text-kreda/80 md:grid-cols-2">
        <p>BOX je radnja Adem Jeans: farmerke, trenerke, majice i jakne koje biramo po tome koliko dugo traju, a ne po tome šta je ove sezone u modi.</p>
        <p>Teži denim, gusti pamuk i šavovi koji drže. Svaki kroj nosimo i sami prije nego što uđe u ponudu, pa znamo kako sjedi i šta se desi nakon pranja.</p>
      </div>
      <div className="stitch-x my-16 opacity-50" />
      <div className="grid gap-12 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <h2 className="text-[24px] font-semibold">{s.title}</h2>
            {s.body.map((b) => (
              <p key={b} className="mt-3 max-w-[48ch] text-[16px] text-beton-300">
                {b}
              </p>
            ))}
          </section>
        ))}
      </div>
      <Link href="/kategorija/sve" className="btn btn-primary mt-16">
        Pogledaj ponudu
      </Link>
    </div>
  );
}
