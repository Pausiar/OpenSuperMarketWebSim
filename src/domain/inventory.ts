import { dayOf } from '../core/time';
import { productDef, type StorageType } from './data/products';
import { EQUIPMENT_MAP } from './data/equipment';
import { newId, type GameState, type SimCtx } from './state';

export interface InventoryLot {
  id: string;
  productId: string;
  qty: number;
  receivedDay: number;
  /** Día en que caduca (incluido). null = no perecedero. */
  expiresDay: number | null;
}

export function stockOf(state: GameState, productId: string): number {
  let total = 0;
  for (const lot of state.lots) if (lot.productId === productId) total += lot.qty;
  return total;
}

export function stockByStorage(state: GameState): Record<StorageType, number> {
  const acc: Record<StorageType, number> = { ambient: 0, chilled: 0, frozen: 0 };
  for (const lot of state.lots) acc[productDef(lot.productId).storage] += lot.qty;
  return acc;
}

/** Capacidad total por tipo de almacenaje según el equipamiento operativo. */
export function capacityByStorage(state: GameState): Record<StorageType, number> {
  const acc: Record<StorageType, number> = { ambient: 0, chilled: 0, frozen: 0 };
  for (const eq of state.store.equipment) {
    const def = EQUIPMENT_MAP[eq.type];
    if (def.storage && !eq.broken) acc[def.storage] += def.capacity;
  }
  return acc;
}

export function addLot(
  state: GameState,
  productId: string,
  qty: number,
  expiresDay: number | null,
): void {
  if (qty <= 0) return;
  state.lots.push({
    id: newId(state, 'lot'),
    productId,
    qty,
    receivedDay: dayOf(state.clock.timeMin),
    expiresDay,
  });
}

/**
 * Consume stock FIFO priorizando lo que antes caduca.
 * Devuelve las unidades realmente consumidas (nunca deja stock negativo).
 */
export function consumeStock(state: GameState, productId: string, qty: number): number {
  if (qty <= 0) return 0;
  const lots = state.lots
    .filter((l) => l.productId === productId)
    .sort((a, b) => (a.expiresDay ?? Infinity) - (b.expiresDay ?? Infinity));
  let remaining = qty;
  for (const lot of lots) {
    const take = Math.min(lot.qty, remaining);
    lot.qty -= take;
    remaining -= take;
    if (remaining === 0) break;
  }
  if (remaining < qty) state.lots = state.lots.filter((l) => l.qty > 0);
  return qty - remaining;
}

/** Retira lotes caducados. Devuelve unidades y valor (a coste) perdidos. */
export function removeExpiredLots(ctx: SimCtx): { units: number; valueCents: number } {
  const { state } = ctx;
  const today = dayOf(state.clock.timeMin);
  let units = 0;
  let valueCents = 0;
  const expired = state.lots.filter((l) => l.expiresDay !== null && today > l.expiresDay);
  if (expired.length === 0) return { units, valueCents };
  for (const lot of expired) {
    units += lot.qty;
    valueCents += lot.qty * productDef(lot.productId).baseCostCents;
  }
  state.lots = state.lots.filter((l) => !(l.expiresDay !== null && today > l.expiresDay));
  return { units, valueCents };
}

/** Unidades pendientes de recibir en pedidos en tránsito. */
export function incomingQty(state: GameState, productId: string): number {
  let total = 0;
  for (const order of state.orders) {
    if (order.status !== 'inTransit') continue;
    for (const line of order.lines) if (line.productId === productId) total += line.qty;
  }
  return total;
}

export function incomingByStorage(state: GameState): Record<StorageType, number> {
  const acc: Record<StorageType, number> = { ambient: 0, chilled: 0, frozen: 0 };
  for (const order of state.orders) {
    if (order.status !== 'inTransit') continue;
    for (const line of order.lines) acc[productDef(line.productId).storage] += line.qty;
  }
  return acc;
}

// ---- Comandos de producto ----

export function setSellingPrice(ctx: SimCtx, productId: string, priceCents: number): string | null {
  const ps = ctx.state.products[productId];
  if (!ps) return 'Producto desconocido.';
  if (!Number.isFinite(priceCents) || priceCents < 1) return 'El precio debe ser mayor que 0.';
  ps.sellingPriceCents = Math.round(priceCents);
  return null;
}

export function setMinStock(ctx: SimCtx, productId: string, minStock: number): string | null {
  const ps = ctx.state.products[productId];
  if (!ps) return 'Producto desconocido.';
  if (minStock < 0) return 'El stock mínimo no puede ser negativo.';
  ps.minStock = Math.round(minStock);
  return null;
}

export function toggleProductActive(ctx: SimCtx, productId: string): string | null {
  const ps = ctx.state.products[productId];
  if (!ps) return 'Producto desconocido.';
  ps.active = !ps.active;
  return null;
}
