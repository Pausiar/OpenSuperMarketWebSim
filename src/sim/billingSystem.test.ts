import { describe, expect, it } from 'vitest';
import { MIN_PER_DAY } from '../core/time';
import { createBill, payBill } from '../domain/economy';
import { LATE_FEE_RATE } from '../domain/data/loans';
import { makeCtx, makeState } from '../test/helpers';
import { billingSystem } from './billingSystem';
import { customerSystem } from './customerSystem';

function setDay(state: ReturnType<typeof makeState>, day: number): void {
  state.clock.timeMin = day * MIN_PER_DAY + 7 * 60;
}

function startDay(ctx: ReturnType<typeof makeCtx>, day: number): void {
  setDay(ctx.state, day);
  billingSystem.onDayStart?.(ctx, day);
}

describe('facturación: impagos, recargos y corte', () => {
  it('una factura no pagada pasa a vencida y recibe el recargo una sola vez', () => {
    const state = makeState(1);
    state.bills = [];
    const ctx = makeCtx(state);
    const bill = createBill(state, {
      category: 'agua',
      label: 'Factura de agua',
      periodLabel: 'Test',
      lines: [],
      totalCents: 10_000,
      issuedDay: 0,
      dueDay: 0,
    });

    startDay(ctx, 0); // el mismo día del vencimiento aún no es impago
    expect(bill.status).toBe('pending');

    startDay(ctx, 1);
    expect(bill.status).toBe('overdue');
    expect(bill.lateFeeApplied).toBe(true);
    expect(bill.totalCents).toBe(Math.round(10_000 * (1 + LATE_FEE_RATE)));

    startDay(ctx, 2);
    startDay(ctx, 3);
    expect(bill.totalCents).toBe(Math.round(10_000 * (1 + LATE_FEE_RATE)));
  });

  it('un impago de electricidad corta el suministro a los 7 días de vencimiento', () => {
    const state = makeState(2);
    state.bills = [];
    const ctx = makeCtx(state);
    createBill(state, {
      category: 'electricidad',
      label: 'Factura de electricidad',
      periodLabel: 'Test',
      lines: [],
      totalCents: 50_000,
      issuedDay: 0,
      dueDay: 0,
    });

    startDay(ctx, 1);
    expect(state.flags.blackout).toBe(false);

    startDay(ctx, 6);
    expect(state.flags.blackout).toBe(false);

    startDay(ctx, 7);
    expect(state.flags.blackout).toBe(true);
  });

  it('durante el corte no entra ningún cliente aunque haya cajeros', () => {
    const state = makeState(3);
    state.bills = [];
    const ctx = makeCtx(state);
    createBill(state, {
      category: 'electricidad',
      label: 'Factura de electricidad',
      periodLabel: 'Test',
      lines: [],
      totalCents: 50_000,
      issuedDay: 0,
      dueDay: 0,
    });
    startDay(ctx, 7);
    expect(state.flags.blackout).toBe(true);

    state.stats.today = { ...state.stats.today, customers: 0, served: 0, lost: 0 };
    setDay(state, 7);
    state.clock.timeMin += 12 * 60 - 7 * 60; // 12:00
    customerSystem.onHour?.(ctx, 12);

    expect(state.stats.today.served).toBe(0);
    expect(state.stats.today.lost).toBe(state.stats.today.customers);
    expect(state.stats.today.customers).toBeGreaterThan(0);
  });

  it('pagar la factura vencida de electricidad restablece el suministro', () => {
    const state = makeState(4);
    state.bills = [];
    const ctx = makeCtx(state);
    const bill = createBill(state, {
      category: 'electricidad',
      label: 'Factura de electricidad',
      periodLabel: 'Test',
      lines: [],
      totalCents: 50_000,
      issuedDay: 0,
      dueDay: 0,
    });
    startDay(ctx, 7);
    expect(state.flags.blackout).toBe(true);

    expect(payBill(ctx, bill.id)).toBeNull();
    expect(bill.status).toBe('paid');
    expect(state.flags.blackout).toBe(false);
  });

  it('una factura que no es de electricidad, aunque venza, no provoca corte', () => {
    const state = makeState(5);
    state.bills = [];
    const ctx = makeCtx(state);
    createBill(state, {
      category: 'agua',
      label: 'Factura de agua',
      periodLabel: 'Test',
      lines: [],
      totalCents: 5_000,
      issuedDay: 0,
      dueDay: 0,
    });

    startDay(ctx, 15);
    expect(state.flags.blackout).toBe(false);
  });
});
