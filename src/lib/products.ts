import type { CategorySlug, Product } from "./types";

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Singular, for breadcrumbs and copy ("Farmerke Regular Fit"). */
  short: string;
  blurb: string;
}

export const CATEGORIES: Category[] = [
  { slug: "farmerke", name: "Farmerke", short: "Farmerke", blurb: "Pet krojeva, od uskih do širokih. Teški denim koji s vremenom dobije tvoj oblik." },
  { slug: "trenerke", name: "Trenerke", short: "Trenerka", blurb: "Mekani flis iznutra, ravne i jogger nogavice." },
  { slug: "majice", name: "Majice", short: "Majica", blurb: "Gusti pamuk koji drži oblik i nakon pranja." },
  { slug: "dzemperi", name: "Džemperi", short: "Džemper", blurb: "Pleteni džemperi i duksevi za hladnije dane." },
  { slug: "prsluci", name: "Prsluci", short: "Prsluk", blurb: "Lagani punjeni prsluci, toplina bez rukava." },
  { slug: "jakne", name: "Jakne", short: "Jakna", blurb: "Denim, bomber i jakne za svaki dan." },
  { slug: "kaisevi", name: "Kaiševi", short: "Kaiš", blurb: "Puna koža, metalna kopča." },
  { slug: "sorcevi", name: "Šorcevi", short: "Šorc", blurb: "Cargo i denim šorcevi za ljeto." },
];

const PANTS = ["28", "29", "30", "31", "32", "33", "34", "36", "38"];
const TOPS = ["S", "M", "L", "XL", "XXL"];

export const PRODUCTS: Product[] = [
  // ---------------------------------------------------------------- farmerke
  {
    slug: "farmerke-regular-fit",
    name: "Farmerke Regular Fit",
    category: "farmerke",
    price: 79.9,
    colorName: "Srednje plava",
    swatch: "#3f587c",
    family: ["farmerke-regular-fit", "farmerke-regular-fit-crne"],
    sizes: PANTS,
    soldOut: ["28"],
    brand: "BOX Denim",
    description: "Ravna nogavica, srednji struk i malo prostora u butinama. Kroj koji pristaje uz patike i uz cipele.",
    material: "100% pamuk, denim 13 oz, srednje pranje",
    weight: "13 oz",
    fitNote: "Prave mjere. Ako si između dvije veličine, uzmi manju jer se denim malo raširi.",
    care: ["wash30", "noBleach", "ironMid", "noTumble"],
    garment: { kind: "jeans", fabric: "denim", color: "#3f587c", fit: "regular", wash: "mid" },
  },
  {
    slug: "farmerke-regular-fit-crne",
    name: "Farmerke Regular Fit",
    category: "farmerke",
    price: 79.9,
    colorName: "Crna",
    swatch: "#1d1e21",
    family: ["farmerke-regular-fit", "farmerke-regular-fit-crne"],
    sizes: PANTS,
    brand: "BOX Denim",
    description: "Isti kroj kao naša najprodavanija farmerka, u dubokoj crnoj boji koja sporo blijedi.",
    material: "99% pamuk, 1% elastan, denim 12 oz",
    weight: "12 oz",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironMid", "noTumble"],
    garment: { kind: "jeans", fabric: "denim", color: "#1d1e21", fit: "regular", wash: "black" },
  },
  {
    slug: "farmerke-slim-fit",
    name: "Farmerke Slim Fit",
    category: "farmerke",
    price: 84.9,
    isNew: true,
    colorName: "Tamno plava",
    swatch: "#22314f",
    sizes: PANTS,
    brand: "BOX Denim",
    description: "Uža nogavica od koljena prema dolje, sa malo elastina da se lako kreće.",
    material: "98% pamuk, 2% elastan, denim 11.5 oz",
    weight: "11.5 oz",
    fitNote: "Usko kroji. Ako voliš da ti je udobnije, uzmi broj veći.",
    care: ["wash30", "noBleach", "ironMid", "noTumble"],
    garment: { kind: "jeans", fabric: "denim", color: "#22314f", fit: "slim", wash: "dark" },
  },
  {
    slug: "farmerke-relaxed-fit",
    name: "Farmerke Relaxed Fit",
    category: "farmerke",
    price: 89.9,
    colorName: "Svijetlo plava",
    swatch: "#7f9aba",
    sizes: PANTS,
    soldOut: ["38"],
    brand: "BOX Denim",
    description: "Opuštena butina, blago šira nogavica i svijetlo pranje s izraženim nijansama.",
    material: "100% pamuk, denim 13 oz, svijetlo pranje",
    weight: "13 oz",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironMid", "noTumble"],
    garment: { kind: "jeans", fabric: "denim", color: "#7f9aba", fit: "relaxed", wash: "light" },
  },
  {
    slug: "farmerke-loose-fit",
    name: "Farmerke Loose Fit",
    category: "farmerke",
    price: 94.9,
    oldPrice: 109.9,
    colorName: "Raw indigo",
    swatch: "#1b2741",
    sizes: PANTS,
    brand: "BOX Denim",
    description: "Široka nogavica cijelom dužinom. Neoprani raw denim koji s nošenjem dobije tvoje nabore.",
    material: "100% pamuk, raw denim 14 oz",
    weight: "14 oz",
    fitNote: "Široko kroji. Raw denim se nakon prvog pranja skupi do 3%.",
    care: ["wash30", "noBleach", "ironMid", "noTumble"],
    garment: { kind: "jeans", fabric: "denim", color: "#1b2741", fit: "loose", wash: "raw" },
  },
  // ---------------------------------------------------------------- trenerke
  {
    slug: "trenerka-essential",
    name: "Trenerka Essential",
    category: "trenerke",
    price: 59.9,
    isNew: true,
    colorName: "Crna",
    swatch: "#18191b",
    family: ["trenerka-essential", "trenerka-essential-siva"],
    sizes: TOPS,
    brand: "BOX Basics",
    description: "Jogger kroj s rebrastim manžetama, elastičnim pojasom i vezicom.",
    material: "80% pamuk, 20% poliester, flis 320 g/m²",
    weight: "320 g/m²",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironLow", "tumbleLow"],
    garment: { kind: "sweatpants", fabric: "fleece", color: "#1b1c1e" },
  },
  {
    slug: "trenerka-essential-siva",
    name: "Trenerka Essential",
    category: "trenerke",
    price: 59.9,
    colorName: "Siva melanž",
    swatch: "#9a9b9c",
    family: ["trenerka-essential", "trenerka-essential-siva"],
    sizes: TOPS,
    soldOut: ["S"],
    brand: "BOX Basics",
    description: "Jogger kroj s rebrastim manžetama, elastičnim pojasom i vezicom.",
    material: "80% pamuk, 20% poliester, flis 320 g/m²",
    weight: "320 g/m²",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironLow", "tumbleLow"],
    garment: { kind: "sweatpants", fabric: "fleece", color: "#9b9c9d" },
  },
  {
    slug: "trenerka-beton",
    name: "Trenerka Beton",
    category: "trenerke",
    price: 64.9,
    colorName: "Maslinasta",
    swatch: "#4a4d3a",
    sizes: TOPS,
    brand: "BOX Basics",
    description: "Teži flis i malo širi kroj za opušten izgled.",
    material: "100% pamuk, flis 380 g/m²",
    weight: "380 g/m²",
    fitNote: "Kroji malo šire.",
    care: ["wash30", "noBleach", "ironLow", "noTumble"],
    garment: { kind: "sweatpants", fabric: "fleece", color: "#4b4e3b" },
  },
  // ---------------------------------------------------------------- majice
  {
    slug: "majica-basic-bijela",
    name: "Majica Basic",
    category: "majice",
    price: 29.9,
    colorName: "Bijela",
    swatch: "#efefeb",
    family: ["majica-basic-bijela", "majica-basic-crna"],
    sizes: TOPS,
    brand: "BOX Basics",
    description: "Gusti pamuk od 220 g/m², okrugli izrez s rebrastim rubom i malo izvezeno ime na grudima.",
    material: "100% organski pamuk, 220 g/m²",
    weight: "220 g/m²",
    fitNote: "Prave mjere.",
    care: ["wash40", "noBleach", "ironMid", "tumbleLow"],
    garment: { kind: "tee", fabric: "jersey", color: "#ecece8", mark: "BOX" },
  },
  {
    slug: "majica-basic-crna",
    name: "Majica Basic",
    category: "majice",
    price: 29.9,
    colorName: "Crna",
    swatch: "#18181a",
    family: ["majica-basic-bijela", "majica-basic-crna"],
    sizes: TOPS,
    brand: "BOX Basics",
    description: "Gusti pamuk od 220 g/m², okrugli izrez s rebrastim rubom i malo izvezeno ime na grudima.",
    material: "100% organski pamuk, 220 g/m²",
    weight: "220 g/m²",
    fitNote: "Prave mjere.",
    care: ["wash40", "noBleach", "ironMid", "tumbleLow"],
    garment: { kind: "tee", fabric: "jersey", color: "#19191b", mark: "BOX" },
  },
  {
    slug: "majica-heavy-oversized",
    name: "Majica Heavy Oversized",
    category: "majice",
    price: 39.9,
    isNew: true,
    colorName: "Beton siva",
    swatch: "#8b8984",
    sizes: TOPS,
    brand: "BOX Basics",
    description: "Spušteno rame, širi trup i natpis na leđima. Pamuk od 280 g/m² koji pada teško i ravno.",
    material: "100% pamuk, 280 g/m²",
    weight: "280 g/m²",
    fitNote: "Namjerno široka. Za klasičan kroj uzmi broj manji.",
    care: ["wash30", "noBleach", "ironLow", "noTumble"],
    garment: { kind: "tee", fabric: "jersey", color: "#8a8883", oversized: true, mark: "BOX" },
  },
  {
    slug: "majica-heavy-oversized-asfalt",
    name: "Majica Heavy Oversized",
    category: "majice",
    price: 39.9,
    colorName: "Asfalt",
    swatch: "#202322",
    sizes: TOPS,
    brand: "BOX Basics",
    description: "Spušteno rame, širi trup i natpis na leđima. Pamuk od 280 g/m² koji pada teško i ravno.",
    material: "100% pamuk, 280 g/m²",
    weight: "280 g/m²",
    fitNote: "Namjerno široka. Za klasičan kroj uzmi broj manji.",
    care: ["wash30", "noBleach", "ironLow", "noTumble"],
    garment: { kind: "tee", fabric: "jersey", color: "#212423", oversized: true, mark: "BOX" },
  },
  // ---------------------------------------------------------------- džemperi
  {
    slug: "dzemper-classic",
    name: "Džemper Classic",
    category: "dzemperi",
    price: 69.9,
    oldPrice: 89.9,
    colorName: "Crna",
    swatch: "#17181a",
    sizes: TOPS,
    brand: "BOX Knit",
    description: "Fino pleteni džemper s okruglim izrezom. Dovoljno tanak za ispod jakne, dovoljno topao sam za sebe.",
    material: "70% merino vuna, 30% pamuk",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironLow", "dryFlat"],
    garment: { kind: "sweater", fabric: "knit", color: "#18191b" },
  },
  {
    slug: "dzemper-kamen",
    name: "Džemper Kamen",
    category: "dzemperi",
    price: 74.9,
    colorName: "Kamen",
    swatch: "#c9c2b4",
    sizes: TOPS,
    brand: "BOX Knit",
    description: "Krupnije pletivo u boji kamena, mekano i bez grebanja.",
    material: "60% pamuk, 40% vuna",
    fitNote: "Kroji malo šire.",
    care: ["wash30", "noBleach", "ironLow", "dryFlat"],
    garment: { kind: "sweater", fabric: "knit", color: "#c8c1b3" },
  },
  {
    slug: "duks-hoodie-siva",
    name: "Duks s kapuljačom",
    category: "dzemperi",
    price: 64.9,
    isNew: true,
    colorName: "Siva melanž",
    swatch: "#8f9091",
    family: ["duks-hoodie-siva", "duks-hoodie-crna"],
    sizes: TOPS,
    brand: "BOX Basics",
    description: "Kapuljača s duplim slojem, džep naprijed i flis iznutra. Ide uz trenerku Essential.",
    material: "80% pamuk, 20% poliester, flis 340 g/m²",
    weight: "340 g/m²",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironLow", "tumbleLow"],
    garment: { kind: "hoodie", fabric: "fleece", color: "#909192", mark: "BOX" },
  },
  {
    slug: "duks-hoodie-crna",
    name: "Duks s kapuljačom",
    category: "dzemperi",
    price: 64.9,
    colorName: "Crna",
    swatch: "#18191b",
    family: ["duks-hoodie-siva", "duks-hoodie-crna"],
    sizes: TOPS,
    brand: "BOX Basics",
    description: "Kapuljača s duplim slojem, džep naprijed i flis iznutra. Ide uz trenerku Essential.",
    material: "80% pamuk, 20% poliester, flis 340 g/m²",
    weight: "340 g/m²",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironLow", "tumbleLow"],
    garment: { kind: "hoodie", fabric: "fleece", color: "#1a1b1d", mark: "BOX" },
  },
  // ---------------------------------------------------------------- prsluci
  {
    slug: "prsluk-urban",
    name: "Prsluk Urban",
    category: "prsluci",
    price: 79.9,
    colorName: "Crna",
    swatch: "#141516",
    sizes: TOPS,
    brand: "BOX Outer",
    description: "Lagani punjeni prsluk s visokim ovratnikom. Spakuje se u sopstveni džep.",
    material: "Vanjski: 100% reciklirani najlon. Punjenje: sintetičko perje",
    fitNote: "Prave mjere, ima mjesta za džemper ispod.",
    care: ["wash30", "noBleach", "ironLow", "tumbleLow"],
    garment: { kind: "vest", fabric: "nylon", color: "#151617", metal: "#2b2d2f" },
  },
  {
    slug: "prsluk-urban-maslinasti",
    name: "Prsluk Urban",
    category: "prsluci",
    price: 79.9,
    isNew: true,
    colorName: "Maslinasta",
    swatch: "#3f4433",
    sizes: TOPS,
    soldOut: ["XXL"],
    brand: "BOX Outer",
    description: "Lagani punjeni prsluk s visokim ovratnikom. Spakuje se u sopstveni džep.",
    material: "Vanjski: 100% reciklirani najlon. Punjenje: sintetičko perje",
    fitNote: "Prave mjere, ima mjesta za džemper ispod.",
    care: ["wash30", "noBleach", "ironLow", "tumbleLow"],
    garment: { kind: "vest", fabric: "nylon", color: "#3f4434", metal: "#2b2d2f" },
  },
  // ---------------------------------------------------------------- jakne
  {
    slug: "jakna-premium",
    name: "Jakna Premium",
    category: "jakne",
    price: 129.9,
    isNew: true,
    colorName: "Isprana crna",
    swatch: "#26272a",
    sizes: TOPS,
    brand: "BOX Denim",
    description: "Klasična denim jakna od teškog crnog denima, s metalnim dugmadima i džepovima na grudima.",
    material: "100% pamuk, denim 14 oz",
    weight: "14 oz",
    fitNote: "Kraći, širi kroj. Prave mjere.",
    care: ["wash30", "noBleach", "ironMid", "noTumble"],
    garment: { kind: "jacket", fabric: "denim", color: "#1d1e21", wash: "black", metal: "#56585b" },
  },
  {
    slug: "jakna-trucker-indigo",
    name: "Jakna Trucker",
    category: "jakne",
    price: 119.9,
    colorName: "Indigo",
    swatch: "#2f4466",
    sizes: TOPS,
    brand: "BOX Denim",
    description: "Denim jakna u srednjem pranju, s limeta šavovima koji su potpis naše radionice.",
    material: "100% pamuk, denim 13 oz",
    weight: "13 oz",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironMid", "noTumble"],
    garment: { kind: "jacket", fabric: "denim", color: "#3f587c", wash: "dark" },
  },
  {
    slug: "jakna-bomber",
    name: "Jakna Bomber",
    category: "jakne",
    price: 139.9,
    oldPrice: 169.9,
    colorName: "Tamno zelena",
    swatch: "#2c3328",
    sizes: TOPS,
    brand: "BOX Outer",
    description: "Lagani bomber s rebrastim ovratnikom i manžetama i džepom na rukavu.",
    material: "Vanjski: 100% najlon. Podstava: 100% poliester",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironLow", "noTumble"],
    garment: { kind: "bomber", fabric: "nylon", color: "#2d3429", metal: "#9a9c9e" },
  },
  // ---------------------------------------------------------------- kaiševi
  {
    slug: "kais-kozni-crni",
    name: "Kaiš kožni",
    category: "kaisevi",
    price: 34.9,
    colorName: "Crna",
    swatch: "#151515",
    family: ["kais-kozni-crni", "kais-kozni-smedji"],
    sizes: ["90", "95", "100", "105", "110"],
    brand: "BOX Leather",
    description: "Kaiš od pune goveđe kože širine 3.5 cm s mat metalnom kopčom.",
    material: "100% goveđa koža, kopča od cinkove legure",
    fitNote: "Uzmi dužinu za 10 cm veću od broja farmerki u centimetrima.",
    care: ["noBleach"],
    garment: { kind: "belt", fabric: "leather", color: "#18181a", metal: "#9a9c9e" },
  },
  {
    slug: "kais-kozni-smedji",
    name: "Kaiš kožni",
    category: "kaisevi",
    price: 34.9,
    colorName: "Smeđa",
    swatch: "#5b3a22",
    family: ["kais-kozni-crni", "kais-kozni-smedji"],
    sizes: ["90", "95", "100", "105", "110"],
    brand: "BOX Leather",
    description: "Kaiš od pune goveđe kože širine 3.5 cm s mat metalnom kopčom.",
    material: "100% goveđa koža, kopča od cinkove legure",
    fitNote: "Uzmi dužinu za 10 cm veću od broja farmerki u centimetrima.",
    care: ["noBleach"],
    garment: { kind: "belt", fabric: "leather", color: "#5c3b23", metal: "#b8a27a" },
  },
  // ---------------------------------------------------------------- šorcevi
  {
    slug: "sorc-cargo",
    name: "Šorc Cargo",
    category: "sorcevi",
    price: 49.9,
    colorName: "Pijesak",
    swatch: "#b8ab8d",
    sizes: PANTS.slice(0, 8),
    brand: "BOX Utility",
    description: "Šorc od pamučnog kepera s dva cargo džepa i dužinom do iznad koljena.",
    material: "100% pamuk, keper",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironMid", "tumbleLow"],
    garment: { kind: "shorts", fabric: "twill", color: "#b6a98b" },
  },
  {
    slug: "sorc-denim",
    name: "Šorc Denim",
    category: "sorcevi",
    price: 44.9,
    colorName: "Srednje plava",
    swatch: "#4a6489",
    sizes: PANTS.slice(0, 8),
    brand: "BOX Denim",
    description: "Denim šorc od iste tkanine kao Regular Fit farmerke, sa podvrnutim rubom.",
    material: "100% pamuk, denim 12 oz",
    weight: "12 oz",
    fitNote: "Prave mjere.",
    care: ["wash30", "noBleach", "ironMid", "noTumble"],
    garment: { kind: "shorts", fabric: "denim", color: "#3f587c", wash: "mid" },
  },
];

export function getProduct(slug: string) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getCategory(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function productsIn(category: CategorySlug) {
  return PRODUCTS.filter((p) => p.category === category);
}

/** What hangs on the rail in the hero, in order. */
export const RACK = ["jakna-premium", "dzemper-classic", "majica-basic-bijela", "prsluk-urban", "duks-hoodie-siva", "farmerke-regular-fit", "trenerka-essential", "jakna-bomber", "majica-heavy-oversized"];

export const FEATURED = ["farmerke-regular-fit", "trenerka-essential", "majica-basic-bijela", "dzemper-classic", "prsluk-urban", "jakna-premium", "duks-hoodie-siva", "sorc-cargo"];

export function formatKM(n: number) {
  return `${n.toFixed(2).replace(".", ",")} KM`;
}

export function discount(p: Product) {
  return p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
}

export function imageFor(slug: string, view: "front" | "back" = "front") {
  return `/products/${slug}-${view}.jpg`;
}

/** Folds diacritics so "dzemper" finds "džemper". */
export function fold(s: string) {
  return s
    .toLowerCase()
    .replace(/[čć]/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function searchProducts(q: string) {
  const terms = fold(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return PRODUCTS.filter((p) => {
    const hay = fold(`${p.name} ${p.colorName} ${getCategory(p.category)?.name} ${p.brand} ${p.material}`);
    return terms.every((t) => hay.includes(t));
  });
}
