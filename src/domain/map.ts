import { EQUIPMENT_MAP, type EquipmentType } from './data/equipment';
import type { GameState } from './state';

/**
 * Mapa 2D del supermercado. El borde son paredes; hay una puerta en el centro
 * inferior y una zona de almacén reservada en la esquina superior izquierda.
 * La posición de los objetos tiene impacto real en la simulación (ver layoutEffects).
 */
export interface Placement {
  equipmentId: string;
  x: number;
  y: number;
  rot: 0 | 1; // 1 = rotado 90º (intercambia ancho/alto)
}

export interface MapState {
  w: number;
  h: number;
  placements: Placement[];
}

export const STORAGE_ZONE = { x: 1, y: 1, w: 2, h: 2 };

export function doorTiles(map: MapState): { x: number; y: number }[] {
  const cx = Math.floor(map.w / 2);
  return [
    { x: cx - 1, y: map.h - 1 },
    { x: cx, y: map.h - 1 },
  ];
}

export function footprint(type: EquipmentType, rot: 0 | 1): { w: number; h: number } {
  const def = EQUIPMENT_MAP[type];
  return rot === 0 ? { w: def.w, h: def.h } : { w: def.h, h: def.w };
}

function inStorageZone(x: number, y: number): boolean {
  return (
    x >= STORAGE_ZONE.x &&
    x < STORAGE_ZONE.x + STORAGE_ZONE.w &&
    y >= STORAGE_ZONE.y &&
    y < STORAGE_ZONE.y + STORAGE_ZONE.h
  );
}

function isWall(map: MapState, x: number, y: number): boolean {
  if (x === 0 || y === 0 || x === map.w - 1 || y === map.h - 1) {
    return !doorTiles(map).some((d) => d.x === x && d.y === y);
  }
  return false;
}

export function tilesOf(p: Placement, type: EquipmentType): { x: number; y: number }[] {
  const fp = footprint(type, p.rot);
  const tiles: { x: number; y: number }[] = [];
  for (let dx = 0; dx < fp.w; dx++)
    for (let dy = 0; dy < fp.h; dy++) tiles.push({ x: p.x + dx, y: p.y + dy });
  return tiles;
}

function typeOf(state: GameState, equipmentId: string): EquipmentType {
  const eq = state.store.equipment.find((e) => e.id === equipmentId);
  if (!eq) throw new Error(`Equipamiento no encontrado: ${equipmentId}`);
  return eq.type;
}

export function occupiedTiles(state: GameState, ignoreEquipmentId?: string): Set<string> {
  const set = new Set<string>();
  for (const p of state.map.placements) {
    if (p.equipmentId === ignoreEquipmentId) continue;
    for (const t of tilesOf(p, typeOf(state, p.equipmentId))) set.add(`${t.x},${t.y}`);
  }
  return set;
}

export function canPlace(
  state: GameState,
  type: EquipmentType,
  x: number,
  y: number,
  rot: 0 | 1,
  ignoreEquipmentId?: string,
): boolean {
  const map = state.map;
  const fp = footprint(type, rot);
  const occupied = occupiedTiles(state, ignoreEquipmentId);
  const door = doorTiles(map);
  for (let dx = 0; dx < fp.w; dx++) {
    for (let dy = 0; dy < fp.h; dy++) {
      const tx = x + dx;
      const ty = y + dy;
      if (tx < 1 || ty < 1 || tx >= map.w - 1 || ty >= map.h - 1) return false;
      if (isWall(map, tx, ty) || inStorageZone(tx, ty)) return false;
      if (occupied.has(`${tx},${ty}`)) return false;
      // No bloquear la puerta ni la casilla frente a ella.
      if (door.some((d) => d.x === tx && Math.abs(d.y - 1 - ty) === 0 && d.x === tx)) return false;
    }
  }
  return true;
}

export function placeEquipment(
  state: GameState,
  equipmentId: string,
  x: number,
  y: number,
  rot: 0 | 1,
): string | null {
  const type = typeOf(state, equipmentId);
  if (!canPlace(state, type, x, y, rot, equipmentId)) return 'No se puede colocar ahí.';
  state.map.placements = state.map.placements.filter((p) => p.equipmentId !== equipmentId);
  state.map.placements.push({ equipmentId, x, y, rot });
  return null;
}

export function removePlacement(state: GameState, equipmentId: string): void {
  state.map.placements = state.map.placements.filter((p) => p.equipmentId !== equipmentId);
}

/** Busca el primer hueco válido y coloca el objeto. Devuelve false si no hay sitio. */
export function autoPlace(state: GameState, equipmentId: string, type: EquipmentType): boolean {
  for (const rot of [0, 1] as const) {
    for (let y = 1; y < state.map.h - 1; y++) {
      for (let x = 1; x < state.map.w - 1; x++) {
        // Deja pasillos: solo posiciones con separación en filas alternas.
        if (y % 2 === 0 && type !== 'checkout') continue;
        if (canPlace(state, type, x, y, rot)) {
          state.map.placements.push({ equipmentId, x, y, rot });
          return true;
        }
      }
    }
  }
  // Sin restricción de pasillos como último recurso.
  for (const rot of [0, 1] as const) {
    for (let y = 1; y < state.map.h - 1; y++) {
      for (let x = 1; x < state.map.w - 1; x++) {
        if (canPlace(state, type, x, y, rot)) {
          state.map.placements.push({ equipmentId, x, y, rot });
          return true;
        }
      }
    }
  }
  return false;
}

export interface LayoutEffects {
  /** Multiplicador de disponibilidad de producto (distancia almacén → estanterías). */
  restockFactor: number;
  /** Multiplicador de capacidad de las cajas (distancia puerta → cajas). */
  queueFactor: number;
  /** Multiplicador de satisfacción por circulación (densidad de la sala). */
  circulationFactor: number;
}

/**
 * Efectos reales del layout sobre la simulación:
 * - estanterías lejos del almacén → reposición más lenta → menos disponibilidad;
 * - cajas lejos de la puerta → colas peor gestionadas → menos capacidad;
 * - sala saturada de muebles → peor circulación → menos satisfacción.
 */
export function layoutEffects(state: GameState): LayoutEffects {
  const map = state.map;
  const norm = map.w + map.h;
  const storagePoint = { x: STORAGE_ZONE.x + 1, y: STORAGE_ZONE.y + 1 };
  const door = doorTiles(map)[0];

  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  const shelves: number[] = [];
  const checkouts: number[] = [];
  for (const p of state.map.placements) {
    const type = typeOf(state, p.equipmentId);
    if (type === 'checkout') checkouts.push(dist(p, door));
    else shelves.push(dist(p, storagePoint));
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : norm / 2);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const restockFactor = clamp(1.12 - 0.45 * (avg(shelves) / norm), 0.85, 1.08);
  const queueFactor = clamp(1.12 - 0.45 * (avg(checkouts) / norm), 0.85, 1.08);

  const innerArea = (map.w - 2) * (map.h - 2) - STORAGE_ZONE.w * STORAGE_ZONE.h;
  const used = occupiedTiles(state).size;
  const freeRatio = 1 - used / innerArea;
  const circulationFactor = freeRatio < 0.45 ? clamp(0.85 + (freeRatio / 0.45) * 0.15, 0.85, 1) : 1;

  return { restockFactor, queueFactor, circulationFactor };
}

export function createMap(w: number, h: number): MapState {
  return { w, h, placements: [] };
}
