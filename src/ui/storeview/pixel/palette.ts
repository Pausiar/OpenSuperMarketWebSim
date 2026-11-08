/** Paleta cálida y cohesionada (30 colores) con rampas de luz / media / sombra. '.' = transparente. */
export const PALETTE = {
  k: "#2b1d1a", // contorno
  // suelo
  a: "#ecd8ae",
  b: "#dcc392",
  c: "#c7a977",
  // pared
  w: "#cf905e",
  W: "#aa6a40",
  v: "#7d4a2e",
  // madera
  h: "#dca56a",
  H: "#b27944",
  j: "#7a4a28",
  // acero
  s: "#eaf1f3",
  S: "#b6c6cd",
  t: "#80939d",
  // hielo
  i: "#c4ebf4",
  I: "#88c7da",
  // colores de producto / ropa
  r: "#d6453d",
  R: "#9a2b2b",
  o: "#f0922e",
  y: "#f5d04c",
  g: "#6fae4a",
  G: "#3f7a36",
  d: "#4a86c8", // azul
  D: "#2f5a91",
  p: "#e88fa6",
  u: "#8a5fa8",
  // piel y pelo
  n: "#f2c9a0",
  N: "#d9a074",
  m: "#8d5a3a",
  l: "#5b3a24",
  L: "#2a2019",
  q: "#e0b050",
  // neutros / pantalla
  e: "#fff7e6",
  x: "#9a9088",
  z: "#7de0c0",
} as const;

export type PaletteKey = keyof typeof PALETTE;

export const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[];

/** Carácter que representa un píxel transparente en los mapas de sprites. */
export const TRANSPARENT = ".";

export function isPaletteKey(ch: string): ch is PaletteKey {
  return Object.prototype.hasOwnProperty.call(PALETTE, ch);
}
