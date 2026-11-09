import type { EquipmentType } from "../../domain/data/equipment";
import { canPlace, footprint } from "../../domain/map";
import type { GameState } from "../../domain/state";

export type Rot = 0 | 1;
export interface Tile {
  x: number;
  y: number;
}

/** Convierte coordenadas de puntero a casilla (sin recortar al mapa). */
export function pointerToTile(
  clientX: number,
  clientY: number,
  origin: { left: number; top: number },
  tileSize: number,
): Tile {
  return {
    x: Math.floor((clientX - origin.left) / tileSize),
    y: Math.floor((clientY - origin.top) / tileSize),
  };
}

/**
 * Esquina superior izquierda de la pieza al arrastrarla: casilla bajo el puntero
 * menos el punto por el que se agarró, recortada para que quepa en el mapa.
 */
export function clampedTarget(
  pointerTile: Tile,
  grabOffset: Tile,
  fp: { w: number; h: number },
  map: { w: number; h: number },
): Tile {
  const clamp = (v: number, lo: number, hi: number) =>
    Math.max(lo, Math.min(hi, v));
  return {
    x: clamp(pointerTile.x - grabOffset.x, 0, Math.max(0, map.w - fp.w)),
    y: clamp(pointerTile.y - grabOffset.y, 0, Math.max(0, map.h - fp.h)),
  };
}

/** Mantiene el punto de agarre dentro de la huella tras rotar. */
export function clampOffset(
  offset: Tile,
  fp: { w: number; h: number },
): Tile {
  return {
    x: Math.max(0, Math.min(fp.w - 1, offset.x)),
    y: Math.max(0, Math.min(fp.h - 1, offset.y)),
  };
}

/** Validez de mover una pieza ignorando su propia huella actual. */
export function canMoveTo(
  state: GameState,
  equipmentId: string,
  x: number,
  y: number,
  rot: Rot,
): boolean {
  const eq = state.store.equipment.find((e) => e.id === equipmentId);
  if (!eq) return false;
  return canPlace(state, eq.type, x, y, rot, equipmentId);
}

export function footprintOf(type: EquipmentType, rot: Rot) {
  return footprint(type, rot);
}

export function toggleRot(rot: Rot): Rot {
  return rot === 0 ? 1 : 0;
}
