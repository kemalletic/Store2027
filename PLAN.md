# BOX — Adem Jeans · Plan frontenda za 2027.

Prijedlog dizajna i tehnologije za online prodavnicu muške odjeće (farmerke, majice, trenerke, džemperi, prsluci, jakne, šorcevi, kaiševi).
Ovaj dokument je za čitanje i odobravanje prije nego što se napiše prva linija koda.

---

## 1. Šta sam analizirao

### 1.1 Video (LASTDEPT, sneaker store)

Šta taj sajt radi dobro i zašto djeluje "premium":

| Šta se vidi | Zašto radi | Šta preuzimamo za odjeću |
|---|---|---|
| Patike stoje na **svijetlećim akrilnim policama**, 2 reda po 5, kao u fizičkoj radnji | Proizvod izgleda kao fizički predmet u prostoru, ne kao sličica u gridu | Odjeća ne stoji na polici — **visi na šipki**. Naš ekvivalent je 3D vješalica (vidi 3.1) |
| Klik na patiku → patika se **uvećava i "izlazi" sa police** u detaljni prikaz, susjedne patike ostaju vidljive sa strane | Kontinuitet: korisnik nikad ne izgubi orijentaciju, nema "skoka" na novu stranicu | Isti princip: odjevni predmet skida se s vješalice i dolazi pred kameru (shared-element tranzicija) |
| Na detalju: naziv (GRADE 10), cijena (€150), padajući izbor veličine (EU 38–47), jedno dugme "dodaj" | Minimalno, samo ono što treba za kupovinu | Zadržavamo minimalizam, ali dodajemo ono što je za odjeću bitno: kroj, materijal, savjetnik za veličinu |
| Isti sajt na telefonu i na monitoru, sinhronizovano | Dobar responsive; telefon nije "smanjena" verzija nego jednako dobar | Mobile-first — većina kupaca u BiH kupuje s telefona |
| Mračna scena, topla svjetla, proizvod je jedini izvor boje | Fokus je 100% na proizvodu | Kod nas: tamni beton, proizvod i limeta su jedina boja |

Šta **ne** preuzimamo: generički mali tekst i sitne kontrole (na videu su skoro nečitljive), te zavisnost od 3D-a za osnovnu kupovinu — kod nas se svaka kupovina mora moći obaviti i bez 3D-a.

### 1.2 Slika (paleta i postojeći dizajn "BOX Adem Jeans")

Boje izvučene direktno iz slike (pikselski uzorci):

| Uzorak | Hex |
|---|---|
| Pozadina headera/sekcija | `#0C0A0D` / `#0E100F` |
| Limeta (tekst "TRAJE.") | `#E2FB50` |
| Svijetla kartica proizvoda | `#F0F1F2` |
| Tamni tekst na kartici | `#272526` |
| Polje pretrage / sivi beton | `#3A3839` |
| Tamni banner | `#232626` |

Iskrena ocjena slike: kompozicija je solidna i fotografija (beton, brutalistička arhitektura, prirodno svjetlo) je **najjača stvar na njoj** — to je identitet. Ali nekoliko elemenata danas odmah odaje "template / AI generisano":

- jedna riječ u headlineu obojena drugačije ("STIL KOJI **TRAJE.**")
- mali razmaknuti natpis velikim slovima iznad naslova ("NOVA KOLEKCIJA 2026")
- brojevi slajdova 01 / 02 / 03 (nisu stvarni redoslijed)
- rukopisni font "Men's Collection" preko slike
- strelica "→" na svakom dugmetu i kartici
- crno + jedna kisela limeta, bez ikakvog trećeg materijala

Paletu zadržavamo (to je tvoja odluka i ima smisla za brend), ali je činimo **našom** tako što je vežemo za materijale iz svijeta farmerki i betona — vidi poglavlje 2.

---

## 2. Dizajnerski koncept: "Beton i šav"

Jedna rečenica: **BOX je betonska kutija u kojoj visi odjeća, a limeta je konac kojim je sve prošiveno.**

Tri ideje iz stvarnog svijeta farmerki nose cijeli dizajn:

1. **Kutija (BOX)** — ime brenda doslovno postaje prostor. Hero je 3D betonska kutija/soba, a svaki proizvod dodan u korpu se **složi u kutiju**.
2. **Kontrastni šav** — prave farmerke imaju kontrastni (najčešće žuto-narandžasti) konac. Kod nas je taj konac limeta. Razdjelnici, fokus-okviri, progress i linije su **isprekidani "šav"** (stitch), a ne obične tanke linije.
3. **Etiketa / visi-kartica (hang tag)** — cijena i veličina žive na kartončiću koji visi na proizvodu, kao u radnji. To je naš oblik "badge-a" i cijene.

### 2.1 Boje (tokeni)

| Token | Hex | Uloga |
|---|---|---|
| `asfalt` | `#0D0F0E` | Osnovna pozadina (zadržava blagi zeleni ton iz slike, nije neutralno #111) |
| `beton-900` | `#1C1F1F` | Površine, header nakon skrola, ladice (drawer) |
| `beton-600` | `#3A3839` | Polja, neaktivne kontrole, ivice |
| `beton-300` | `#9A9794` | Sekundarni tekst na tamnom |
| `kreda` | `#F0F1F2` | Kartice proizvoda, svijetle sekcije (checkout) |
| `tinta` | `#272526` | Tekst na svijetlom |
| `limeta` | `#E2FB50` | Signal: glavna akcija, šav, fokus, "novo", popust |
| `indigo` *(samo iz fotografije)* | ~`#2E3E5C` | Ne koristi se u UI-ju — dolazi isključivo iz denima na fotografijama i 3D modelima |

Pravila:
- Limeta pokriva **najviše ~5% ekrana**. Ako je svuda, ništa nije važno.
- Limeta **nikad kao tekst na svijetloj pozadini** (`kreda`) — kontrast pada ispod WCAG AA. Na svijetlom: limeta samo kao pozadina s tamnim tekstom.
- Beton nije ravna boja: suptilna proceduralna tekstura betona (šum + pore) u pozadini velikih površina, generisana shaderom ili jednim malim SVG noise filterom — to je razlika između "crne stranice" i "betonske sobe".

### 2.2 Tipografija

Jedna porodica, dvije uloge: **Archivo** (Google Fonts, besplatan, variable, ima osu širine `wdth` 62–125 i pune bosanske znakove č ć š ž đ).

| Uloga | Postavka |
|---|---|
| Display (naslovi heroja, sekcija) | Archivo, `wdth` 125 (Expanded), težina 800–900, uski prored 0.9, blago negativni razmak |
| Naslovi proizvoda, cijene | Archivo, `wdth` 100, 600 |
| Tekst, UI | Archivo, `wdth` 100, 400/500, 16px osnova, prored 1.5, linija max ~70 znakova |
| Brojke (cijene, veličine) | Archivo s `tabular-nums` — cijene se poravnavaju u koloni |

Skala (omjer ~1.25, kratko): 12 · 14 · 16 · 20 · 25 · 31 · 39 · 49 · 61 · 76 · 95 · 120px (display na desktopu).

**Tipografija kao aktivni element — "stretch denim":** display naslovi koriste osu širine. Dok skrolaš ili povlačiš, naslov se **rasteže i skuplja** kao stretch materijal (wdth 100 → 125), umjesto da se jedna riječ boji limetom. To je potpis brenda koji niko drugi nema, a direktno dolazi iz proizvoda.

Bez: natpisa VELIKIM SLOVIMA iznad svakog naslova, rukopisnog fonta, monospace etiketa.

### 2.3 Oblik i rubovi

Hijerarhija zaobljenja (ne jedan radius za sve):
- Kartice proizvoda: 4px (skoro oštro, kao papir/karton)
- Dugmad: puna "pill" forma — kao na videu, lako za palac
- Hang-tag etikete: zarezan ugao + rupica (SVG maska) — prepoznatljiv oblik
- Modali/ladice: 0 na strani uz ivicu ekrana, 16px na slobodnoj strani

Sjene: gotovo nikakve. Dubinu daju svjetlo i 3D scena, ne sive sjene ispod kartica.

---

## 3. Ključne interakcije (gdje trošimo "wow")

Princip: **hrabrost na tri mjesta, sve ostalo mirno i brzo.** Sajt na kojem se sve animira djeluje jeftino i umara; sajt na kojem tri stvari izgledaju kao da ih nikad nisi vidio — pamti se.

### 3.1 Hero: "Šipka" (glavni potpis)

3D betonska kutija (soba). Kroz nju ide čelična šipka na kojoj visi 6–8 izdvojenih komada na vješalicama.

```
┌──────────────────────────────────────────────────────────────┐
│ BOX        Muškarci  Novo  Brendovi  Akcije     [⌕]  ♡  ▢ 2  │
├──────────────────────────────────────────────────────────────┤
│  ░░░░░░░░░░░░░░░ betonski zid, mekano svjetlo ░░░░░░░░░░░░░░ │
│  ════════╤═══════╤═══════╤═══════╤═══════╤══════════════════ │ ← šipka
│        ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐                 │
│        │jak│   │džm│   │maj│   │prs│   │trn│   ← odjeća      │
│        │na │   │per│   │ica│   │luk│   │erk│     na          │
│        └───┘   └───┘   └─◇─┘   └───┘   └───┘     vješalicama │
│                       hang tag: Jakna Premium · 129,90 KM    │
│  Stil koji traje.                                            │
│  Farmerke, majice, trenerke, jakne i više.                   │
│  [ Pogledaj kolekciju ]           ⟵ povuci ili skrolaj ⟶      │
└──────────────────────────────────────────────────────────────┘
```

Ponašanje:
- **Povlačenje mišem/prstom ili skrol** pomjera odjeću duž šipke s inercijom — kao kad prebiraš po stalku u radnji. Vješalice se blago **zaljuljaju** (fizika), komadi se lagano dotiču.
- **Hover/fokus** na komad: okrene se par stepeni prema kameri, hang-tag se zanjiše i pokaže naziv i cijenu.
- **Klik**: komad se skida s vješalice, leti prema kameri i rotira — i ta ista animacija **postaje** stranica proizvoda (bez bijelog ekrana između). To je direktan prevod efekta s videa na odjeću.
- Svjetlo u sobi prati kursor kao reflektor (diskretno).
- Naslov "Stil koji traje." koristi stretch-efekat (2.2) dok se šipka pomjera.
- Tastatura: strelice lijevo/desno pomjeraju komade, Enter otvara. Screen reader dobija običnu listu proizvoda.

### 3.2 "Složi u kutiju" (dodavanje u korpu)

Klik na **Dodaj u korpu** → komad se u 3D-u **presavije** (rukavi, pa po pola — kao u radnji), padne u kartonsku BOX kutiju, poklopac se zatvori, kutija odleti u ikonu korpe i broj se poveća. Traje ~900ms, može se preskočiti, i nikad ne blokira klik dalje.

Zašto: ime brenda postaje mikro-interakcija koju će ljudi snimati i dijeliti. Korpa (ladica sa strane) prikazuje proizvode kao male kutije s etiketom.

Bez WebGPU/WebGL podrške ili uz "reduced motion": slika proizvoda se smanji u ikonu korpe (jednostavno, isto značenje).

### 3.3 "Denim lab" — biraj kroj (3D koji je stvarno koristan)

Sekcija na početnoj i na stranici farmerki: jedan 3D model farmerki u centru.

```
┌──────────────────────────────────────────────────────────────┐
│  Pronađi svoj kroj                                           │
│                                                              │
│   Kroj:  ( Slim ) ( Regular ) ( Relaxed ) ( Loose )          │
│                       ┌────────┐                             │
│                       │  3D    │   Pranje:  ● ● ● ●          │
│                       │farmerke│            svijetlo → crno  │
│                       │ morph  │                             │
│                       └────────┘   Struk  ▬▬▬▬○▬▬  srednji    │
│   - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  │ ← šav
│   12 modela u ovom kroju     [ Prikaži farmerke Regular ]     │
└──────────────────────────────────────────────────────────────┘
```

- Klik na kroj → nogavice se **glatko transformišu** (morph targets) iz uskog u širi kroj.
- Klik na pranje → mijenja se tekstura denima (svijetlo, srednje, tamno, crno).
- Dugme vodi na filtriran katalog. Ovo je 3D koji **pomaže odluci**, ne samo ukras.
- Kasnije isto za trenerke (jogger / ravne / široke).

### 3.4 Mirni dijelovi (namjerno bez spektakla)

- Katalog, filteri, korpa, checkout: brzo, jasno, bez 3D-a. Animacije samo kao odgovor na radnju (otvaranje filtera, dodavanje, potvrda).
- Banneri (Farmerke / Trenerke sa slike): fotografija s **depth-mapom** — na pomak miša ili nagib telefona slika dobije blagu dubinu (2.5D parallax shader). Jedan efekat, bez "fade-in" na svakoj sekciji.

---

## 4. Stranice

### 4.1 Početna

Redoslijed (od vrha):
1. **Hero — Šipka** (3.1)
2. **Kategorije** — red fotografija kao na slici (Farmerke, Trenerke, Majice, Džemperi, Prsluci, Jakne, Kaiševi, Šorcevi). Na mobitelu horizontalni snap-skrol. Bez strelica na svakoj kartici; cijela kartica je klikabilna.
3. **Izdvojeni proizvodi** — grid s filterima (Svi, Farmerke, Majice…). Kartica: fotografija na `kreda` pozadini, druga fotografija pri hoveru (korisno, standard u modi), **brzi izbor veličine** pri hoveru na desktopu, ♡.
4. **Denim lab** (3.3)
5. **Dva banera** — Farmerke / Trenerke (depth efekat)
6. **Zašto kupiti kod nas** — samo stvarne stvari za BiH: dostava 24–48h, plaćanje pouzećem, zamjena veličine besplatno, povrat 14 dana. Kratko, bez ikona za ukras.
7. **Footer** — newsletter, kontakt, radnja (adresa + mapa ako postoji fizička), linkovi, načini plaćanja.

### 4.2 Katalog (kategorija)

```
┌──────────────────────────────────────────────────────────────┐
│ Farmerke                                    148 proizvoda    │
│ [Kroj ▾] [Veličina ▾] [Pranje ▾] [Cijena ▾] [Brend ▾]  Sort ▾│
│ Aktivno: Regular ✕  32 ✕                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                          │
│ │      │ │      │ │ NOVO │ │ −20% │                          │
│ │ foto │ │ foto │ │ foto │ │ foto │                          │
│ ├──────┤ ├──────┤ ├──────┤ ├──────┤                          │
│ │naziv♡│ │naziv♡│ │naziv♡│ │naziv♡│                          │
│ │79,90 │ │59,90 │ │29,90 │ │69,90 │ 89,90                    │
│ └──────┘ └──────┘ └──────┘ └──────┘                          │
└──────────────────────────────────────────────────────────────┘
```
- Filteri u URL-u (dijeljivi linkovi, back dugme radi).
- Na mobitelu filteri u ladici odozdo, s brojem rezultata na dugmetu ("Prikaži 37 proizvoda").
- Beskonačno učitavanje s "Učitaj još" fallbackom; pozicija skrola se pamti.

### 4.3 Proizvod

```
┌──────────────────────────────────────────────────────────────┐
│ Farmerke / Regular                                            │
│ ┌────────────────────────────┐  Farmerke Regular Fit          │
│ │                            │  79,90 KM                      │
│ │   3D model (rotiraj)       │  Pranje: ● ● ●                 │
│ │   ili galerija fotografija │  Veličina:                     │
│ │                            │  [28][29][30][31][32][33][34]  │
│ │  [3D] [Foto] [Lupa]        │  Koja je moja veličina?        │
│ └────────────────────────────┘  [   Dodaj u korpu   ]  ♡      │
│                                 Dostava sutra ako naručiš do 14h│
│ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - │
│ Materijal · Kroj i mjere · Održavanje · Dostava i povrat      │
│ Složi uz ovo:  [majica] [kaiš] [jakna]                        │
└──────────────────────────────────────────────────────────────┘
```
- **3D / Foto / Lupa**: 3D za rotaciju, foto za stvarne slike na modelu, **Lupa** = makro tekstura materijala (tkanje denima, pletivo džempera) koja prati kursor/prst. Kod odjeće ljudi najviše žele znati "kakav je materijal".
- **Savjetnik za veličinu**: visina + težina + kako voliš da sjedi → preporuka ("Preporučujemo 32 · većina kupaca tvoje visine uzima 32"). Uz tabelu mjera.
- **Sticky dugme** "Dodaj u korpu" na mobitelu uvijek dostupno palcem.
- Hang-tag etiketa nosi cijenu i oznaku NOVO / −20%.
- Simboli održavanja (pranje, peglanje) kao ikone — prava etiketa iz odjeće.

### 4.4 Korpa, checkout, ostalo
- **Korpa**: ladica s desne strane (ne posebna stranica), kutije s proizvodima, promjena veličine/količine direktno, "Do besplatne dostave fali još 20 KM" s isprekidanim šav-progresom.
- **Checkout**: jedna stranica, svijetla tema (`kreda`) — smiruje i ulijeva povjerenje. Kupovina bez registracije, pouzeće + kartica, automatska dopuna adrese.
- **Pretraga**: overlay preko cijelog ekrana, rezultati dok kucaš (s fotografijama i cijenama), tolerantna na greške ("dzemper" → džemper).
- **Lista želja**, **Moj račun** (narudžbe, praćenje), **O nama** (priča Adem Jeans, radnja).

---

## 5. Tech stack

| Sloj | Izbor | Zašto |
|---|---|---|
| Framework | **Next.js** (App Router, najnovija stabilna) + **React 19** + **TypeScript** | SSR/SEO za proizvode, brzo učitavanje, standard za e-commerce |
| Stilovi | **Tailwind CSS v4** + CSS varijable (tokeni iz pogl. 2) | Brz razvoj, tokeni na jednom mjestu |
| 3D | **three.js + React Three Fiber + drei** | Najzreliji web 3D ekosistem |
| Renderer | **WebGPU** (three `WebGPURenderer`) s automatskim **WebGL2** fallbackom, shaderi u **TSL** | WebGPU je od 2026. podržan u Chrome/Edge/Safari/Firefox; TSL piše jedan shader za oba |
| Fizika | **@react-three/rapier** | Njihanje vješalica i hang-tagova, sudari komada na šipki |
| Tkanina | Pre-simulirane animacije iz CLO3D/Marvelous Designer (presavijanje) + lagana verlet simulacija za njihanje | Prava simulacija tkanine u realnom vremenu je preteška za mobitel |
| Animacija | **GSAP** (ScrollTrigger, SplitText — sada potpuno besplatno) + **Lenis** (glatki skrol) + **Motion** za UI stanja | GSAP za koreografiju, Motion za komponente |
| Tranzicije | **View Transitions API** | Shared-element prelaz katalog → proizvod, kao na videu |
| Stanje | **Zustand** (korpa, UI), server komponente za podatke | Jednostavno, malo |
| Pretraga | **Meilisearch** (ili Algolia) | Trenutni rezultati, tolerancija na greške i naše znakove |
| CMS | **Sanity** | Banneri, kolekcije, tekstovi — mijenjaš bez programera |
| Backend (kasnije) | Prijedlog: **Medusa v2** (open-source) — ili Shopify headless | Medusa: pun kontrola, KM, pouzeće; Shopify Payments ne radi u BiH |
| Plaćanje | **Monri** (kartice u BiH) + pouzeće | Lokalno dostupno |
| Kvalitet | Playwright (E2E), Lighthouse CI, axe (pristupačnost) | Da 3D ne ubije brzinu i pristupačnost |
| Hosting | Vercel (frontend), slike preko Next Image/CDN | Jednostavno |

### 5.1 3D sadržaj — najveći rizik projekta

3D je dobar onoliko koliko su dobri modeli. Opcije, od najboljeg ka najbržem:

1. **CLO3D / Marvelous Designer** (industrijski standard za odjeću) → Blender → GLB. Najbolji rezultat, morph-krojevi i animacija presavijanja moguće. Potreban 3D artist.
2. **Gaussian splat skeniranje stvarnih proizvoda** (telefon + aplikacija tipa Polycam/Scaniverse, prikaz preko Spark ili nativnog three.js splat renderera). Foto-realan materijal, vrlo "2027", ali bez morphova.
3. **AI image-to-3D** (Meshy, Tripo, Hunyuan3D) — dovoljno za **prototip** dok čekamo prave modele.

Preporuka: prototip s AI/besplatnim modelima, a za lansiranje 6–10 "hero" komada u CLO3D-u. Ostatak kataloga — odlične fotografije (3D nije potreban za svaki od 500 artikala).

### 5.2 Performanse (da bude user friendly, ne samo lijepo)

- Prva slika (LCP) je **statična fotografija/poster** hero scene; 3D se učitava nakon što je stranica već upotrebljiva. Cilj: LCP < 2.5s na 4G.
- **Automatski nivo kvaliteta** po uređaju (detekcija GPU-a): jaki uređaji — puna scena; slabi telefoni — manje komada, bez sjena; bez WebGL-a — fotografije.
- GLB po komadu < 1.5 MB (Draco/Meshopt + KTX2 teksture, `gltf-transform`).
- `prefers-reduced-motion` gasi fiziku, stretch-tipografiju i parallax.
- Sva 3D interakcija ima tastaturni i screen-reader ekvivalent; vidljiv fokus (limeta šav-okvir).

---

## 6. Faze rada

| Faza | Sadržaj | Rezultat |
|---|---|---|
| 0 | Ovaj plan → tvoje odobrenje/izmjene | Dogovoren pravac |
| 1 | Setup, dizajn tokeni, header/footer, katalog, proizvod, korpa — s test podacima i fotografijama | Funkcionalna prodavnica bez 3D-a |
| 2 | Hero "Šipka", "Složi u kutiju", 3D prikaz na proizvodu | Glavni wow-momenti |
| 3 | Denim lab, depth banneri, pretraga, View Transitions, stretch tipografija | Dovršen doživljaj |
| 4 | Backend, checkout s plaćanjem, CMS, analitika, audit brzine i pristupačnosti | Spremno za lansiranje |
| 5 (opcija) | "Nastavi na telefonu" (QR prenos korpe s desktopa na mobitel, kao sinhronizacija na videu), AR pregled, virtualno isprobavanje | Dodaci za 2027. |

---

## 7. Šta mi treba od tebe

1. **Ime i logo**: je li brend "BOX — Adem Jeans" kao na slici? Imaš li logo u vektoru (SVG/AI)?
2. **Fotografije**: postoje li prave fotografije proizvoda i modela (kao na slici), ili radimo s privremenim?
3. **3D**: imaš li budžet za 3D artista (CLO3D), ili idemo na skeniranje/AI za početak?
4. **Prodaja**: koliko otprilike artikala, postoji li fizička radnja, i koje plaćanje želiš (pouzeće, kartice)?
5. **Jezik**: samo bosanski za početak, ili i engleski?
6. **Backend**: krećemo samo s frontendom i test podacima (moja preporuka), a backend biramo u fazi 4?
