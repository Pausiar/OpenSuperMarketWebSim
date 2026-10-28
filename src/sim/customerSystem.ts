import { dayOf, isCustomerHour, toParts } from '../core/time';
import { PRODUCTS, productDef } from '../domain/data/products';
import { record } from '../domain/economy';
import { effectiveProductivity, onDutyAt } from '../domain/employees';
import { consumeStock, stockOf } from '../domain/inventory';
import { layoutEffects } from '../domain/map';
import { demandFactor, type SimCtx } from '../domain/state';
import { campaignBoost } from '../domain/storeOps';
import { levelDef } from '../domain/data/levels';
import type { SimSystem } from './engine';

/** Curva de afluencia por hora (multiplicador del tráfico base). */
const HOUR_CURVE: Record<number, number> = {
  9: 0.6,
  10: 0.7,
  11: 0.9,
  12: 1.1,
  13: 1.15,
  14: 0.8,
  15: 0.7,
  16: 0.8,
  17: 1.0,
  18: 1.25,
  19: 1.3,
  20: 1.0,
  21: 0.7,
};

const WEEKEND_FACTOR = [1, 1, 1, 1, 1.1, 1.3, 0.75]; // L-D

/** Clientes que puede atender una caja por hora con productividad 1.0. */
const CUSTOMERS_PER_CHECKOUT_HOUR = 16;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function simulateHour(ctx: SimCtx, hour: number): void {
  const { state, rng } = ctx;
  const today = dayOf(state.clock.timeMin);
  const parts = toParts(state.clock.timeMin);
  const stats = state.stats.today;

  // Demanda potencial de esta hora.
  const level = levelDef(state.store.level);
  const reputationFactor = 0.55 + (state.store.reputation / 100) * 0.9;
  const potential = Math.round(
    rng.jitter(
      level.baseTraffic *
        (HOUR_CURVE[hour] ?? 0.5) *
        WEEKEND_FACTOR[parts.weekday] *
        demandFactor(state) *
        campaignBoost(state) *
        reputationFactor,
      0.15,
    ),
  );
  if (potential <= 0) return;

  if (state.flags.blackout) {
    stats.customers += potential;
    stats.lost += potential;
    return;
  }

  const onDuty = onDutyAt(state, state.clock.timeMin);
  const cashiersOnDuty = onDuty.filter((e) => e.role === 'cashier').length;
  const workingCheckouts = state.store.equipment.filter(
    (e) => e.type === 'checkout' && !e.broken,
  ).length;
  const openCheckouts = Math.min(cashiersOnDuty, workingCheckouts);

  stats.customers += potential;

  if (openCheckouts === 0) {
    stats.lost += potential;
    if (state.flags.lastNoCashierNoticeDay !== today) {
      state.flags.lastNoCashierNoticeDay = today;
      ctx.notify(
        'error',
        'No hay ningún cajero en su puesto: los clientes se marchan sin comprar.',
      );
    }
    state.store.satisfaction = clamp(state.store.satisfaction - 2, 0, 100);
    return;
  }

  const effects = layoutEffects(state);
  const cashierProductivity = effectiveProductivity(onDuty, 'cashier');
  const capacity = Math.max(
    1,
    Math.round(
      openCheckouts * CUSTOMERS_PER_CHECKOUT_HOUR * cashierProductivity * effects.queueFactor,
    ),
  );
  const served = Math.min(potential, capacity);
  const lost = potential - served;
  stats.served += served;
  stats.lost += lost;

  // Disponibilidad de producto: reponedores presentes + distancia al almacén.
  const stockerPresent = onDuty.some((e) => e.role === 'stocker');
  const availability = clamp((stockerPresent ? 1 : 0.8) * effects.restockFactor, 0.5, 1);

  // Compra de cada cliente atendido.
  const activeProducts = PRODUCTS.filter((p) => state.products[p.id]?.active);
  const weights = activeProducts.map((p) => p.popularity);
  let revenueCents = 0;
  let itemsSold = 0;
  let itemsWanted = 0;
  let itemsFound = 0;

  for (let c = 0; c < served; c++) {
    let budgetCents = Math.round(rng.range(800, 6500));
    const itemCount = rng.int(1, 5);
    const priceSensitivity = rng.range(0.7, 1.3);
    for (let i = 0; i < itemCount; i++) {
      const def = activeProducts[rng.weighted(weights)];
      if (!def) break;
      itemsWanted++;
      const ps = state.products[def.id];
      const stock = stockOf(state, def.id);
      if (stock <= 0) continue;
      const priceRatio = ps.sellingPriceCents / def.baseSellCents;
      const buyProb = clamp(1.35 - 0.55 * priceRatio * priceSensitivity, 0.05, 0.97) * availability;
      if (!rng.chance(buyProb)) continue;
      if (ps.sellingPriceCents > budgetCents) continue;
      let qty = rng.chance(0.25) ? 2 : 1;
      qty = Math.min(qty, stock, Math.floor(budgetCents / ps.sellingPriceCents));
      const sold = consumeStock(state, def.id, qty);
      if (sold > 0) {
        revenueCents += sold * ps.sellingPriceCents;
        budgetCents -= sold * ps.sellingPriceCents;
        itemsSold += sold;
        itemsFound++;
      }
    }
  }

  if (revenueCents > 0) {
    record(state, {
      kind: 'income',
      category: 'ventas',
      amountCents: revenueCents,
      description: `Ventas de ${hour}:00 a ${hour + 1}:00 (${served} clientes)`,
    });
  }
  stats.itemsSold += itemsSold;
  stats.revenueCents += revenueCents;

  // Satisfacción de la hora: encontrar producto, colas y limpieza.
  const foundRatio = itemsWanted > 0 ? itemsFound / itemsWanted : 0.7;
  const lostRatio = potential > 0 ? lost / potential : 0;
  const hourSatisfaction = clamp(
    55 +
      45 * (foundRatio - 0.55) -
      35 * lostRatio +
      (state.store.cleanliness - 60) * 0.15 +
      (effects.circulationFactor - 1) * 80,
    0,
    100,
  );
  state.store.satisfaction = clamp(
    state.store.satisfaction * 0.88 + hourSatisfaction * 0.12,
    0,
    100,
  );
  state.store.cleanliness = clamp(state.store.cleanliness - served * 0.06, 0, 100);

  // Robos: sin seguridad en el turno hay pérdidas desconocidas.
  const securityPresent = onDuty.some((e) => e.role === 'security');
  if (!securityPresent && rng.chance(0.12)) {
    const def = rng.pick(PRODUCTS);
    const stolen = consumeStock(state, def.id, rng.int(1, 3));
    if (stolen > 0) {
      stats.theftUnits += stolen;
      stats.theftValueCents += stolen * productDef(def.id).baseCostCents;
    }
  }
}

export const customerSystem: SimSystem = {
  id: 'customers',
  onHour(ctx, hour) {
    if (isCustomerHour(hour)) simulateHour(ctx, hour);
  },
};
