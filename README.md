# BOX Adem Jeans: online prodavnica 2027

Frontend online prodavnice muške odjeće (farmerke, trenerke, majice, džemperi, prsluci, jakne, kaiševi, šorcevi).
Dizajn i odluke su opisani u [PLAN.md](PLAN.md).

## Pokretanje

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
```

## Šta je unutra

- **Hero „Šipka”**: 3D betonska soba sa šipkom. Odjeća se povlači lijevo-desno, njiše se i sudara, hover okreće komad, klik ga otvara.
- **„Složi u kutiju”**: dodavanje u korpu presavije odjeću (shader), spakuje je u BOX kutiju i kutija odleti u ikonu korpe.
- **Denim lab**: 3D farmerke koje mijenjaju kroj (morph) i pranje (tekstura se preliva odozgo).
- **Proizvod**: 3D okretanje, fotografije sprijeda/straga, lupa za tkaninu, savjetnik za veličinu.
- **Katalog** s filterima u URL-u, korpa (ladica), pretraga (Ctrl K), lista želja, naplata (pouzeće/kartica), O nama, 404.

Svaka 3D funkcija ima običnu zamjenu: bez WebGL-a se prikazuju slike, a uz „smanji pokret” u sistemu nema fizike ni animacija.

## Slike i 3D odjeća

Sva odjeća je **napravljena kodom** (`src/three/`): obris kroja se „napuše” u mekani 3D komad, a tkanina, šavovi, džepovi i zakovice se iscrtavaju proceduralno.
Iz istih modela se renderuju i sve slike u `public/`:

```bash
npm run dev                  # u jednom terminalu
npm run render:images        # svi proizvodi, kategorije i baneri
npm run render:images jakna  # samo slike čije ime sadrži „jakna”
```

Skripta koristi Playwright. Kad stignu prave fotografije, dovoljno je zamijeniti fajlove u `public/products` (`<slug>-front.jpg`, `<slug>-back.jpg`).

## Struktura

| Putanja | Sadržaj |
|---|---|
| `src/lib/products.ts` | katalog proizvoda (test podaci), kategorije, pretraga |
| `src/lib/store.ts` | korpa i lista želja (Zustand, čuva se u browseru) |
| `src/three/` | 3D odjeća, tkanine, beton, hero, Denim lab, animacija kutije |
| `src/components/` | header, korpa, pretraga, kartice, stranice |
| `src/app/render/` | interna stranica za renderovanje slika (samo u razvoju) |

## Još nije povezano

- Backend i plaćanje: narudžbe, prijava i newsletter su za sada samo u browseru.
- Kontakt podaci radnje, prave fotografije i logo.
