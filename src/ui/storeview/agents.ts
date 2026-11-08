import { doorTiles, tilesOf, type MapState } from '../../domain/map';
import {
  accessTile,
  buildWalkGrid,
  checkoutQueueSlots,
  findPath,
  shopperRoute,
  type EquipmentKind,
  type Tile,
  type WalkGrid,
} from './geometry';

/** Agentes puramente visuales: PRNG propio de la UI, nunca el RNG de la simulación. */
export const MAX_AGENTS = 60;
/** Clientes visibles por cliente real/hora (la UI solo da ambiente, no cuenta de verdad). */
const VISUAL_SCALE = 0.3;
const WALK_TILES_PER_SEC = 2.2;
const SHELF_PAUSE_SEC = 1.2;

export type Rng = () => number;

/** mulberry32: PRNG determinista y barato. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Agent {
  id: number;
  path: Tile[];
  /** Posición en casillas (puede ser fraccionaria). */
  x: number;
  y: number;
  /** Índice de la próxima casilla del camino. */
  next: number;
  /** Índice del camino donde se detiene a mirar la estantería (-1 = ninguno). */
  pauseAt: number;
  pauseLeft: number;
  hue: number;
}

export interface CheckoutSpot {
  id: string;
  broken: boolean;
  access: Tile;
  tiles: Tile[];
}

export interface Layout {
  grid: WalkGrid;
  door: Tile;
  shelves: Tile[];
  checkouts: CheckoutSpot[];
}

export function buildLayout(
  map: MapState,
  kinds: readonly { id: string; type: EquipmentKind; broken: boolean }[],
): Layout {
  const byId = new Map(kinds.map((k) => [k.id, k]));
  const kindOf = (id: string): EquipmentKind => byId.get(id)?.type ?? 'shelf';
  const grid = buildWalkGrid(map, kindOf);
  const door = doorTiles(map)[0] ?? { x: 0, y: 0 };
  const shelves: Tile[] = [];
  const checkouts: CheckoutSpot[] = [];
  for (const p of map.placements) {
    const kind = kindOf(p.equipmentId);
    const tiles = tilesOf(p, kind);
    const access = accessTile(grid, tiles);
    if (!access) continue;
    if (kind === 'checkout') {
      checkouts.push({ id: p.equipmentId, broken: byId.get(p.equipmentId)?.broken ?? false, access, tiles });
    } else shelves.push(access);
  }
  return { grid, door, shelves, checkouts };
}

/** Cuántos clientes visuales deben aparecer en `simMinutes` minutos de juego (parte fraccionaria incluida). */
export function spawnBudget(potential: number, simMinutes: number): number {
  if (potential <= 0 || simMinutes <= 0) return 0;
  return (potential / 60) * simMinutes * VISUAL_SCALE;
}

/** Proporción de clientes que se van sin comprar. */
export function leaveFraction(potential: number, lost: number): number {
  if (potential <= 0) return 0;
  return Math.min(1, Math.max(0, lost / potential));
}

/** Reparte la cola estimada entre las cajas abiertas (reparto parejo, el resto a las primeras). */
export function distributeQueue(estimate: number, open: number, perCheckoutCap: number): number[] {
  if (open <= 0) return [];
  const total = Math.max(0, Math.round(estimate));
  const base = Math.floor(total / open);
  const extra = total % open;
  return Array.from({ length: open }, (_, i) => Math.min(perCheckoutCap, base + (i < extra ? 1 : 0)));
}

/** Cajas con cajero visible: las primeras `openCount` no averiadas. */
export function openCheckouts(layout: Layout, openCount: number): CheckoutSpot[] {
  return layout.checkouts.filter((c) => !c.broken).slice(0, Math.max(0, openCount));
}

/** Casillas de cola por caja abierta (la 0 es la atención). */
export function queueTiles(layout: Layout, open: CheckoutSpot[], estimate: number): Tile[][] {
  const counts = distributeQueue(estimate, open.length, 6);
  return open.map((c, i) => checkoutQueueSlots(layout.grid, layout.door, c.access, counts[i] ?? 0));
}

let nextId = 1;

/** Crea un cliente; null si el mapa no permite ninguna ruta. */
export function spawnAgent(layout: Layout, rng: Rng, leaves: boolean): Agent | null {
  const shelf = layout.shelves[Math.floor(rng() * layout.shelves.length)];
  if (!shelf) return null;
  let path: Tile[];
  if (leaves || layout.checkouts.length === 0) {
    const out = findPath(layout.grid, layout.door, shelf);
    const back = out ? [...out].reverse().slice(1) : null;
    if (!out || !back) return null;
    path = [...out, ...back];
  } else {
    const open = layout.checkouts.filter((c) => !c.broken);
    const pool = open.length > 0 ? open : layout.checkouts;
    const co = pool[Math.floor(rng() * pool.length)];
    if (!co) return null;
    const r = shopperRoute(layout.grid, layout.door, shelf, co.access);
    if (!r) return null;
    path = [...r.toShelf, ...r.toCheckout.slice(1), ...r.toDoor.slice(1)];
  }
  const start = path[0];
  if (!start) return null;
  const shelfIdx = path.findIndex((t) => t.x === shelf.x && t.y === shelf.y);
  return {
    id: nextId++,
    path,
    x: start.x,
    y: start.y,
    next: 1,
    pauseAt: shelfIdx,
    pauseLeft: SHELF_PAUSE_SEC * (0.6 + rng() * 0.8),
    hue: Math.floor(rng() * 360),
  };
}

/** Avanza un agente `dtSec` segundos (ya escalados por la velocidad). Devuelve true si terminó. */
export function stepAgent(a: Agent, dtSec: number): boolean {
  let budget = dtSec;
  while (budget > 0) {
    const target = a.path[a.next];
    if (!target) return true;
    if (a.pauseAt === a.next - 1 && a.pauseLeft > 0) {
      const used = Math.min(budget, a.pauseLeft);
      a.pauseLeft -= used;
      budget -= used;
      continue;
    }
    const dx = target.x - a.x;
    const dy = target.y - a.y;
    const dist = Math.hypot(dx, dy);
    const reach = WALK_TILES_PER_SEC * budget;
    if (reach >= dist) {
      a.x = target.x;
      a.y = target.y;
      a.next++;
      budget -= dist / WALK_TILES_PER_SEC;
    } else {
      a.x += (dx / dist) * reach;
      a.y += (dy / dist) * reach;
      budget = 0;
    }
  }
  return a.next >= a.path.length;
}

export interface Crowd {
  agents: Agent[];
  carry: number;
}

/**
 * Un paso de la multitud. `simMinutes` son minutos de juego transcurridos y `dtSec` el tiempo
 * visual (0 si está en pausa). Muta solo el `crowd` local, jamás el estado del juego.
 */
export function stepCrowd(
  crowd: Crowd,
  layout: Layout,
  rng: Rng,
  live: { potential: number; lost: number },
  simMinutes: number,
  dtSec: number,
): void {
  if (dtSec <= 0) return;
  crowd.agents = crowd.agents.filter((a) => !stepAgent(a, dtSec));
  crowd.carry += spawnBudget(live.potential, simMinutes);
  const leave = leaveFraction(live.potential, live.lost);
  while (crowd.carry >= 1) {
    crowd.carry -= 1;
    if (crowd.agents.length >= MAX_AGENTS) {
      crowd.carry = 0;
      break;
    }
    const agent = spawnAgent(layout, rng, rng() < leave);
    if (agent) crowd.agents.push(agent);
  }
}
