import { PALETTE, isPaletteKey } from "./palette";
import type { SpriteMap } from "./sprites";

export type PixelCanvas = HTMLCanvasElement | OffscreenCanvas;

const cache = new Map<string, PixelCanvas>();

function createCanvas(w: number, h: number): PixelCanvas | null {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  if (typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  return null;
}

/** Rasteriza el sprite a un canvas fuera de pantalla a escala entera; cacheado por clave+escala. Null sin DOM. */
export function rasterize(
  key: string,
  rows: SpriteMap,
  scale = 1,
): PixelCanvas | null {
  const s = Math.max(1, Math.round(scale));
  const ck = `${key}@${s}`;
  const hit = cache.get(ck);
  if (hit) return hit;
  const canvas = createCanvas((rows[0]?.length ?? 0) * s, rows.length * s);
  const ctx = canvas?.getContext("2d") as
    CanvasRenderingContext2D | null | undefined;
  if (!canvas || !ctx) return null;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (!isPaletteKey(ch)) continue;
      ctx.fillStyle = PALETTE[ch];
      ctx.fillRect(x * s, y * s, s, s);
    }
  });
  cache.set(ck, canvas);
  return canvas;
}

/** Dibuja un sprite (x, y en píxeles de destino) sin suavizado. No hace nada si no hay canvas disponible. */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  key: string,
  rows: SpriteMap,
  x: number,
  y: number,
  scale = 1,
): void {
  const img = rasterize(key, rows, scale);
  if (!img) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(x), Math.round(y));
}

export function clearSpriteCache(): void {
  cache.clear();
}
