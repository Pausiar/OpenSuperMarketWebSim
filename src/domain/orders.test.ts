import { describe, expect, it } from 'vitest';
import { placeOrder, processDeliveries, quoteUnitCents } from './orders';
import { stockOf } from './inventory';
import { makeCtx, makeState } from '../test/helpers';

describe('pedidos a proveedores', () => {
  it('valida pedido vacío, mínimo de pedido y catálogo', () => {
    const state = makeState();
    const ctx = makeCtx(state);
    expect(placeOrder(ctx, 'dist-iberia', [])).toMatch(/vacío/i);
    expect(placeOrder(ctx, 'dist-iberia', [{ productId: 'pasta', qty: 5 }])).toMatch(/mínimo/i);
    // dist-iberia solo vende productos de temperatura ambiente.
    expect(placeOrder(ctx, 'dist-iberia', [{ productId: 'leche', qty: 100 }])).toMatch(
      /no ofrece/i,
    );
  });

  it('cobra el pedido al realizarlo y la entrega crea lotes con caducidad', () => {
    const state = makeState();
    state.lots = []; // vacía el stock inicial para dejar sitio
    const ctx = makeCtx(state);
    const balanceBefore = state.ledger.balanceCents;
    const unit = quoteUnitCents(state, 'dist-iberia', 'pasta');

    const error = placeOrder(ctx, 'dist-iberia', [
      { productId: 'pasta', qty: 100 },
      { productId: 'arroz', qty: 100 },
    ]);

    expect(error).toBeNull();
    const order = state.orders.find((o) => o.status === 'inTransit')!;
    expect(order.lines.find((l) => l.productId === 'pasta')?.unitCents).toBe(unit);
    expect(state.ledger.balanceCents).toBe(balanceBefore - order.totalCents);

    // Fuerza la entrega hoy (sin retraso del proveedor).
    order.expectedDay = 0;
    order.note = 'forzado';
    processDeliveries(ctx, true);

    expect(order.status).toBe('delivered');
    expect(stockOf(state, 'pasta')).toBe(100);
    expect(stockOf(state, 'arroz')).toBe(100);
    // La pasta no caduca; los lotes lo reflejan.
    expect(state.lots.find((l) => l.productId === 'pasta')?.expiresDay).toBeNull();
  });

  it('rechaza pedidos que superan la capacidad de almacenaje', () => {
    const state = makeState();
    const ctx = makeCtx(state);
    // Capacidad ambiente nivel 1: 3 estanterías x 200 = 600, ya hay stock inicial.
    const error = placeOrder(ctx, 'dist-iberia', [{ productId: 'pasta', qty: 5000 }]);
    expect(error).toMatch(/capacidad/i);
  });
});
