import { dayOf } from '../core/time';
import { productDef, type StorageType } from './data/products';
import { supplierDef } from './data/suppliers';
import { record } from './economy';
import { addLot, capacityByStorage, incomingByStorage, stockByStorage } from './inventory';
import { newId, supplierPriceFactor, type GameState, type SimCtx } from './state';

export interface OrderLine {
  productId: string;
  qty: number;
  unitCents: number;
}

export type OrderStatus = 'inTransit' | 'delivered' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  lines: OrderLine[];
  totalCents: number;
  placedDay: number;
  expectedDay: number;
  status: OrderStatus;
  deliveredDay?: number;
  note?: string;
}

/** Precio por unidad de un producto para un proveedor (incluye eventos de precios). */
export function quoteUnitCents(state: GameState, supplierId: string, productId: string): number {
  const supplier = supplierDef(supplierId);
  const factor = supplier.priceFactor * supplierPriceFactor(state, supplierId);
  return Math.round(productDef(productId).baseCostCents * factor);
}

export function placeOrder(
  ctx: SimCtx,
  supplierId: string,
  requested: { productId: string; qty: number }[],
): string | null {
  const { state } = ctx;
  const supplier = supplierDef(supplierId);
  const clean = requested.filter((l) => l.qty > 0);
  if (clean.length === 0) return 'El pedido está vacío.';

  const lines: OrderLine[] = [];
  for (const req of clean) {
    if (!supplier.catalog.includes(req.productId)) {
      return `${supplier.name} no ofrece ${productDef(req.productId).name}.`;
    }
    lines.push({
      productId: req.productId,
      qty: Math.round(req.qty),
      unitCents: quoteUnitCents(state, supplierId, req.productId),
    });
  }

  const totalCents = lines.reduce((acc, l) => acc + l.qty * l.unitCents, 0);
  if (totalCents < supplier.minOrderCents) {
    return `Pedido mínimo de ${supplier.name}: ${(supplier.minOrderCents / 100).toFixed(2)} €.`;
  }
  if (state.ledger.balanceCents < totalCents) return 'Saldo insuficiente para pagar el pedido.';

  // Comprueba capacidad: stock actual + pedidos en tránsito + este pedido.
  const stock = stockByStorage(state);
  const incoming = incomingByStorage(state);
  const capacity = capacityByStorage(state);
  const added: Record<StorageType, number> = { ambient: 0, chilled: 0, frozen: 0 };
  for (const line of lines) added[productDef(line.productId).storage] += line.qty;
  for (const st of ['ambient', 'chilled', 'frozen'] as StorageType[]) {
    if (stock[st] + incoming[st] + added[st] > capacity[st]) {
      const label = { ambient: 'estanterías', chilled: 'refrigerado', frozen: 'congelado' }[st];
      return `Sin capacidad suficiente en ${label} (contando pedidos en camino).`;
    }
  }

  const today = dayOf(state.clock.timeMin);
  const order: PurchaseOrder = {
    id: newId(state, 'po'),
    supplierId,
    lines,
    totalCents,
    placedDay: today,
    expectedDay: today + supplier.leadDays,
    status: 'inTransit',
  };
  state.orders.push(order);
  record(state, {
    kind: 'expense',
    category: 'proveedores',
    amountCents: totalCents,
    description: `Pedido a ${supplier.name} (${lines.length} productos)`,
    reference: order.id,
  });
  if (state.orders.length > 100) {
    const open = state.orders.filter((o) => o.status === 'inTransit');
    const closed = state.orders.filter((o) => o.status !== 'inTransit');
    state.orders = [...closed.slice(-50), ...open];
  }
  return null;
}

/**
 * Procesa entregas pendientes (se llama a las 08:00).
 * La fiabilidad del proveedor puede provocar retrasos; sin personal de almacén
 * en el turno, parte de la mercancía se daña en la recepción.
 */
export function processDeliveries(ctx: SimCtx, warehouseOnDuty: boolean): void {
  const { state, rng } = ctx;
  const today = dayOf(state.clock.timeMin);
  for (const order of state.orders) {
    if (order.status !== 'inTransit' || order.expectedDay > today) continue;
    const supplier = supplierDef(order.supplierId);
    if (!order.note && !rng.chance(supplier.reliability)) {
      order.expectedDay = today + 1;
      order.note = 'Retrasado por el proveedor';
      ctx.notify('warn', `Entrega de ${supplier.name} retrasada un día.`);
      continue;
    }
    let damaged = 0;
    for (const line of order.lines) {
      let qty = line.qty;
      if (!warehouseOnDuty) {
        const lost = Math.floor(qty * 0.05 * rng.range(0.5, 1.5));
        qty -= lost;
        damaged += lost;
      }
      const def = productDef(line.productId);
      addLot(
        state,
        line.productId,
        qty,
        def.expirationDays === null ? null : today + def.expirationDays,
      );
    }
    order.status = 'delivered';
    order.deliveredDay = today;
    ctx.notify(
      'info',
      `Entrega recibida de ${supplier.name}.` +
        (damaged > 0 ? ` ${damaged} unidades dañadas por falta de personal de almacén.` : ''),
    );
  }
}
