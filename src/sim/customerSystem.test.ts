import { describe, expect, it } from 'vitest';
import { makeCtx, makeState } from '../test/helpers';
import { customerSystem } from './customerSystem';

/** Simula las horas de apertura del día 0 (lunes) con el estado dado. */
function runOpeningHours(state: ReturnType<typeof makeState>): void {
  const ctx = makeCtx(state);
  for (let hour = 9; hour < 22; hour++) {
    state.clock.timeMin = hour * 60;
    customerSystem.onHour?.(ctx, hour);
  }
}

describe('clientes: sin cajeros y precios', () => {
  it('sin cajeros en turno, todos los clientes se pierden y no hay ventas', () => {
    const state = makeState(9);
    state.shifts = [];
    const satisfactionBefore = state.store.satisfaction;

    runOpeningHours(state);

    const today = state.stats.today;
    expect(today.customers).toBeGreaterThan(0);
    expect(today.served).toBe(0);
    expect(today.lost).toBe(today.customers);
    expect(today.revenueCents).toBe(0);
    expect(today.itemsSold).toBe(0);
    expect(state.store.satisfaction).toBeLessThan(satisfactionBefore);
  });

  it('con cajeros pero sin cajas operativas, todos los clientes se pierden', () => {
    const state = makeState(10);
    for (const eq of state.store.equipment) {
      if (eq.type === 'checkout') eq.broken = true;
    }

    runOpeningHours(state);

    const today = state.stats.today;
    expect(today.customers).toBeGreaterThan(0);
    expect(today.served).toBe(0);
    expect(today.lost).toBe(today.customers);
  });

  it('con cajeros en turno, atender clientes genera ventas', () => {
    const state = makeState(21);
    runOpeningHours(state);
    expect(state.stats.today.served).toBeGreaterThan(0);
    expect(state.stats.today.itemsSold).toBeGreaterThan(0);
  });

  it('un precio más alto vende menos unidades que un precio más bajo', () => {
    const unitsAt = (seed: number, multiplier: number): number => {
      const state = makeState(seed);
      for (const p of Object.values(state.products)) {
        p.sellingPriceCents = Math.round(p.sellingPriceCents * multiplier);
      }
      runOpeningHours(state);
      return state.stats.today.itemsSold;
    };

    // Suma de varias semillas para que el resultado no dependa de una tirada concreta.
    let cheap = 0;
    let expensive = 0;
    for (const seed of [1, 2, 3, 4]) {
      cheap += unitsAt(seed, 1);
      expensive += unitsAt(seed, 2.5);
    }
    expect(cheap).toBeGreaterThan(0);
    expect(expensive).toBeLessThan(cheap);
  });
});
