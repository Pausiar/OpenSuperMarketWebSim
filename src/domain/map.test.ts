import { describe, expect, it } from 'vitest';
import { autoPlace, canPlace, createMap, layoutEffects, placeEquipment, tilesOf } from './map';
import type { EquipmentType } from './data/equipment';
import type { EquipmentInstance } from './storeOps';
import { makeState } from '../test/helpers';
import type { GameState } from './state';

/** Mapa vacío de 12x10: puerta en (5,9) y (6,9), almacén en x 1-2, y 1-2. */
function emptyMapState(): GameState {
  const state = makeState(101);
  state.map = createMap(12, 10);
  state.store.equipment = [];
  return state;
}

function addEquipment(state: GameState, id: string, type: EquipmentType): void {
  const eq: EquipmentInstance = { id, type, broken: false };
  state.store.equipment.push(eq);
}

describe('mapa: canPlace', () => {
  it('no permite colocar equipamiento sobre las paredes del perímetro', () => {
    const state = emptyMapState();
    expect(canPlace(state, 'shelf', 0, 4, 0)).toBe(false); // pared izquierda
    expect(canPlace(state, 'shelf', 10, 4, 0)).toBe(false); // su footprint toca la pared derecha (x=11)
    expect(canPlace(state, 'shelf', 9, 4, 0)).toBe(true);
  });

  it('no permite invadir la zona reservada de almacén (esquina superior izquierda)', () => {
    const state = emptyMapState();
    expect(canPlace(state, 'shelf', 1, 1, 0)).toBe(false);
    expect(canPlace(state, 'shelf', 2, 1, 0)).toBe(false);
    expect(canPlace(state, 'shelf', 3, 1, 0)).toBe(true);
  });

  it('no permite tapar la puerta ni colocar nada que la atraviese', () => {
    const state = emptyMapState();
    // La puerta está en la pared inferior (y = h - 1); un objeto de 2x1 allí queda fuera.
    expect(canPlace(state, 'shelf', 5, 9, 0)).toBe(false);
    // Una caja (1x2) apoyada sobre la puerta sale del mapa.
    expect(canPlace(state, 'checkout', 5, 8, 0)).toBe(false);
  });

  it('impide solapar objetos ya colocados, salvo el propio si se ignora', () => {
    const state = emptyMapState();
    addEquipment(state, 'eq-1', 'shelf');
    expect(placeEquipment(state, 'eq-1', 3, 3, 0)).toBeNull();

    expect(canPlace(state, 'shelf', 4, 3, 0)).toBe(false); // solapa en (4,3)
    expect(canPlace(state, 'shelf', 5, 3, 0)).toBe(true); // justo al lado
    expect(canPlace(state, 'shelf', 3, 3, 0, 'eq-1')).toBe(true); // ignorando su propia pieza
  });

  it('tiene en cuenta la rotación: un objeto rotado ocupa su huella transpuesta', () => {
    const state = emptyMapState();
    addEquipment(state, 'eq-1', 'shelf');
    expect(placeEquipment(state, 'eq-1', 3, 3, 1)).toBeNull();
    // Rotado ocupa (3,3) y (3,4): una estantería horizontal en (3,4) choca.
    expect(canPlace(state, 'shelf', 3, 4, 0)).toBe(false);
    // Pero (4,3) sí está libre, porque la rotación ocupa solo la columna x=3.
    expect(canPlace(state, 'shelf', 4, 3, 0)).toBe(true);
    expect(tilesOf(state.map.placements[0], 'shelf')).toEqual([
      { x: 3, y: 3 },
      { x: 3, y: 4 },
    ]);
  });

  it('placeEquipment devuelve un mensaje de error cuando la posición no es válida', () => {
    const state = emptyMapState();
    addEquipment(state, 'eq-1', 'shelf');
    expect(placeEquipment(state, 'eq-1', 0, 0, 0)).toEqual(expect.any(String));
    expect(state.map.placements).toHaveLength(0);
  });
});

describe('mapa: autoPlace', () => {
  it('coloca el objeto en un hueco válido sin solapes', () => {
    const state = emptyMapState();
    addEquipment(state, 'eq-1', 'shelf');
    expect(autoPlace(state, 'eq-1', 'shelf')).toBe(true);
    expect(state.map.placements).toHaveLength(1);
    expect(canPlace(state, 'shelf', state.map.placements[0].x, state.map.placements[0].y, 0, 'eq-1')).toBe(true);
  });

  it('llena el mapa sin solapes y devuelve false cuando no queda sitio', () => {
    const state = emptyMapState();
    let placed = 0;
    for (let i = 0; i < 200; i++) {
      const id = `eq-${i}`;
      addEquipment(state, id, 'shelf');
      if (!autoPlace(state, id, 'shelf')) break;
      placed++;
    }
    expect(placed).toBeGreaterThan(5);

    const tiles = state.map.placements.flatMap((p) => tilesOf(p, 'shelf'));
    const unique = new Set(tiles.map((t) => `${t.x},${t.y}`));
    expect(unique.size).toBe(tiles.length);
    // Ninguna pieza cae en la zona de almacén ni en la puerta.
    expect(tiles.some((t) => t.x <= 2 && t.y <= 2)).toBe(false);
    expect(tiles.some((t) => t.y >= 9)).toBe(false);

    // Una estantería más ya no cabe.
    addEquipment(state, 'eq-extra', 'shelf');
    expect(autoPlace(state, 'eq-extra', 'shelf')).toBe(false);
  });

  it('el mapa inicial de una partida nueva tiene todo el equipamiento colocado dentro del mapa', () => {
    const state = makeState(7);
    expect(state.map.placements).toHaveLength(state.store.equipment.length);
    for (const p of state.map.placements) {
      const type = state.store.equipment.find((e) => e.id === p.equipmentId)!.type;
      for (const t of tilesOf(p, type)) {
        expect(t.x).toBeGreaterThanOrEqual(1);
        expect(t.y).toBeGreaterThanOrEqual(1);
        expect(t.x).toBeLessThanOrEqual(state.map.w - 2);
        expect(t.y).toBeLessThanOrEqual(state.map.h - 2);
      }
    }
  });
});

describe('mapa: layoutEffects (dirección de los efectos)', () => {
  it('una caja cerca de la puerta da mayor capacidad de cola que una lejana', () => {
    const near = emptyMapState();
    addEquipment(near, 'chk', 'checkout');
    expect(placeEquipment(near, 'chk', 6, 6, 0)).toBeNull(); // a 4 casillas de la puerta

    const far = emptyMapState();
    addEquipment(far, 'chk', 'checkout');
    expect(placeEquipment(far, 'chk', 9, 1, 0)).toBeNull(); // a 12 casillas de la puerta

    expect(layoutEffects(near).queueFactor).toBeGreaterThan(layoutEffects(far).queueFactor);
  });

  it('una estantería cerca del almacén da mayor disponibilidad que una lejana', () => {
    const near = emptyMapState();
    addEquipment(near, 'sh', 'shelf');
    expect(placeEquipment(near, 'sh', 3, 2, 0)).toBeNull(); // junto a la zona de almacén

    const far = emptyMapState();
    addEquipment(far, 'sh', 'shelf');
    expect(placeEquipment(far, 'sh', 8, 7, 0)).toBeNull(); // al fondo a la derecha

    expect(layoutEffects(near).restockFactor).toBeGreaterThan(layoutEffects(far).restockFactor);
  });

  it('una sala despejada no penaliza la circulación', () => {
    const state = emptyMapState();
    expect(layoutEffects(state).circulationFactor).toBe(1);
  });
});
