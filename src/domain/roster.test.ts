import { describe, expect, it } from 'vitest';
import { addShift, scheduleIssues, weeklyMinutes } from './roster';
import { makeCtx, makeState } from '../test/helpers';

describe('turnos', () => {
  it('detecta solapamientos del mismo empleado', () => {
    const state = makeState();
    const ctx = makeCtx(state);
    const cashier = state.employees.find((e) => e.role === 'cashier')!;
    // Ya tiene turno el lunes 9:00-15:30.
    expect(addShift(ctx, cashier.id, 0, 14 * 60, 18 * 60)).toMatch(/solapa/i);
  });

  it('limita la duración de los turnos', () => {
    const state = makeState();
    const ctx = makeCtx(state);
    const emp = state.employees.find((e) => e.role === 'stocker')!;
    expect(addShift(ctx, emp.id, 6, 8 * 60, 8 * 60 + 60)).toMatch(/al menos 2 horas/i);
    expect(addShift(ctx, emp.id, 6, 8 * 60, 19 * 60)).toMatch(/10 horas/i);
  });

  it('añade turnos válidos y acumula horas semanales', () => {
    const state = makeState();
    const ctx = makeCtx(state);
    const stocker = state.employees.find((e) => e.role === 'stocker')!;
    const before = weeklyMinutes(state, stocker.id);
    expect(addShift(ctx, stocker.id, 5, 8 * 60, 12 * 60)).toBeNull();
    expect(weeklyMinutes(state, stocker.id)).toBe(before + 240);
  });

  it('avisa de días sin cobertura de caja', () => {
    const state = makeState();
    // La plantilla inicial cubre L-S; el domingo no tiene cajeros.
    const issues = scheduleIssues(state);
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('Dom'))).toBe(true);
  });
});
