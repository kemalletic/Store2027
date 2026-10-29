import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[900px] flex-col justify-center px-4 pt-[var(--header-h)]">
      <p className="tabular text-[15px] text-beton-300">Greška 404</p>
      <h1 className="display mt-3 text-[52px] sm:text-[80px]" style={{ ["--wdth" as string]: 120 }}>
        Ova stranica nije na šipki.
      </h1>
      <p className="mt-4 max-w-[46ch] text-[17px] text-beton-300">Link je možda star ili proizvod više nije u ponudi. Pretraži ponudu ili se vrati na početnu.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-primary">
          Nazad na početnu
        </Link>
        <Link href="/kategorija/sve" className="btn btn-ghost">
          Svi proizvodi
        </Link>
      </div>
    </div>
  );
}
