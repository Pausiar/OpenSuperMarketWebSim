import { describe, expect, it } from "vitest";
import { createMap, placeEquipment } from "../../domain/map";
import type { GameState } from "../../domain/state";
import type { EquipmentType } from "../../domain/data/equipment";
import { makeState } from "../../test/helpers";
import {
  canMoveTo,
  clampedTarget,
  clampOffset,
  pointerToTile,
  toggleRot,
} from "./mapDrag";

function setup(): GameState {
  const s = makeState(7);
  s.map = createMap(12, 10);
  s.store.equipment = [];
  return s;
}
function add(s: GameState, id: string, type: EquipmentType, x: number, y: number, rot: 0 | 1 = 0) {
  s.store.equipment.push({ id, type, broken: false });
  expect(placeEquipment(s, id, x, y, rot)).toBeNull();
}

describe("mapDrag", () => {
  it("convierte puntero a casilla", () => {
    expect(pointerToTile(95, 65, { left: 5, top: 5 }, 30)).toEqual({ x: 3, y: 2 });
  });
  it("recorta el objetivo al mapa", () => {
    expect(clampedTarget({ x: 20, y: -3 }, { x: 1, y: 0 }, { w: 2, h: 1 }, { w: 12, h: 10 })).toEqual({ x: 10, y: 0 });
    expect(clampOffset({ x: 1, y: 1 }, { w: 1, h: 2 })).toEqual({ x: 0, y: 1 });
  });
  it("mover a casilla libre es válido", () => {
    const s = setup();
    add(s, "a", "shelf", 3, 3);
    expect(canMoveTo(s, "a", 6, 5, 0)).toBe(true);
  });
  it("sobre otra pieza se rechaza", () => {
    const s = setup();
    add(s, "a", "shelf", 3, 3);
    add(s, "b", "shelf", 6, 3);
    expect(canMoveTo(s, "a", 5, 3, 0)).toBe(false);
  });
  it("sobre pared o puerta se rechaza", () => {
    const s = setup();
    add(s, "a", "shelf", 3, 3);
    expect(canMoveTo(s, "a", 0, 3, 0)).toBe(false);
    expect(canMoveTo(s, "a", 5, 9, 0)).toBe(false);
    expect(canMoveTo(s, "a", 5, 8, 0)).toBe(false); // frente a la puerta
  });
  it("rotar junto al borde se rechaza si no cabe", () => {
    const s = setup();
    add(s, "a", "shelf", 2, 8); // 2x1 en la última fila interior
    expect(canMoveTo(s, "a", 2, 8, toggleRot(0))).toBe(false); // 1x2 invadiría la pared
    expect(canMoveTo(s, "a", 2, 7, 1)).toBe(true);
  });
  it("moverse sobre su propia huella anterior está permitido", () => {
    const s = setup();
    add(s, "a", "shelf", 3, 3);
    expect(canMoveTo(s, "a", 4, 3, 0)).toBe(true);
    expect(canMoveTo(s, "a", 3, 3, 1)).toBe(true);
  });
});
