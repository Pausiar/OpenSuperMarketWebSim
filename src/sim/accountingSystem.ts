import { ACCOUNTING_HOUR, MIN_PER_DAY, DAYS_PER_MONTH, monthLabel } from '../core/time';
import { TX_CATEGORY_NAMES, type TxCategory } from '../domain/economy';
import { emptyDailyStats, type MonthlyReport } from '../domain/state';
import type { SimSystem } from './engine';

/**
 * Cierre contable: al inicio de cada día archiva las estadísticas del día
 * anterior y actualiza la reputación; al inicio de mes genera el informe mensual.
 */
export const accountingSystem: SimSystem = {
  id: 'accounting',

  onDayStart(ctx, day) {
    const { state } = ctx;
    if (state.stats.today.day < day) {
      state.stats.days.push(state.stats.today);
      if (state.stats.days.length > 400) state.stats.days.splice(0, 100);
      const s = state.store;
      s.reputation = Math.max(
        0,
        Math.min(100, s.reputation + (s.satisfaction - s.reputation) * 0.06),
      );
      state.stats.today = emptyDailyStats(day);
    }
    // Limpia modificadores caducados.
    state.modifiers = state.modifiers.filter((m) => m.untilDay >= day);
  },

  onHour(ctx, hour) {
    if (hour !== ACCOUNTING_HOUR) return;
    const t = ctx.state.stats.today;
    if (t.customers === 0 && t.revenueCents === 0) return;
    ctx.notify(
      'info',
      `Cierre del día: ${t.served} clientes atendidos (${t.lost} perdidos), ventas de ${(t.revenueCents / 100).toFixed(2)} €.`,
    );
  },

  onMonthStart(ctx, monthAbs) {
    if (monthAbs === 0) return;
    const { state } = ctx;
    const prevMonth = monthAbs - 1;
    const fromMin = state.clock.timeMin - DAYS_PER_MONTH * MIN_PER_DAY;

    let revenueCents = 0;
    let expensesCents = 0;
    const expensesByCategory: Partial<Record<TxCategory, number>> = {};
    for (const tx of state.ledger.transactions) {
      if (tx.timeMin < fromMin || tx.timeMin >= state.clock.timeMin) continue;
      if (tx.kind === 'income') revenueCents += tx.amountCents;
      else {
        expensesCents += tx.amountCents;
        expensesByCategory[tx.category] = (expensesByCategory[tx.category] ?? 0) + tx.amountCents;
      }
    }

    const fromDay = prevMonth * DAYS_PER_MONTH;
    const monthDays = state.stats.days.filter(
      (d) => d.day >= fromDay && d.day < fromDay + DAYS_PER_MONTH,
    );
    const report: MonthlyReport = {
      monthAbs: prevMonth,
      revenueCents,
      expensesCents,
      profitCents: revenueCents - expensesCents,
      expensesByCategory: Object.fromEntries(
        Object.entries(expensesByCategory).map(([k, v]) => [TX_CATEGORY_NAMES[k as TxCategory], v]),
      ),
      customers: monthDays.reduce((a, d) => a + d.served, 0),
      itemsSold: monthDays.reduce((a, d) => a + d.itemsSold, 0),
    };
    state.stats.monthly.push(report);
    if (state.stats.monthly.length > 36) state.stats.monthly.splice(0, 6);
    ctx.notify(
      report.profitCents >= 0 ? 'info' : 'warn',
      `Informe de ${monthLabel(prevMonth)}: ${report.profitCents >= 0 ? 'beneficio' : 'pérdidas'} de ${(Math.abs(report.profitCents) / 100).toFixed(2)} €.`,
    );
  },
};
