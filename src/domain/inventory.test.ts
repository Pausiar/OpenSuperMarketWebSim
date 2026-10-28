import { describe, expect, it } from 'vitest';
import { addLot, consumeStock, removeExpiredLots, stockOf } from './inventory';
import { makeCtx, makeState } from '../test/helpers';

describe('inventario', () => {
  it('consume FIFO priorizando lo que antes caduca y nunca deja stock negativo', () => {
    const state = makeState();
    state.lots = [];
    addLot(state, 'leche', 20, 9); // caduca día 9
    addLot(state, 'leche', 20, 2); // caduca día 2 → debe salir primero

    const sold = consumeStock(state, 'leche', 25);

    expect(sold).toBe(25);
    expect(stockOf(state, 'leche')).toBe(15);
    // El lote que queda es el que caduca más tarde.
    const remaining = state.lots.filter((l) => l.productId === 'leche');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].expiresDay).toBe(9);

    // Pide más de lo que hay: devuelve lo consumido real.
    expect(consumeStock(state, 'leche', 999)).toBe(15);
    expect(stockOf(state, 'leche')).toBe(0);
  });

  it('retira lotes caducados y calcula la pérdida a coste', () => {
    const state = makeState();
    state.lots = [];
    state.clock.timeMin = 5 * 1440; // día 5
    addLot(state, 'pan', 10, 4); // caducado (era hasta el día 4)
    addLot(state, 'pan', 8, 6); // vigente
    addLot(state, 'pasta', 5, null); // no perecedero

    const result = removeExpiredLots(makeCtx(state));

    expect(result.units).toBe(10);
    expect(result.valueCents).toBe(10 * 38); // coste base del pan
    expect(stockOf(state, 'pan')).toBe(8);
    expect(stockOf(state, 'pasta')).toBe(5);
  });
});
