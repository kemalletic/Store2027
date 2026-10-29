export type GarmentKind =
  | "jeans"
  | "sweatpants"
  | "shorts"
  | "tee"
  | "sweater"
  | "hoodie"
  | "vest"
  | "jacket"
  | "bomber"
  | "belt";

export type Fabric =
  | "denim"
  | "fleece"
  | "jersey"
  | "knit"
  | "nylon"
  | "twill"
  | "leather";

export type Fit = "slim" | "regular" | "relaxed" | "loose" | "tapered";

export type Wash = "raw" | "dark" | "mid" | "light" | "black";

export interface GarmentSpec {
  kind: GarmentKind;
  fabric: Fabric;
  /** Base colour of the cloth. For denim it is derived from `wash`. */
  color: string;
  /** Colour of topstitching. */
  thread?: string;
  fit?: Fit;
  wash?: Wash;
  /** Oversized tops get dropped shoulders and a wider body. */
  oversized?: boolean;
  /** Small chest print or woven label text. */
  mark?: string;
  /** Hardware colour (buttons, rivets, buckle). */
  metal?: string;
}

export type CategorySlug =
  | "farmerke"
  | "trenerke"
  | "majice"
  | "dzemperi"
  | "prsluci"
  | "jakne"
  | "kaisevi"
  | "sorcevi";

export type CareSymbol = "wash30" | "wash40" | "noBleach" | "ironLow" | "ironMid" | "noTumble" | "tumbleLow" | "dryFlat";

export interface Product {
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  oldPrice?: number;
  isNew?: boolean;
  colorName: string;
  /** Hex used for the colour swatch. */
  swatch: string;
  /** Slugs of the same model in other colours, including this one. */
  family?: string[];
  sizes: string[];
  /** Sizes currently out of stock. */
  soldOut?: string[];
  brand: string;
  description: string;
  material: string;
  weight?: string;
  fitNote: string;
  care: CareSymbol[];
  garment: GarmentSpec;
}
