import { describe, expect, it } from "vitest";
import { isPaletteKey } from "./palette";
import {
  BROKEN_OVERLAY,
  CATEGORIES,
  CHECKOUT_SCREEN,
  CUSTOMER_VARIANTS,
  DIRECTIONS,
  EQUIPMENT_TYPES,
  SHELF_SPRITES,
  WALK_FRAMES,
  cashierSprite,
  categoryFor,
  customerSprite,
  spriteFor,
  stockerSprite,
  tileSprite,
  type SpriteMap,
} from "./sprites";
import { rasterize } from "./render";

function all(): [string, SpriteMap][] {
  const out: [string, SpriteMap][] = [];
  for (const k of ["floor", "wall", "wallCorner", "door", "doorOpen"] as const)
    out.push([k, tileSprite(k)]);
  out.push(["floor1", tileSprite("floor", 1)], ["screen", CHECKOUT_SCREEN]);
  BROKEN_OVERLAY.forEach((s, i) => out.push([`broken${i}`, s]));
  for (const t of EQUIPMENT_TYPES) out.push([t, spriteFor(t)]);
  for (const c of CATEGORIES) out.push([`shelf-${c}`, SHELF_SPRITES[c]]);
  for (const d of DIRECTIONS)
    for (let f = 0; f < WALK_FRAMES; f++) {
      out.push(
        [`cashier-${d}${f}`, cashierSprite(d, f)],
        [`stocker-${d}${f}`, stockerSprite(d, f)],
      );
      for (let v = 0; v < CUSTOMER_VARIANTS; v++)
        out.push([`c${v}-${d}${f}`, customerSprite(v, d, f)]);
    }
  return out;
}

describe("sprites", () => {
  it("are rectangular, 16 wide, 16 or 24 tall, with known palette keys", () => {
    for (const [name, rows] of all()) {
      expect(rows.length === 16 || rows.length === 24, name).toBe(true);
      for (const r of rows) {
        expect(r.length, name).toBe(16);
        for (const ch of r)
          expect(ch === "." || isPaletteKey(ch), `${name}:${ch}`).toBe(true);
      }
    }
  });

  it("has a sprite for every equipment type", () => {
    for (const t of EQUIPMENT_TYPES)
      expect(spriteFor(t, "eq_1").length).toBeGreaterThan(0);
  });

  it("categoryFor is stable and covers all variants", () => {
    expect(categoryFor("eq_7")).toBe(categoryFor("eq_7"));
    const seen = new Set(
      Array.from({ length: 400 }, (_, i) => categoryFor(`eq_${i}`)),
    );
    expect(seen.size).toBe(CATEGORIES.length);
  });

  it("has customer frames for all directions, variants differ, left mirrors right", () => {
    expect(CUSTOMER_VARIANTS).toBeGreaterThanOrEqual(4);
    for (const d of DIRECTIONS)
      for (let f = 0; f < WALK_FRAMES; f++)
        expect(customerSprite(0, d, f).length).toBe(16);
    expect(customerSprite(0, "down", 0)).not.toEqual(
      customerSprite(1, "down", 0),
    );
    expect(customerSprite(0, "left", 0)).not.toEqual(
      customerSprite(0, "right", 0),
    );
  });

  it("rasterize is safe without DOM", () => {
    expect(rasterize("x", tileSprite("wall"), 2)).toBeNull();
  });
});
