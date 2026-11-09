import { describe, expect, it } from "vitest";
import { PRODUCTS } from "./data/products";
import { addLot, stockOf } from "./inventory";
import { quoteUnitCents } from "./orders";
import { planRepeatLast, planRestock, placeRestock } from "./restock";
import { makeCtx, makeState } from "../test/helpers";

/** Estado con el almacén vacío y solo los productos indicados con mínimo > 0. */
function setup(mins: Record<string, number>) {
  const state = makeState();
  state.lots = [];
  state.orders = [];
  for (const p of PRODUCTS) state.products[p.id].minStock = mins[p.id] ?? 0;
  return state;
}

describe("reposición rápida", () => {
  it("planifica productos bajo el mínimo hasta 2x el mínimo", () => {
    const state = setup({ pasta: 20 });
    addLot(state, "pasta", 5, null);
    const plan = planRestock(state);
    const line = plan.groups
      .flatMap((g) => g.lines)
      .find((l) => l.productId === "pasta")!;
    expect(line.qty).toBe(35);
    expect(plan.blocked).toEqual([]);
  });

  it("no pide lo que ya está por encima del mínimo con lo que viene en camino", () => {
    const state = setup({ pasta: 20 });
    addLot(state, "pasta", 5, null);
    state.orders.push({
      id: "po-x",
      supplierId: "dist-iberia",
      lines: [{ productId: "pasta", qty: 30, unitCents: 50 }],
      totalCents: 1500,
      placedDay: 0,
      expectedDay: 2,
      status: "inTransit",
    });
    expect(planRestock(state).groups).toHaveLength(0);
  });

  it("elige el proveedor más barato que cumple el pedido mínimo y agrupa por proveedor", () => {
    const state = setup({ pasta: 20, arroz: 20, leche: 20 });
    const plan = planRestock(state, {
      qtyOverrides: { pasta: 900, arroz: 900, leche: 500 },
    });
    const ids = plan.groups
      .flatMap((g) => g.lines)
      .map((l) => l.productId)
      .sort();
    expect(ids).toEqual(["arroz", "leche", "pasta"]);
    for (const g of plan.groups) {
      expect(g.subtotalCents).toBe(
        g.lines.reduce((a, l) => a + l.lineCents, 0),
      );
      expect(new Set(g.lines.map((l) => l.supplierId)).size).toBe(1);
    }
    // Con pedidos grandes el mayorista es el más barato para todo.
    const pasta = plan.groups
      .flatMap((g) => g.lines)
      .find((l) => l.productId === "pasta")!;
    expect(pasta.supplierId).toBe("mayorista-sur");
    expect(pasta.unitCents).toBe(
      quoteUnitCents(state, "mayorista-sur", "pasta"),
    );
    expect(plan.groups).toHaveLength(1);
  });

  it("cae a otro proveedor si el más barato no alcanza su pedido mínimo", () => {
    const state = setup({ pasta: 20 });
    const plan = planRestock(state);
    expect(plan.groups).toHaveLength(1);
    expect(plan.groups[0].supplierId).not.toBe("mayorista-sur");
  });

  it("respeta las cantidades fijadas y excluye las puestas a 0", () => {
    const state = setup({ pasta: 20, arroz: 20 });
    const plan = planRestock(state, { qtyOverrides: { pasta: 0, arroz: 100 } });
    const lines = plan.groups.flatMap((g) => g.lines);
    expect(lines.map((l) => l.productId)).toEqual(["arroz"]);
    expect(lines[0].qty).toBe(100);
  });

  it("marca como bloqueado lo que no cabe", () => {
    const state = setup({ pasta: 20 });
    state.store.equipment = state.store.equipment.filter(
      (e) => e.type !== "shelf",
    );
    const plan = planRestock(state);
    expect(plan.groups).toHaveLength(0);
    expect(plan.blocked[0]).toMatchObject({ productId: "pasta" });
  });

  it("con fondos insuficientes pide lo más crítico y lista lo omitido", () => {
    const state = setup({ pasta: 200, arroz: 200 });
    addLot(state, "arroz", 150, null);
    const ctx = makeCtx(state);
    const plan = planRestock(state, {
      qtyOverrides: { pasta: 300, arroz: 100 },
    });
    const g = plan.groups[0];
    const pastaCost = g.lines.find((l) => l.productId === "pasta")!.lineCents;
    state.ledger.balanceCents = pastaCost;
    const res = placeRestock(ctx, plan);
    expect(res.placed).toHaveLength(1);
    expect(res.spentCents).toBe(pastaCost);
    expect(res.skipped.flatMap((s) => s.productIds)).toContain("arroz");
    expect(state.ledger.balanceCents).toBe(0);
  });

  it("placeRestock crea un pedido por proveedor y asientos de gasto; es determinista", () => {
    const run = () => {
      const state = setup({ pasta: 300, leche: 300 });
      const ctx = makeCtx(state);
      const before = state.ledger.balanceCents;
      const plan = planRestock(state);
      const res = placeRestock(ctx, plan);
      return { state, res, before, plan };
    };
    const a = run();
    expect(a.res.placed).toHaveLength(a.plan.groups.length);
    expect(a.res.skipped).toEqual([]);
    expect(a.state.orders.filter((o) => o.status === "inTransit")).toHaveLength(
      a.plan.groups.length,
    );
    expect(a.state.ledger.balanceCents).toBe(a.before - a.plan.totalCents);
    expect(
      a.state.ledger.transactions.filter((t) => t.category === "proveedores"),
    ).toHaveLength(a.plan.groups.length);
    expect(stockOf(a.state, "pasta")).toBe(0);
    expect(JSON.stringify(run().res)).toBe(JSON.stringify(a.res));
  });

  it("repite el último pedido de cada proveedor", () => {
    const state = setup({ pasta: 300 });
    const ctx = makeCtx(state);
    placeRestock(ctx, planRestock(state));
    const last = state.orders[state.orders.length - 1];
    const plan = planRepeatLast(state);
    const g = plan.groups.find((x) => x.supplierId === last.supplierId)!;
    expect(g.lines.map((l) => [l.productId, l.qty])).toEqual(
      last.lines.map((l) => [l.productId, l.qty]),
    );
  });
});
