import { describe, expect, it } from 'vitest';
import { MIN_PER_DAY } from '../core/time';
import { PRODUCTS, type StorageType } from '../domain/data/products';
import { payBill } from '../domain/economy';
import { generateApplicant, hire } from '../domain/employees';
import { incomingQty, setMinStock, stockOf } from '../domain/inventory';
import { placeOrder } from '../domain/orders';
import { addShift } from '../domain/roster';
import type { GameState, SimCtx } from '../domain/state';
import { makeState } from '../test/helpers';
import { createSystems, GameEngine } from './index';

const SEED = 2024;
const DAYS = 90;
const START_BALANCE_CENTS = 2_500_000; // saldo inicial de createNewGame
/** Banda de beneficio sano a 90 días: entre 0 y 10.000 €. */
const SANE_PROFIT_MAX_CENTS = 1_000_000;

/** Umbral de reposición (stock mínimo) que fija el jugador de referencia. */
const MIN_STOCK = 20;
/** Stock objetivo al reponer, por tipo de almacenaje (dentro de la capacidad de nivel 1). */
const TARGET_STOCK: Record<StorageType, number> = {
  ambient: 30,
  chilled: 17,
  frozen: 30,
};
/** Proveedor de referencia por tipo de almacenaje. */
const SUPPLIER_BY_STORAGE: Record<StorageType, string> = {
  ambient: 'dist-iberia',
  chilled: 'frescor',
  frozen: 'polar',
};

/** Contrata 2 cajeros y 1 reponedor con los turnos de la plantilla inicial. */
function hireBaselineStaff(state: GameState, engine: GameEngine): void {
  state.employees = [];
  state.shifts = [];
  state.applicants = [];
  engine.runCommand((ctx) => {
    for (const role of ['cashier', 'cashier', 'stocker'] as const) {
      const applicant = generateApplicant(state, ctx.rng, role);
      state.applicants.push(applicant);
      expect(hire(ctx, applicant.id)).toBeNull();
    }
    const [cajero1, cajero2, reponedor] = state.employees;
    for (const e of state.employees) e.weeklyHours = 40; // jornada completa, como en la plantilla inicial
    for (let weekday = 0; weekday < 6; weekday++) {
      expect(
        addShift(ctx, cajero1.id, weekday, 9 * 60, 15 * 60 + 30),
      ).toBeNull();
      expect(
        addShift(ctx, cajero2.id, weekday, 15 * 60 + 30, 22 * 60),
      ).toBeNull();
    }
    for (let weekday = 0; weekday < 5; weekday++) {
      expect(addShift(ctx, reponedor.id, weekday, 8 * 60, 16 * 60)).toBeNull();
    }
    for (const p of PRODUCTS) setMinStock(ctx, p.id, MIN_STOCK);
  });
}

/** Cada día: paga facturas pendientes y repone lo que está bajo el mínimo. */
function dailyRoutine(ctx: SimCtx): void {
  for (const bill of ctx.state.bills) {
    if (bill.status === 'pending' || bill.status === 'overdue')
      payBill(ctx, bill.id);
  }
  const bySupplier: Record<string, { productId: string; qty: number }[]> = {};
  for (const p of PRODUCTS) {
    const ps = ctx.state.products[p.id];
    const onHand = stockOf(ctx.state, p.id) + incomingQty(ctx.state, p.id);
    if (!ps.active || onHand >= ps.minStock) continue;
    (bySupplier[SUPPLIER_BY_STORAGE[p.storage]] ??= []).push({
      productId: p.id,
      qty: TARGET_STOCK[p.storage] - onHand,
    });
  }
  for (const [supplierId, lines] of Object.entries(bySupplier)) {
    placeOrder(ctx, supplierId, lines); // un pedido rechazado (mínimo o capacidad) se reintenta al día siguiente
  }
}

describe('balance de la economía (90 días, semilla fija)', () => {
  it('jugador de referencia: contrata, repone, paga facturas y sigue solvente con beneficio sano', () => {
    const state = makeState(SEED);
    const engine = new GameEngine(state, createSystems());
    hireBaselineStaff(state, engine);

    let minBalance = Infinity;
    for (let day = 0; day < DAYS; day++) {
      engine.runCommand(dailyRoutine);
      engine.advanceMinutes(MIN_PER_DAY);
      minBalance = Math.min(minBalance, state.ledger.balanceCents);
    }

    const profit = state.ledger.balanceCents - START_BALANCE_CENTS;
    expect(minBalance).toBeGreaterThan(0);
    expect(state.flags.blackout).toBe(false);
    expect(profit).toBeGreaterThan(0);
    expect(profit).toBeLessThan(SANE_PROFIT_MAX_CENTS);
  });

  it('jugador ocioso: sin contrataciones ni pedidos no gana dinero apreciable', () => {
    const state = makeState(SEED);
    new GameEngine(state, createSystems()).advanceMinutes(MIN_PER_DAY * DAYS);
    const profit = state.ledger.balanceCents - START_BALANCE_CENTS;
    expect(profit).toBeLessThanOrEqual(0);
  });
});
