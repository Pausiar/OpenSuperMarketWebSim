import { describe, expect, it } from 'vitest';
import { MIN_PER_DAY } from '../core/time';
import { makeState } from '../test/helpers';
import { createSystems, GameEngine } from './index';

describe('simulación integrada', () => {
  it('un día completo genera ventas, consume stock y cierra estadísticas', () => {
    const state = makeState(777);
    const stockBefore = state.lots.reduce((a, l) => a + l.qty, 0);
    const engine = new GameEngine(state, createSystems());

    engine.advanceMinutes(MIN_PER_DAY); // día 0 07:00 → día 1 07:00

    const salesTx = state.ledger.transactions.filter((t) => t.category === 'ventas');
    expect(salesTx.length).toBeGreaterThan(0);
    const revenue = salesTx.reduce((a, t) => a + t.amountCents, 0);
    expect(revenue).toBeGreaterThan(0);
    expect(state.lots.reduce((a, l) => a + l.qty, 0)).toBeLessThan(stockBefore);

    // El día 0 quedó archivado con clientes atendidos.
    const day0 = state.stats.days.find((d) => d.day === 0)!;
    expect(day0.served).toBeGreaterThan(0);
    expect(day0.revenueCents).toBe(revenue);
  });

  it('es determinista: misma semilla, mismo resultado', () => {
    const run = () => {
      const state = makeState(42);
      new GameEngine(state, createSystems()).advanceMinutes(MIN_PER_DAY * 3);
      return {
        balance: state.ledger.balanceCents,
        txCount: state.ledger.transactions.length,
        stock: state.lots.reduce((a, l) => a + l.qty, 0),
        satisfaction: state.store.satisfaction,
      };
    };
    expect(run()).toEqual(run());
  });

  it('un mes completo genera facturas, nóminas e informe mensual', () => {
    const state = makeState(2024);
    const engine = new GameEngine(state, createSystems());

    engine.advanceMinutes(MIN_PER_DAY * 31);

    expect(state.stats.monthly).toHaveLength(1);
    expect(state.bills.some((b) => b.category === 'electricidad')).toBe(true);
    expect(state.bills.some((b) => b.category === 'agua')).toBe(true);
    expect(state.ledger.transactions.some((t) => t.category === 'salarios')).toBe(true);
    expect(state.ledger.transactions.some((t) => t.category === 'alquiler')).toBe(true);
  });

  it('sin cajeros no hay ventas', () => {
    const state = makeState(9);
    state.shifts = []; // borra todos los turnos
    const engine = new GameEngine(state, createSystems());
    engine.advanceMinutes(MIN_PER_DAY);
    expect(state.ledger.transactions.filter((t) => t.category === 'ventas')).toHaveLength(0);
    expect(state.stats.days[0].lost).toBeGreaterThan(0);
  });
});
