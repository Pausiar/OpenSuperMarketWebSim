import { DAYS_PER_MONTH, dayOf, monthLabel } from '../core/time';
import { EQUIPMENT_MAP } from '../domain/data/equipment';
import { levelDef } from '../domain/data/levels';
import { KWH_PRICE_CENTS, TAX_RATE } from '../domain/data/loans';
import { createBill, processBillsDaily, processLoansMonthly, record } from '../domain/economy';
import { electricityPriceFactor, type SimCtx } from '../domain/state';
import { cleanupExpiredCampaigns } from '../domain/storeOps';
import type { SimSystem } from './engine';

/** Factor de climatización por mes (invierno calefacción, verano refrigeración). */
const CLIMATE_FACTOR = [1.0, 0.9, 0.6, 0.3, 0.2, 0.5, 0.7, 0.7, 0.3, 0.5, 0.8, 1.0];

function generateMonthlyBills(ctx: SimCtx, monthAbs: number): void {
  const { state } = ctx;
  const prevMonth = monthAbs - 1;
  const period = monthLabel(prevMonth);
  const today = dayOf(state.clock.timeMin);
  const level = levelDef(state.store.level);

  // Alquiler: cargo automático (contrato de arrendamiento).
  record(state, {
    kind: 'expense',
    category: 'alquiler',
    amountCents: level.rentCents,
    description: `Alquiler del local (${period})`,
  });

  // Electricidad.
  const equipmentKwhDay = state.store.equipment.reduce(
    (acc, e) => acc + EQUIPMENT_MAP[e.type].kwhPerDay,
    0,
  );
  const kwh = Math.round((level.baseKwhPerDay + equipmentKwhDay) * DAYS_PER_MONTH);
  const kwhPrice = KWH_PRICE_CENTS * electricityPriceFactor(state);
  createBill(state, {
    category: 'electricidad',
    label: 'Factura de electricidad',
    periodLabel: period,
    lines: [`Consumo: ${kwh} kWh`, `Precio: ${(kwhPrice / 100).toFixed(3)} €/kWh`],
    totalCents: Math.round(kwh * kwhPrice),
    issuedDay: today,
    dueDay: today + 5,
  });

  // Agua.
  const monthDays = state.stats.days.filter(
    (d) => d.day >= prevMonth * DAYS_PER_MONTH && d.day < monthAbs * DAYS_PER_MONTH,
  );
  const monthCustomers = monthDays.reduce((a, d) => a + d.served, 0);
  createBill(state, {
    category: 'agua',
    label: 'Factura de agua',
    periodLabel: period,
    lines: [`Cuota base`, `Uso estimado por ${monthCustomers} clientes`],
    totalCents: level.waterBaseCents + monthCustomers * 3,
    issuedDay: today,
    dueDay: today + 5,
  });

  // Climatización (estacional).
  const monthIdx = prevMonth % 12;
  const climateKwh = Math.round(
    level.baseKwhPerDay * CLIMATE_FACTOR[monthIdx] * DAYS_PER_MONTH * 0.8,
  );
  if (climateKwh > 0) {
    createBill(state, {
      category: 'calefaccion',
      label: 'Climatización (calefacción/frío)',
      periodLabel: period,
      lines: [
        `Consumo equivalente: ${climateKwh} kWh`,
        `Factor estacional: ${CLIMATE_FACTOR[monthIdx]}`,
      ],
      totalCents: Math.round(climateKwh * kwhPrice),
      issuedDay: today,
      dueDay: today + 5,
    });
  }

  // Impuesto sobre beneficios del mes anterior (usa el informe del cierre contable).
  const report = state.stats.monthly.find((r) => r.monthAbs === prevMonth);
  if (report && report.profitCents > 0) {
    createBill(state, {
      category: 'impuestos',
      label: 'Impuesto sobre beneficios',
      periodLabel: period,
      lines: [
        `Beneficio declarado: ${(report.profitCents / 100).toFixed(2)} €`,
        `Tipo: ${TAX_RATE * 100}%`,
      ],
      totalCents: Math.round(report.profitCents * TAX_RATE),
      issuedDay: today,
      dueDay: today + 10,
    });
  }

  ctx.notify('info', `Han llegado las facturas de ${period}. Revisa Finanzas → Facturas.`);
}

export const billingSystem: SimSystem = {
  id: 'billing',

  onDayStart(ctx) {
    processBillsDaily(ctx);
    cleanupExpiredCampaigns(ctx);
  },

  onMonthStart(ctx, monthAbs) {
    if (monthAbs === 0) return;
    generateMonthlyBills(ctx, monthAbs);
    processLoansMonthly(ctx);
  },
};
