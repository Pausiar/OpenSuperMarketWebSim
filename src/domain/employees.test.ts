import { describe, expect, it } from 'vitest';
import { fire, hire, processPayrollMonthly } from './employees';
import { makeCtx, makeState } from '../test/helpers';

describe('empleados', () => {
  it('contrata un candidato y lo saca de la lista', () => {
    const state = makeState();
    const ctx = makeCtx(state);
    const applicant = state.applicants[0];
    const before = state.employees.length;

    expect(hire(ctx, applicant.id)).toBeNull();
    expect(state.employees).toHaveLength(before + 1);
    expect(state.applicants.find((a) => a.id === applicant.id)).toBeUndefined();
    const hired = state.employees[state.employees.length - 1];
    expect(hired.name).toBe(applicant.name);
    expect(hired.status).toBe('active');
  });

  it('despide con finiquito y elimina sus turnos', () => {
    const state = makeState();
    const ctx = makeCtx(state);
    const emp = state.employees[0];
    const balanceBefore = state.ledger.balanceCents;

    expect(fire(ctx, emp.id)).toBeNull();
    expect(state.ledger.balanceCents).toBe(balanceBefore - Math.round(emp.salaryCents / 2));
    expect(state.employees.find((e) => e.id === emp.id)).toBeUndefined();
    expect(state.shifts.some((s) => s.employeeId === emp.id)).toBe(false);
  });

  it('paga nóminas mensuales por el total de salarios', () => {
    const state = makeState();
    const ctx = makeCtx(state);
    state.ledger.transactions = [];
    const balanceBefore = state.ledger.balanceCents;
    const expected = state.employees.reduce((a, e) => a + e.salaryCents, 0);

    processPayrollMonthly(ctx);

    // La plantilla inicial no tiene horas extra.
    expect(state.ledger.balanceCents).toBe(balanceBefore - expected);
    const tx = state.ledger.transactions.find((t) => t.category === 'salarios');
    expect(tx?.amountCents).toBe(expected);
  });
});
