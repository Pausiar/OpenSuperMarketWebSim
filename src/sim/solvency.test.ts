import { describe, expect, it } from 'vitest';
import { MIN_PER_DAY } from '../core/time';
import { createBill } from '../domain/economy';
import { OVERDRAFT_LIMIT_CENTS } from '../domain/solvency';
import { makeCtx, makeState } from '../test/helpers';
import { solvencySystem } from './solvencySystem';

function runDays(ctx: ReturnType<typeof makeCtx>, n: number): void {
  for (let i = 0; i < n; i++) {
    ctx.state.clock.timeMin += MIN_PER_DAY;
    solvencySystem.onDayStart?.(ctx, 0);
  }
}

describe('quiebra', () => {
  it('avisa a los 10 y 20 días y termina a los 30', () => {
    const state = makeState(1);
    state.bills = [];
    state.ledger.balanceCents = OVERDRAFT_LIMIT_CENTS - 1;
    const ctx = makeCtx(state);
    const before = state.notifications.length;
    runDays(ctx, 10);
    expect(state.flags.debtDays).toBe(10);
    expect(state.notifications.length - before).toBe(1);
    runDays(ctx, 10);
    expect(state.notifications.length - before).toBe(2);
    runDays(ctx, 9);
    expect(state.flags.gameOver).toBeFalsy();
    runDays(ctx, 1);
    expect(state.flags.gameOver).toBe(true);
    expect(state.clock.speed).toBe(0);
  });

  it('recuperarse reinicia el contador', () => {
    const state = makeState(2);
    state.bills = [];
    state.ledger.balanceCents = OVERDRAFT_LIMIT_CENTS - 1;
    const ctx = makeCtx(state);
    runDays(ctx, 15);
    state.ledger.balanceCents = 0;
    runDays(ctx, 1);
    expect(state.flags.debtDays).toBe(0);
  });

  it('3 facturas vencidas provocan game over', () => {
    const state = makeState(3);
    state.bills = [];
    for (let i = 0; i < 3; i++) {
      const b = createBill(state, {
        category: 'agua',
        label: 'x',
        periodLabel: 'x',
        lines: [],
        totalCents: 100,
        issuedDay: 0,
        dueDay: 0,
      });
      b.status = 'overdue';
    }
    const ctx = makeCtx(state);
    runDays(ctx, 1);
    expect(state.flags.gameOver).toBe(true);
  });

  it('un estado sin flags nuevos funciona y 2 vencidas no bastan', () => {
    const state = makeState(4);
    state.bills = [];
    delete state.flags.debtDays;
    delete state.flags.gameOver;
    const ctx = makeCtx(state);
    runDays(ctx, 1);
    expect(state.flags.debtDays).toBe(0);
    expect(state.flags.gameOver).toBeFalsy();
  });
});
