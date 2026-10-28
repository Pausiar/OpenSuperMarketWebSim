import { dayOf } from '../core/time';
import { productDef, PRODUCTS } from '../domain/data/products';
import { SUPPLIERS } from '../domain/data/suppliers';
import { record } from '../domain/economy';
import { consumeStock, stockOf } from '../domain/inventory';
import { newId, type ModifierKind, type SimCtx } from '../domain/state';
import type { SimSystem } from './engine';

function addModifier(
  ctx: SimCtx,
  kind: ModifierKind,
  factor: number,
  days: number,
  label: string,
  supplierId?: string,
): void {
  const { state } = ctx;
  state.modifiers.push({
    id: newId(state, 'mod'),
    kind,
    factor,
    untilDay: dayOf(state.clock.timeMin) + days,
    label,
    supplierId,
  });
}

interface GameEvent {
  id: string;
  chance: number;
  run(ctx: SimCtx): boolean; // false = el evento no aplicaba, no cuenta
}

const EVENTS: GameEvent[] = [
  {
    id: 'electricity-up',
    chance: 0.012,
    run(ctx) {
      if (ctx.state.modifiers.some((m) => m.kind === 'electricityPrice')) return false;
      addModifier(ctx, 'electricityPrice', 1.35, 30, 'Subida del precio de la luz');
      ctx.notify('warn', 'El precio de la electricidad sube un 35% durante 30 días.');
      return true;
    },
  },
  {
    id: 'supplier-up',
    chance: 0.015,
    run(ctx) {
      const supplier = ctx.rng.pick(SUPPLIERS);
      if (
        ctx.state.modifiers.some((m) => m.kind === 'supplierPrice' && m.supplierId === supplier.id)
      )
        return false;
      addModifier(
        ctx,
        'supplierPrice',
        1.2,
        20,
        `Subida de precios de ${supplier.name}`,
        supplier.id,
      );
      ctx.notify('warn', `${supplier.name} sube sus precios un 20% durante 20 días.`);
      return true;
    },
  },
  {
    id: 'demand-up',
    chance: 0.02,
    run(ctx) {
      if (ctx.state.modifiers.some((m) => m.kind === 'demand' && m.factor > 1)) return false;
      const days = ctx.rng.int(3, 5);
      addModifier(ctx, 'demand', 1.3, days, 'Evento local: más afluencia');
      ctx.notify('info', `Hay un evento en el barrio: +30% de afluencia durante ${days} días.`);
      return true;
    },
  },
  {
    id: 'demand-down',
    chance: 0.015,
    run(ctx) {
      if (ctx.state.modifiers.some((m) => m.kind === 'demand' && m.factor < 1)) return false;
      const days = ctx.rng.int(3, 6);
      addModifier(ctx, 'demand', 0.75, days, 'Obras en la calle: menos afluencia');
      ctx.notify('warn', `Obras en la calle: -25% de afluencia durante ${days} días.`);
      return true;
    },
  },
  {
    id: 'breakdown',
    chance: 0.014,
    run(ctx) {
      const coolers = ctx.state.store.equipment.filter(
        (e) => (e.type === 'fridge' || e.type === 'freezer') && !e.broken,
      );
      if (coolers.length === 0) return false;
      const eq = ctx.rng.pick(coolers);
      eq.broken = true;
      // Se estropea parte del stock de ese tipo de frío.
      const storage = eq.type === 'fridge' ? 'chilled' : 'frozen';
      let spoiled = 0;
      let value = 0;
      for (const p of PRODUCTS.filter((p) => p.storage === storage)) {
        const qty = Math.floor(stockOf(ctx.state, p.id) * 0.3);
        const done = consumeStock(ctx.state, p.id, qty);
        spoiled += done;
        value += done * p.baseCostCents;
      }
      ctx.state.stats.today.expiredUnits += spoiled;
      ctx.state.stats.today.expiredValueCents += value;
      ctx.notify(
        'error',
        `Avería: ${eq.type === 'fridge' ? 'una nevera' : 'un congelador'} ha dejado de funcionar. ` +
          `${spoiled} unidades estropeadas. Repáralo en Tienda → Equipamiento.`,
      );
      return true;
    },
  },
  {
    id: 'resignation',
    chance: 0.02,
    run(ctx) {
      const unhappy = ctx.state.employees.filter((e) => e.motivation < 40);
      if (unhappy.length === 0) return false;
      const emp = ctx.rng.pick(unhappy);
      ctx.state.employees = ctx.state.employees.filter((e) => e.id !== emp.id);
      ctx.state.shifts = ctx.state.shifts.filter((s) => s.employeeId !== emp.id);
      ctx.notify('error', `${emp.name} ha renunciado por baja motivación. Revisa los turnos.`);
      return true;
    },
  },
  {
    id: 'inspection',
    chance: 0.01,
    run(ctx) {
      if (ctx.state.store.cleanliness < 45) {
        record(ctx.state, {
          kind: 'expense',
          category: 'multas',
          amountCents: 30_000,
          description: 'Multa de sanidad por falta de limpieza',
        });
        ctx.notify('error', 'Inspección de sanidad: multa de 300 € por falta de limpieza.');
      } else {
        ctx.notify('info', 'Inspección de sanidad superada sin incidencias.');
      }
      return true;
    },
  },
  {
    id: 'theft-big',
    chance: 0.008,
    run(ctx) {
      const withStock = PRODUCTS.filter((p) => stockOf(ctx.state, p.id) > 5);
      if (withStock.length === 0) return false;
      const def = ctx.rng.pick(withStock);
      const stolen = consumeStock(ctx.state, def.id, ctx.rng.int(4, 10));
      ctx.state.stats.today.theftUnits += stolen;
      ctx.state.stats.today.theftValueCents += stolen * productDef(def.id).baseCostCents;
      ctx.notify('warn', `Robo detectado: faltan ${stolen} unidades de ${def.name}.`);
      return true;
    },
  },
];

export const eventSystem: SimSystem = {
  id: 'events',

  onDayStart(ctx, day) {
    if (day < 4) return; // días de gracia al empezar
    let fired = 0;
    for (const event of EVENTS) {
      if (fired >= 2) break;
      if (ctx.rng.chance(event.chance) && event.run(ctx)) fired++;
    }
  },
};
