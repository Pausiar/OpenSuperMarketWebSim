import { describe, expect, it } from 'vitest';
import { createMap, doorTiles, tilesOf, type MapState } from '../../domain/map';
import {
  accessTile,
  buildWalkGrid,
  checkoutQueueSlots,
  findPath,
  isWalkable,
  pixelToTile,
  shopperRoute,
  tileToPixel,
  type KindOf,
  type Tile,
  type WalkGrid,
} from './geometry';

const KINDS: Record<string, 'shelf' | 'checkout'> = {
  shelf1: 'shelf',
  shelf2: 'shelf',
  till1: 'checkout',
};
const kindOf: KindOf = (id) => {
  const k = KINDS[id];
  if (!k) throw new Error(`unknown ${id}`);
  return k;
};

function makeMap(): MapState {
  const map = createMap(10, 8);
  // Estantería horizontal en (3,3)-(4,3); segunda en (3,5)-(4,5).
  map.placements.push({ equipmentId: 'shelf1', x: 3, y: 3, rot: 0 });
  map.placements.push({ equipmentId: 'shelf2', x: 3, y: 5, rot: 0 });
  // Caja vertical en (7,4)-(7,5).
  map.placements.push({ equipmentId: 'till1', x: 7, y: 4, rot: 0 });
  return map;
}

function equipmentSet(map: MapState): Set<string> {
  const set = new Set<string>();
  for (const p of map.placements) {
    for (const t of tilesOf(p, kindOf(p.equipmentId))) set.add(`${t.x},${t.y}`);
  }
  return set;
}

describe('conversión tile <-> píxel', () => {
  it('usa el centro de la casilla y vuelve a la misma casilla', () => {
    expect(tileToPixel({ x: 2, y: 3 }, 32)).toEqual({ x: 80, y: 112 });
    expect(pixelToTile({ x: 80, y: 112 }, 32)).toEqual({ x: 2, y: 3 });
    expect(pixelToTile({ x: 95.9, y: 127.9 }, 32)).toEqual({ x: 2, y: 3 });
  });
});

describe('rejilla transitable', () => {
  it('bloquea paredes y equipamiento, deja libre la puerta', () => {
    const map = makeMap();
    const grid = buildWalkGrid(map, kindOf);
    const [d0, d1] = doorTiles(map);
    expect(isWalkable(grid, d0!)).toBe(true);
    expect(isWalkable(grid, d1!)).toBe(true);
    expect(isWalkable(grid, { x: 0, y: 2 })).toBe(false);
    expect(isWalkable(grid, { x: 3, y: 4 })).toBe(true);
    expect(isWalkable(grid, { x: 3, y: 3 })).toBe(false);
    expect(isWalkable(grid, { x: 7, y: 5 })).toBe(false);
    expect(isWalkable(grid, { x: 1, y: 1 })).toBe(true);
  });
});

describe('ruta de cliente', () => {
  it('va puerta -> estantería -> caja -> puerta sin pisar equipamiento ni paredes', () => {
    const map = makeMap();
    const grid = buildWalkGrid(map, kindOf);
    const door = doorTiles(map)[0]!;
    const shelf = accessTile(grid, tilesOf(map.placements[0]!, 'shelf'))!;
    const till = accessTile(grid, tilesOf(map.placements[2]!, 'checkout'))!;
    const route = shopperRoute(grid, door, shelf, till);
    expect(route).not.toBeNull();
    const blocked = equipmentSet(map);

    for (const leg of [route!.toShelf, route!.toCheckout, route!.toDoor]) {
      expect(leg.length).toBeGreaterThan(0);
      for (const t of leg) {
        expect(blocked.has(`${t.x},${t.y}`)).toBe(false);
        expect(isWalkable(grid, t)).toBe(true);
      }
      for (let i = 1; i < leg.length; i++) {
        const a = leg[i - 1]!;
        const b = leg[i]!;
        expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
      }
    }

    expect(route!.toShelf[0]).toEqual(door);
    expect(route!.toShelf.at(-1)).toEqual(shelf);
    expect(route!.toCheckout.at(-1)).toEqual(till);
    expect(route!.toDoor.at(-1)).toEqual(door);
  });

  it('alcanza la caja desde la puerta', () => {
    const map = makeMap();
    const grid = buildWalkGrid(map, kindOf);
    const door = doorTiles(map)[0]!;
    const till = accessTile(grid, tilesOf(map.placements[2]!, 'checkout'))!;
    const path = findPath(grid, door, till);
    expect(path).not.toBeNull();
    expect(path!.at(-1)).toEqual(till);
  });

  it('devuelve null si el destino está aislado', () => {
    const grid: WalkGrid = {
      w: 3,
      h: 1,
      walkable: [[true, false, true]],
    };
    expect(findPath(grid, { x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull();
    expect(findPath(grid, { x: 0, y: 0 }, { x: 1, y: 0 })).toBeNull();
  });
});

describe('cola de cajas', () => {
  it('devuelve casillas únicas, transitables, empezando en la atención y sin la puerta', () => {
    const map = makeMap();
    const grid = buildWalkGrid(map, kindOf);
    const door = doorTiles(map)[0]!;
    const access = accessTile(grid, tilesOf(map.placements[2]!, 'checkout'))!;
    const slots = checkoutQueueSlots(grid, door, access, 4);
    expect(slots).toHaveLength(4);
    expect(slots[0]).toEqual(access);
    const keys = new Set(slots.map((t: Tile) => `${t.x},${t.y}`));
    expect(keys.size).toBe(4);
    for (const t of slots) {
      expect(isWalkable(grid, t)).toBe(true);
      expect(t).not.toEqual(door);
    }
  });

  it('no supera el número de casillas disponibles', () => {
    const map = makeMap();
    const grid = buildWalkGrid(map, kindOf);
    const door = doorTiles(map)[0]!;
    const access = accessTile(grid, tilesOf(map.placements[2]!, 'checkout'))!;
    expect(checkoutQueueSlots(grid, door, access, 0)).toEqual([]);
    expect(checkoutQueueSlots(grid, door, door, 3)).toEqual([]);
  });
});
