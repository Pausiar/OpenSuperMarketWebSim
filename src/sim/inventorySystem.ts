import { productDef, PRODUCTS } from '../domain/data/products';
import { consumeStock, incomingQty, removeExpiredLots, stockOf } from '../domain/inventory';
import type { SimSystem } from './engine';

export const inventorySystem: SimSystem = {
  id: 'inventory',

  onDayStart(ctx) {
    const { state } = ctx;

    // Caducidades.
    const expired = removeExpiredLots(ctx);
    if (expired.units > 0) {
      state.stats.today.expiredUnits += expired.units;
      state.stats.today.expiredValueCents += expired.valueCents;
      ctx.notify(
        'warn',
        `${expired.units} unidades caducadas retiradas (pérdida de ${(expired.valueCents / 100).toFixed(2)} € a coste).`,
      );
    }

    // Durante un apagón, el frío no funciona: se estropea parte del refrigerado/congelado.
    if (state.flags.blackout) {
      let spoiled = 0;
      let value = 0;
      for (const p of PRODUCTS) {
        if (p.storage === 'ambient') continue;
        const qty = Math.floor(stockOf(state, p.id) * 0.3);
        const done = consumeStock(state, p.id, qty);
        spoiled += done;
        value += done * p.baseCostCents;
      }
      if (spoiled > 0) {
        state.stats.today.expiredUnits += spoiled;
        state.stats.today.expiredValueCents += value;
        ctx.notify(
          'error',
          `Sin electricidad, ${spoiled} unidades refrigeradas/congeladas se han estropeado.`,
        );
      }
    }

    // Aviso de stock bajo (productos activos sin pedido en camino).
    const low = Object.entries(state.products)
      .filter(
        ([id, ps]) => ps.active && stockOf(state, id) < ps.minStock && incomingQty(state, id) === 0,
      )
      .map(([id]) => productDef(id).name);
    if (low.length > 0) {
      const shown = low.slice(0, 4).join(', ');
      ctx.notify(
        'warn',
        `Stock bajo sin reposición en camino: ${shown}${low.length > 4 ? ` y ${low.length - 4} más` : ''}.`,
      );
    }
  },
};
