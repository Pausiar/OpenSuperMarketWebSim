import { describe, expect, it } from 'vitest';
import { MIN_PER_DAY } from '../core/time';
import { demandFactor, electricityPriceFactor, supplierPriceFactor } from '../domain/state';
import { makeCtx, makeState } from '../test/helpers';
import { eventSystem } from './eventSystem';

function atDay(state: ReturnType<typeof makeState>, day: number): void {
  state.clock.timeMin = day * MIN_PER_DAY + 8 * 60;
}

describe('eventos: modificadores temporales', () => {
  it('un modificador de demanda está activo hasta su último día y luego expira', () => {
    const state = makeState(11);
    state.modifiers = [
      { id: 'mod-1', kind: 'demand', factor: 1.3, untilDay: 5, label: 'Evento de prueba' },
    ];

    atDay(state, 4);
    expect(demandFactor(state)).toBeCloseTo(1.3);
    atDay(state, 5);
    expect(demandFactor(state)).toBeCloseTo(1.3);
    atDay(state, 6);
    expect(demandFactor(state)).toBe(1);
  });

  it('la subida de luz deja de aplicarse al terminar su duración', () => {
    const state = makeState(12);
    state.modifiers = [
      { id: 'mod-1', kind: 'electricityPrice', factor: 1.35, untilDay: 30, label: 'Luz' },
    ];
    atDay(state, 30);
    expect(electricityPriceFactor(state)).toBeCloseTo(1.35);
    atDay(state, 31);
    expect(electricityPriceFactor(state)).toBe(1);
  });

  it('una subida de precios de proveedor solo afecta a ese proveedor', () => {
    const state = makeState(13);
    state.modifiers = [
      {
        id: 'mod-1',
        kind: 'supplierPrice',
        factor: 1.2,
        untilDay: 20,
        label: 'Proveedor A',
        supplierId: 'sup-a',
      },
    ];
    atDay(state, 10);
    expect(supplierPriceFactor(state, 'sup-a')).toBeCloseTo(1.2);
    expect(supplierPriceFactor(state, 'sup-b')).toBe(1);
  });

  it('dos modificadores de demanda activos a la vez se multiplican', () => {
    const state = makeState(14);
    state.modifiers = [
      { id: 'mod-up', kind: 'demand', factor: 1.3, untilDay: 10, label: 'Evento' },
      { id: 'mod-down', kind: 'demand', factor: 0.75, untilDay: 10, label: 'Obras' },
    ];
    atDay(state, 3);
    expect(demandFactor(state)).toBeCloseTo(1.3 * 0.75);
  });

  it('no se lanzan eventos durante los días de gracia iniciales', () => {
    const state = makeState(15);
    const ctx = makeCtx(state);
    for (let day = 0; day < 4; day++) {
      for (let i = 0; i < 200; i++) eventSystem.onDayStart?.(ctx, day);
    }
    expect(state.modifiers).toHaveLength(0);
  });

  it('tras un periodo largo, todos los modificadores generados por eventos han expirado', () => {
    const state = makeState(16);
    const ctx = makeCtx(state);
    for (let day = 4; day <= 400; day++) {
      atDay(state, day);
      eventSystem.onDayStart?.(ctx, day);
    }
    // Algún evento debió lanzarse en 400 días.
    expect(state.notifications.length + state.modifiers.length).toBeGreaterThan(0);

    // Los modificadores duran como mucho 30 días: a partir del día 431 no queda ninguno.
    atDay(state, 431);
    expect(demandFactor(state)).toBe(1);
    expect(electricityPriceFactor(state)).toBe(1);
    expect(supplierPriceFactor(state, 'sup-cualquiera')).toBe(1);
  });
});
