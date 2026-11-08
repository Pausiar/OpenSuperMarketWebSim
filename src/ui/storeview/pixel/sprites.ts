import type { ProductCategory } from "../../../domain/data/products";
import type { EquipmentType } from "../../../domain/data/equipment";

/** Un sprite es un array de filas; cada carácter es una clave de la paleta ('.' = transparente). */
export type SpriteMap = readonly string[];

export const TILE = 16;

export type Direction = "down" | "up" | "left" | "right";
export const DIRECTIONS: readonly Direction[] = ["down", "up", "left", "right"];
export const WALK_FRAMES = 3;

export const CATEGORIES: readonly ProductCategory[] = [
  "lacteos",
  "carne",
  "panaderia",
  "frutaverdura",
  "despensa",
  "bebidas",
  "congelados",
  "higiene",
];

// ---------- utilidades ----------

const repeat = (ch: string, n: number) => ch.repeat(n);

export function mirrorRows(rows: SpriteMap): string[] {
  return rows.map((r) => [...r].reverse().join(""));
}

export function swapPalette(
  rows: SpriteMap,
  map: Readonly<Record<string, string>>,
): string[] {
  return rows.map((r) => [...r].map((c) => map[c] ?? c).join(""));
}

/** Superpone `top` sobre `base` en (ox, oy); los '.' de `top` no pisan. */
export function overlay(
  base: SpriteMap,
  top: SpriteMap,
  ox: number,
  oy: number,
): string[] {
  const out = base.map((r) => [...r]);
  top.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== "." && out[y + oy]?.[x + ox] !== undefined)
        out[y + oy][x + ox] = ch;
    });
  });
  return out.map((r) => r.join(""));
}

const padSides = (row: string) => "...." + row + "....";

// ---------- suelo, pared, puerta ----------

function makeFloor(variant: 0 | 1): string[] {
  const rows: string[] = [];
  for (let y = 0; y < TILE; y++) {
    let row = "";
    for (let x = 0; x < TILE; x++) {
      let ch = "a";
      if (y === TILE - 1 || x === TILE - 1) ch = "c";
      else if (variant === 1 && (x * 7 + y * 3) % 11 === 0) ch = "b";
      else if (variant === 0 && (x + y * 5) % 13 === 0) ch = "b";
      row += ch;
    }
    rows.push(row);
  }
  return rows;
}

export const FLOOR_VARIANTS: readonly SpriteMap[] = [
  makeFloor(0),
  makeFloor(1),
];

export const WALL: SpriteMap = [
  repeat("w", 16),
  repeat("w", 16),
  repeat("W", 16),
  repeat("k", 16),
  "WWWWWWWvWWWWWWWv",
  "WWWWWWWvWWWWWWWv",
  "WWWWWWWvWWWWWWWv",
  repeat("v", 16),
  "WWvWWWWWWWvWWWWW",
  "WWvWWWWWWWvWWWWW",
  "WWvWWWWWWWvWWWWW",
  repeat("v", 16),
  "WWWWWWWvWWWWWWWv",
  "WWWWWWWvWWWWWWWv",
  "WWWWWWWvWWWWWWWv",
  repeat("k", 16),
];

export const WALL_CORNER: SpriteMap = [
  "kkkkkkkkkkkkkkkk",
  "kwwwwwwwwwwwwwwk",
  "kwWWWWWWWWWWWWwk",
  "kwWvvvvvvvvvvWwk",
  "kwWvWWWWWWWWvWwk",
  "kwWvWwwwwwWWvWwk",
  "kwWvWwWWWWWWvWwk",
  "kwWvWwWvvvvvvWwk",
  "kwWvWwWvWWWWWWwk",
  "kwWvWwWvWwwwwwwk",
  "kwWvWwWvWwWWWWWk",
  "kwWvWWWvWwWvvvvk",
  "kwWvvvvvWwWvWWWk",
  "kwWWWWWWWwWvWwwk",
  "kwwwwwwwwwWvWwWk",
  "kkkkkkkkkkkkkkkk",
];

export const DOOR: SpriteMap = [
  "jjjjjjjjjjjjjjjj",
  "jHHHHHHHHHHHHHHj",
  "jHhhhhhhhhhhhhHj",
  "jHhsssssssssshHj",
  "jHhsSSSSSSSSshHj",
  "jHhsSSSSSSSSshHj",
  "jHhsSSSSSSSSshHj",
  "jHhsSSSSSSSSshHj",
  "jHhsSSSSSSSSshHj",
  "jHhsSSSSSSSSshHj",
  "jHhsSSSSStyyshHj",
  "jHhsSSSSSStyshHj",
  "jHhsSSSSSSSSshHj",
  "jHhsssssssssshHj",
  "jHHHHHHHHHHHHHHj",
  "kkkkkkkkkkkkkkkk",
];

export const DOOR_OPEN: SpriteMap = [
  "jjjjjjjjjjjjjjjj",
  "jHHHHHHHHHHHHHHj",
  "jHaaaaaaaaaaaaHj",
  "jHaaaaaaaaaaaaHj",
  "jHaaaaaaaaaaaaHj",
  "jHaaaaaaaaaaaaHj",
  "jHaaaaaaaaaaaaHj",
  "jHaaaaaaaaaaaaHj",
  "jHaaaaaaaaaaaaHj",
  "jHaaaaaaaaaaaaHj",
  "jHbbbbbbbbbbbbHj",
  "jHaaaaaaaaaaaaHj",
  "jHaaaaaaaaaaaaHj",
  "jHaaaaaaaaaaaaHj",
  "jHHHHHHHHHHHHHHj",
  "kkkkkkkkkkkkkkkk",
];

// ---------- estanterías (8 variantes por categoría) ----------

/** Colores de producto (a, b) por categoría. */
const SHELF_GOODS: Record<ProductCategory, [string, string]> = {
  lacteos: ["e", "d"],
  carne: ["r", "p"],
  panaderia: ["o", "y"],
  frutaverdura: ["g", "r"],
  despensa: ["y", "h"],
  bebidas: ["d", "g"],
  congelados: ["i", "I"],
  higiene: ["p", "u"],
};

function goodsRows(a: string, b: string, phase: number): string[] {
  const pick = (i: number) => ((i + phase) % 2 === 0 ? a : b);
  const rows = [repeat("H", 14)];
  for (let r = 0; r < 3; r++) {
    let row = "";
    for (let i = 0; i < 7; i++)
      row += repeat(r === 0 ? pick(i + 1) : pick(i), 2);
    rows.push(row);
  }
  return rows;
}

function makeShelf(cat: ProductCategory): string[] {
  const [a, b] = SHELF_GOODS[cat];
  const rows = [repeat("k", 16)];
  for (let s = 0; s < 3; s++) {
    for (const g of goodsRows(a, b, s)) rows.push("j" + g + "j");
    rows.push("j" + repeat("h", 14) + "j");
  }
  rows[rows.length - 1] = repeat("k", 16);
  return rows;
}

export const SHELF_SPRITES: Readonly<Record<ProductCategory, SpriteMap>> =
  Object.fromEntries(
    CATEGORIES.map((c) => [c, makeShelf(c)]),
  ) as unknown as Record<ProductCategory, SpriteMap>;

/** Variante de estantería estable a partir del id del equipamiento. */
export function categoryFor(equipmentId: string): ProductCategory {
  let h = 2166136261;
  for (let i = 0; i < equipmentId.length; i++) {
    h ^= equipmentId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return CATEGORIES[(h >>> 0) % CATEGORIES.length];
}

// ---------- frigorífico, congelador, caja ----------

function makeCooler(
  body: string,
  mid: string,
  glass: string,
  i1: string,
  i2: string,
): string[] {
  const items = `k${body}${mid}${glass}${i1}${i1}${glass}${i2}${i2}${glass}${i1}${i1}${glass}${mid}${body}k`;
  const gap = `k${body}${mid}${repeat(glass, 10)}${mid}${body}k`;
  const rows = [repeat("k", 16), `k${repeat(body, 14)}k`];
  for (let s = 0; s < 3; s++) rows.push(items, items, items, gap);
  rows.push(`k${repeat(mid, 14)}k`, repeat("k", 16));
  return rows.slice(0, 16);
}

export const FRIDGE: SpriteMap = makeCooler("s", "S", "i", "e", "d");
export const FREEZER: SpriteMap = makeCooler("i", "I", "e", "d", "D");

export const CHECKOUT: SpriteMap = [
  "................",
  "................",
  "................",
  "kkkkkkkkkkkkkkkk",
  "khhhhhhhhhhhhhhk",
  "kHHHHHHHHHHHHHHk",
  "kjjjjjjjjjjjjjjk",
  "kxxxxxxxxxxxxxxk",
  "kLLLLLLLLLLLLLLk",
  "kxxxxxxxxxxxxxxk",
  "kHHHHHHHHHHHHHHk",
  "kHhhhhhhhhhhhhHk",
  "kHhhhhhhhhhhhhHk",
  "kHHHHHHHHHHHHHHk",
  "kjjjjjjjjjjjjjjk",
  "kkkkkkkkkkkkkkkk",
];

/** Pantalla / TPV que se superpone sobre la caja. */
export const CHECKOUT_SCREEN: SpriteMap = [
  "................",
  "......kkkkkk....",
  ".....kzzzzzzk...",
  ".....kzkkkkzk...",
  ".....kzzzzzzk...",
  ".....kSSSSSSk...",
  "......kkkkkk....",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
  "................",
];

export const BROKEN_OVERLAY: readonly SpriteMap[] = [
  [
    "................",
    "..y.........y...",
    ".yoy....k..yoy..",
    "..y....k.....y..",
    "......k.........",
    ".....kk.........",
    "......k.k.......",
    ".......kk.......",
    ".......k........",
    "......k.........",
    ".....k..k.......",
    "..y.....k...y...",
    ".yoy.......yoy..",
    "..y.........y...",
    "................",
    "................",
  ],
  [
    "................",
    ".........y......",
    "...y....k.yoy...",
    "..yoy..k...y....",
    "...y..k.........",
    ".....kk.........",
    "......k.k.......",
    ".......kk.......",
    ".......k........",
    "......k.........",
    ".....k..k..y....",
    "........k.yoy...",
    "..y........y....",
    ".yoy............",
    "..y.............",
    "................",
  ],
];

// ---------- personas ----------

const HEAD_DOWN = [
  "..kkkk..",
  ".kllllk.",
  "knnnnnnk",
  "knknnknk",
  ".knnnnk.",
  "..kkkk..",
];
const HEAD_UP = [
  "..kkkk..",
  ".kllllk.",
  "kllllllk",
  "kllllllk",
  ".kllllk.",
  "..kkkk..",
];
const HEAD_RIGHT = [
  "..kkkk..",
  ".kllllk.",
  ".kllnnnk",
  ".klnnknk",
  "..knnnk.",
  "..kkkk..",
];
const TORSO_FRONT = [
  ".krrrrk.",
  "krrrrrrk",
  "kNrrrrNk",
  "kNrRRrNk",
  ".kddddk.",
];
const TORSO_BACK = [".krrrrk.", "krrrrrrk", "krrrrrrk", "kNrRRrNk", ".kddddk."];
const TORSO_SIDE = ["..krrk..", ".krrrrk.", ".krrNrk.", ".krRRrk.", "..kddk.."];

const LEGS_FRONT: SpriteMap[] = [
  ["kddkkddk", "kddkkddk", "kDDkkDDk", "kkk..kkk"],
  ["kddkkddk", "kddk.kdk", "kkk..kDk", "....kkk."],
  ["kddkkddk", "kdk.kddk", "kDk..kkk", ".kkk...."],
];
const LEGS_SIDE: SpriteMap[] = [
  ["..kddk..", "..kddk..", "..kDDk..", "..kkkk.."],
  ["..kddk..", ".kdk.dk.", ".kDk.Dk.", "kkk..kkk"],
  ["..kddk..", "..kddk..", ".kDk.kDk", ".kkk.kkk"],
];

function figure(head: SpriteMap, torso: SpriteMap, legs: SpriteMap): string[] {
  return [repeat(".", 16), ...[...head, ...torso, ...legs].map(padSides)];
}

/** Mapas base (color rojo/azul/pelo marrón) de cada dirección y frame; izquierda = espejo de derecha. */
function baseFrames(dir: Direction): string[][] {
  const frames: string[][] = [];
  for (let f = 0; f < WALK_FRAMES; f++) {
    if (dir === "down")
      frames.push(figure(HEAD_DOWN, TORSO_FRONT, LEGS_FRONT[f]));
    else if (dir === "up")
      frames.push(figure(HEAD_UP, TORSO_BACK, LEGS_FRONT[f]));
    else {
      const right = figure(HEAD_RIGHT, TORSO_SIDE, LEGS_SIDE[f]);
      frames.push(dir === "right" ? right : mirrorRows(right));
    }
  }
  return frames;
}

/** Cambios de paleta (camiseta, pantalón, pelo) por variante de cliente. */
export const CUSTOMER_SWAPS: readonly Record<string, string>[] = [
  {},
  { r: "g", R: "G", d: "m", D: "l", l: "q" },
  { r: "u", R: "D", d: "x", D: "k", l: "L", n: "N" },
  { r: "y", R: "o", d: "D", D: "L", l: "m", n: "N" },
  { r: "p", R: "r", d: "u", D: "D", l: "L", n: "N" },
];
export const CUSTOMER_VARIANTS = CUSTOMER_SWAPS.length;

const customerCache = new Map<string, SpriteMap>();

export function customerSprite(
  variant: number,
  dir: Direction,
  frame: number,
): SpriteMap {
  const v =
    ((variant % CUSTOMER_VARIANTS) + CUSTOMER_VARIANTS) % CUSTOMER_VARIANTS;
  const f = ((frame % WALK_FRAMES) + WALK_FRAMES) % WALK_FRAMES;
  const key = `${v}:${dir}:${f}`;
  let s = customerCache.get(key);
  if (!s) {
    s = swapPalette(baseFrames(dir)[f], CUSTOMER_SWAPS[v]);
    customerCache.set(key, s);
  }
  return s;
}

const UNIFORM_GREEN = { r: "g", R: "G", d: "D", D: "L" };
const UNIFORM_ORANGE = { r: "o", R: "r", d: "l", D: "L" };

export function cashierSprite(dir: Direction = "down", frame = 0): SpriteMap {
  return swapPalette(baseFrames(dir)[frame % WALK_FRAMES], UNIFORM_GREEN);
}

const BOX: SpriteMap = ["kkkkkkkk", "khhhhhhk", "kHyyyyHk", "kjjjjjjk"];

export function stockerSprite(dir: Direction = "down", frame = 0): SpriteMap {
  const base = swapPalette(
    baseFrames(dir)[frame % WALK_FRAMES],
    UNIFORM_ORANGE,
  );
  return dir === "up" ? base : overlay(base, BOX, 4, 8);
}

// ---------- accesores por tipo ----------

export type TileKind = "floor" | "wall" | "wallCorner" | "door" | "doorOpen";

export function tileSprite(kind: TileKind, variant = 0): SpriteMap {
  switch (kind) {
    case "floor":
      return FLOOR_VARIANTS[((variant % 2) + 2) % 2];
    case "wall":
      return WALL;
    case "wallCorner":
      return WALL_CORNER;
    case "door":
      return DOOR;
    case "doorOpen":
      return DOOR_OPEN;
  }
}

/** Sprite del equipamiento; las estanterías eligen variante por `equipmentId` (o la primera). */
export function spriteFor(
  type: EquipmentType,
  equipmentId?: string,
): SpriteMap {
  switch (type) {
    case "shelf":
      return SHELF_SPRITES[
        equipmentId ? categoryFor(equipmentId) : CATEGORIES[0]
      ];
    case "fridge":
      return FRIDGE;
    case "freezer":
      return FREEZER;
    case "checkout":
      return CHECKOUT;
  }
}

export const EQUIPMENT_TYPES: readonly EquipmentType[] = [
  "shelf",
  "fridge",
  "freezer",
  "checkout",
];
