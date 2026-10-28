import { describe, expect, it } from 'vitest';
import {
  createBill,
  payBill,
  processBillsDaily,
  record,
  takeLoan,
  processLoansMonthly,
} from './economy';
import { makeCtx, makeState } from '../test/helpers';

describe('economía', () => {
  it('registra transacciones y actualiza el balance sin mutación directa', () => {
    const state = makeState();
    state.ledger.balanceCents = 100_000;
    state.ledger.transactions = [];

    record(state, { kind: 'income', category: 'ventas', amountCents: 5_000, description: 'venta' });
    record(state, {
      kind: 'expense',
      category: 'alquiler',
      amountCents: 20_000,
      description: 'alquiler',
    });

    expect(state.ledger.balanceCents).toBe(85_000);
    expect(state.ledger.transactions).toHaveLength(2);
    expect(state.ledger.transactions[0].id).not.toBe(state.ledger.transactions[1].id);
  });

  it('rechaza importes negativos', () => {
    const state = makeState();
    expect(() =>
      record(state, { kind: 'income', category: 'ventas', amountCents: -5, description: 'x' }),
    ).toThrow();
  });

  it('paga una factura: balance, transacción y estado', () => {
    const state = makeState();
    state.ledger.balanceCents = 100_000;
    state.ledger.transactions = [];
    const ctx = makeCtx(state);
    const bill = createBill(state, {
      category: 'electricidad',
      label: 'Electricidad',
      periodLabel: 'Enero',
      lines: [],
      totalCents: 25_000,
      issuedDay: 0,
      dueDay: 5,
    });

    const error = payBill(ctx, bill.id);

    expect(error).toBeNull();
    expect(state.ledger.balanceCents).toBe(75_000);
    expect(bill.status).toBe('paid');
    const tx = state.ledger.transactions.find((t) => t.reference === bill.id);
    expect(tx?.amountCents).toBe(25_000);
    expect(tx?.category).toBe('electricidad');
  });

  it('no permite pagar sin saldo y no permite pagar dos veces', () => {
    const state = makeState();
    state.ledger.balanceCents = 1_000;
    const ctx = makeCtx(state);
    const bill = createBill(state, {
      category: 'agua',
      label: 'Agua',
      periodLabel: 'Enero',
      lines: [],
      totalCents: 25_000,
      issuedDay: 0,
      dueDay: 5,
    });
    expect(payBill(ctx, bill.id)).toMatch(/insuficiente/i);
    state.ledger.balanceCents = 100_000;
    expect(payBill(ctx, bill.id)).toBeNull();
    expect(payBill(ctx, bill.id)).toMatch(/resuelta/i);
  });

  it('aplica recargo al vencer y corta la luz tras 7 días de impago', () => {
    const state = makeState();
    const ctx = makeCtx(state);
    const bill = createBill(state, {
      category: 'electricidad',
      label: 'Electricidad',
      periodLabel: 'Enero',
      lines: [],
      totalCents: 10_000,
      issuedDay: 0,
      dueDay: -8,
    });

    processBillsDaily(ctx);

    expect(bill.status).toBe('overdue');
    expect(bill.totalCents).toBe(10_500); // +5% una sola vez
    expect(state.flags.blackout).toBe(true);

    // Al pagar, se restablece el suministro.
    state.ledger.balanceCents = 100_000;
    payBill(ctx, bill.id);
    expect(state.flags.blackout).toBe(false);
  });

  it('concede préstamos y cobra cuotas mensuales', () => {
    const state = makeState();
    state.ledger.balanceCents = 0;
    state.ledger.transactions = [];
    const ctx = makeCtx(state);

    expect(takeLoan(ctx, 'micro')).toBeNull();
    expect(state.ledger.balanceCents).toBe(1_000_000);
    expect(state.loans).toHaveLength(1);

    const monthly = state.loans[0].monthlyCents;
    processLoansMonthly(ctx);
    expect(state.ledger.balanceCents).toBe(1_000_000 - monthly);
    expect(state.loans[0].remainingMonths).toBe(11);
  });
});
