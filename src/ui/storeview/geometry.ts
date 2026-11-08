import { doorTiles, tilesOf, type MapState } from '../../domain/map';

/** Tipo de equipamiento tal y como lo define el dominio (se deriva de map.ts para no importar de otros módulos). */
export type EquipmentKind = Parameters<typeof tilesOf>[1];

/** Resuelve el tipo de equipamiento a partir de su id (los placements solo guardan el id). */
export type KindOf = (equipmentId: string) => EquipmentKind;

export interface Tile {
  x: number;
  y: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Rejilla de casillas transitables. `walkable[y][x]` es true si un cliente puede pisarla. */
export interface WalkGrid {
  w: number;
  h: number;
  walkable: boolean[][];
}

export interface ShopperRoute {
  /** Puerta -> estantería (incluye ambos extremos). */
  toShelf: Tile[];
  /** Estantería -> caja (incluye ambos extremos). */
  toCheckout: Tile[];
  /** Caja -> puerta (incluye ambos extremos). */
  toDoor: Tile[];
}

const DIRS: readonly [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** Centro en píxeles de una casilla. */
export function tileToPixel(tile: Tile, tileSize: number): Point {
  return { x: tile.x * tileSize + tileSize / 2, y: tile.y * tileSize + tileSize / 2 };
}

/** Casilla que contiene un punto en píxeles. */
export function pixelToTile(point: Point, tileSize: number): Tile {
  return { x: Math.floor(point.x / tileSize), y: Math.floor(point.y / tileSize) };
}

/**
 * Construye la rejilla transitable: bloquea paredes (borde del mapa salvo la puerta)
 * y todas las casillas ocupadas por equipamiento.
 */
export function buildWalkGrid(map: MapState, kindOf: KindOf): WalkGrid {
  const walkable: boolean[][] = [];
  for (let y = 0; y < map.h; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < map.w; x++) {
      const border = x === 0 || y === 0 || x === map.w - 1 || y === map.h - 1;
      const isDoor = doorTiles(map).some((d) => d.x === x && d.y === y);
      row.push(!(border && !isDoor));
    }
    walkable.push(row);
  }
  for (const p of map.placements) {
    for (const t of tilesOf(p, kindOf(p.equipmentId))) {
      const row = walkable[t.y];
      if (row && t.x >= 0 && t.x < map.w) row[t.x] = false;
    }
  }
  return { w: map.w, h: map.h, walkable };
}

export function isWalkable(grid: WalkGrid, tile: Tile): boolean {
  return grid.walkable[tile.y]?.[tile.x] === true;
}

/**
 * Camino más corto (BFS, 4 direcciones) entre dos casillas, ambas incluidas.
 * Devuelve null si no hay camino o si alguno de los extremos no es transitable.
 */
export function findPath(grid: WalkGrid, from: Tile, to: Tile): Tile[] | null {
  if (!isWalkable(grid, from) || !isWalkable(grid, to)) return null;
  const key = (t: Tile) => t.y * grid.w + t.x;
  const goal = key(to);
  const prev = new Map<number, number>([[key(from), -1]]);
  const queue: Tile[] = [from];
  let head = 0;
  while (head < queue.length && !prev.has(goal)) {
    const cur = queue[head++];
    if (!cur) break;
    for (const [dx, dy] of DIRS) {
      const next = { x: cur.x + dx, y: cur.y + dy };
      if (!isWalkable(grid, next) || prev.has(key(next))) continue;
      prev.set(key(next), key(cur));
      queue.push(next);
    }
  }
  if (!prev.has(goal)) return null;
  const path: Tile[] = [];
  for (let k = goal; k !== -1; k = prev.get(k) ?? -1) {
    path.push({ x: k % grid.w, y: Math.floor(k / grid.w) });
  }
  return path.reverse();
}

/** Primera casilla transitable adyacente a una huella de equipamiento (desde donde se atiende o se coge un producto). */
export function accessTile(grid: WalkGrid, footprint: Tile[]): Tile | null {
  for (const t of footprint) {
    for (const [dx, dy] of DIRS) {
      const n = { x: t.x + dx, y: t.y + dy };
      if (isWalkable(grid, n)) return n;
    }
  }
  return null;
}

/**
 * Ruta de un cliente: puerta -> estantería -> caja -> puerta.
 * `shelf` y `checkout` son casillas transitables (normalmente de accessTile).
 */
export function shopperRoute(
  grid: WalkGrid,
  door: Tile,
  shelf: Tile,
  checkout: Tile,
): ShopperRoute | null {
  const toShelf = findPath(grid, door, shelf);
  const toCheckout = findPath(grid, shelf, checkout);
  const toDoor = findPath(grid, checkout, door);
  if (!toShelf || !toCheckout || !toDoor) return null;
  return { toShelf, toCheckout, toDoor };
}

/**
 * Posiciones de la cola de una caja. La casilla 0 es la de atención (`checkoutAccess`);
 * las siguientes siguen el camino hacia la puerta, sin incluir la propia puerta.
 */
export function checkoutQueueSlots(
  grid: WalkGrid,
  door: Tile,
  checkoutAccess: Tile,
  count: number,
): Tile[] {
  const path = findPath(grid, checkoutAccess, door);
  if (!path || count <= 0) return [];
  return path.slice(0, -1).slice(0, count);
}
