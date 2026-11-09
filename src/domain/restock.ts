import { dayOf } from "../core/time";
import { PRODUCTS, type StorageType } from "./data/products";
import { SUPPLIERS, supplierDef } from "./data/suppliers";
import {
  capacityByStorage,
  incomingByStorage,
  incomingQty,
  stockByStorage,
  stockOf,
} from "./inventory";
import { placeOrder, quoteUnitCents } from "./orders";
import type { GameState, SimCtx } from "./state";

export interface RestockOptions {
  /** Stock objetivo como múltiplo del mínimo (por defecto 2). */
  targetMultiplier?: number;
  /** Cantidad mínima razonable por línea (por defecto 6). */
  minPack?: number;
  /** Cantidades fijadas por el jugador; 0 excluye el producto. */
  qtyOverrides?: Record<string, number>;
}

export interface RestockLine {
  productId: string;
  supplierId: string;
  qty: number;
  unitCents: number;
  lineCents: number;
  stock: number;
  incoming: number;
  minStock: number;
}

export interface RestockGroup {
  supplierId: string;
  /** Líneas ordenadas de más a menos crítica. */
  lines: RestockLine[];
  subtotalCents: number;
  etaDay: number;
  belowMinOrder: boolean;
}

export interface RestockBlocked {
  productId: string;
  reason: string;
}

export interface RestockPlan {
  groups: RestockGroup[];
  blocked: RestockBlocked[];
  totalCents: number;
}

export interface RestockResult {
  placed: { supplierId: string; totalCents: number; lines: number }[];
  skipped: { supplierId: string; reason: string; productIds: string[] }[];
  spentCents: number;
}

const STORAGES: StorageType[] = ["ambient", "chilled", "frozen"];
const STORAGE_LABEL: Record<StorageType, string> = {
  ambient: "estanterías",
  chilled: "refrigerado",
  frozen: "congelado",
};

/** Posición del proveedor en el último pedido que lo usó (más reciente = menor). Sirve para desempatar. */
function recency(state: GameState, supplierId: string): number {
  for (let i = state.orders.length - 1; i >= 0; i--) {
    if (state.orders[i].supplierId === supplierId)
      return state.orders.length - i;
  }
  return Infinity;
}

function rankSuppliers(state: GameState, productId: string): string[] {
  return SUPPLIERS.filter((s) => s.catalog.includes(productId))
    .map((s) => ({
      id: s.id,
      unit: quoteUnitCents(state, s.id, productId),
      recent: recency(state, s.id),
    }))
    .sort((a, b) => a.unit - b.unit || a.recent - b.recent)
    .map((s) => s.id);
}

function buildGroups(state: GameState, lines: RestockLine[]): RestockGroup[] {
  const today = dayOf(state.clock.timeMin);
  const map = new Map<string, RestockLine[]>();
  for (const l of lines)
    map.set(l.supplierId, [...(map.get(l.supplierId) ?? []), l]);
  const urgency = (l: RestockLine) =>
    (l.stock + l.incoming) / Math.max(l.minStock, 1);
  return [...map.entries()]
    .map(([supplierId, ls]) => {
      const sup = supplierDef(supplierId);
      const sorted = [...ls].sort(
        (a, b) => urgency(a) - urgency(b) || a.lineCents - b.lineCents,
      );
      const subtotalCents = sorted.reduce((a, l) => a + l.lineCents, 0);
      return {
        supplierId,
        lines: sorted,
        subtotalCents,
        etaDay: today + sup.leadDays,
        belowMinOrder: subtotalCents < sup.minOrderCents,
      };
    })
    .sort(
      (a, b) =>
        SUPPLIERS.findIndex((s) => s.id === a.supplierId) -
        SUPPLIERS.findIndex((s) => s.id === b.supplierId),
    );
}

function toPlan(
  groups: RestockGroup[],
  blocked: RestockBlocked[],
): RestockPlan {
  return {
    groups,
    blocked,
    totalCents: groups.reduce((a, g) => a + g.subtotalCents, 0),
  };
}

/** Productos activos bajo el mínimo (contando pedidos en camino) con cantidad sugerida y mejor proveedor. */
export function planRestock(
  state: GameState,
  options: RestockOptions = {},
): RestockPlan {
  const multiplier = options.targetMultiplier ?? 2;
  const minPack = options.minPack ?? 6;
  const overrides = options.qtyOverrides ?? {};

  const room = {} as Record<StorageType, number>;
  const cap = capacityByStorage(state);
  const stored = stockByStorage(state);
  const inbound = incomingByStorage(state);
  for (const st of STORAGES) room[st] = cap[st] - stored[st] - inbound[st];

  const candidates = PRODUCTS.map((p) => {
    const ps = state.products[p.id];
    const stock = stockOf(state, p.id);
    const incoming = incomingQty(state, p.id);
    return { p, ps, stock, incoming, available: stock + incoming };
  })
    .filter(
      ({ ps, available }) =>
        ps?.active && ps.minStock > 0 && available <= ps.minStock,
    )
    .sort(
      (a, b) =>
        a.available / a.ps.minStock - b.available / b.ps.minStock ||
        a.p.id.localeCompare(b.p.id),
    );

  const blocked: RestockBlocked[] = [];
  const wanted: {
    line: Omit<RestockLine, "supplierId" | "unitCents" | "lineCents">;
    ranked: string[];
  }[] = [];
  for (const { p, ps, stock, incoming, available } of candidates) {
    const ranked = rankSuppliers(state, p.id);
    if (ranked.length === 0) {
      blocked.push({ productId: p.id, reason: "Ningún proveedor lo ofrece." });
      continue;
    }
    const override = overrides[p.id];
    let qty: number;
    if (override !== undefined) {
      qty = Math.max(0, Math.round(override));
    } else {
      qty = Math.max(minPack, Math.ceil(ps.minStock * multiplier) - available);
      qty = Math.min(qty, room[p.storage]);
      if (qty < 1) {
        blocked.push({
          productId: p.id,
          reason: `Sin capacidad en ${STORAGE_LABEL[p.storage]}.`,
        });
        continue;
      }
    }
    if (qty === 0) continue;
    room[p.storage] -= qty;
    wanted.push({
      line: { productId: p.id, qty, stock, incoming, minStock: ps.minStock },
      ranked,
    });
  }

  // Asigna el proveedor más barato; si su pedido mínimo no se alcanza y hay alternativa, lo descarta.
  const banned = new Set<string>();
  let lines: RestockLine[] = [];
  for (let guard = 0; guard <= SUPPLIERS.length; guard++) {
    lines = wanted.map(({ line, ranked }) => {
      const usable = ranked.filter((s) => !banned.has(s));
      const supplierId = usable[0] ?? ranked[0];
      const unitCents = quoteUnitCents(state, supplierId, line.productId);
      return {
        ...line,
        supplierId,
        unitCents,
        lineCents: unitCents * line.qty,
      };
    });
    const under = buildGroups(state, lines).find(
      (g) =>
        g.belowMinOrder &&
        !banned.has(g.supplierId) &&
        g.lines.some((l) =>
          wanted
            .find((w) => w.line.productId === l.productId)!
            .ranked.some((s) => s !== g.supplierId && !banned.has(s)),
        ),
    );
    if (!under) break;
    banned.add(under.supplierId);
  }
  return toPlan(buildGroups(state, lines), blocked);
}

/** Repite las mismas líneas del pedido más reciente de cada proveedor, a precios actuales. */
export function planRepeatLast(state: GameState): RestockPlan {
  const lines: RestockLine[] = [];
  for (const s of SUPPLIERS) {
    const last = [...state.orders]
      .reverse()
      .find((o) => o.supplierId === s.id && o.status !== "cancelled");
    if (!last) continue;
    for (const l of last.lines) {
      if (!s.catalog.includes(l.productId)) continue;
      const unitCents = quoteUnitCents(state, s.id, l.productId);
      lines.push({
        productId: l.productId,
        supplierId: s.id,
        qty: l.qty,
        unitCents,
        lineCents: unitCents * l.qty,
        stock: stockOf(state, l.productId),
        incoming: incomingQty(state, l.productId),
        minStock: state.products[l.productId]?.minStock ?? 0,
      });
    }
  }
  return toPlan(buildGroups(state, lines), []);
}

/**
 * Realiza un pedido por proveedor con placeOrder. Los grupos más críticos van primero;
 * si no hay saldo para un grupo se le quitan las líneas menos críticas hasta que quepa.
 */
export function placeRestock(ctx: SimCtx, plan: RestockPlan): RestockResult {
  const result: RestockResult = { placed: [], skipped: [], spentCents: 0 };
  const urgency = (g: RestockGroup) =>
    Math.min(
      ...g.lines.map((l) => (l.stock + l.incoming) / Math.max(l.minStock, 1)),
    );
  const groups = [...plan.groups]
    .filter((g) => g.lines.length > 0)
    .sort(
      (a, b) => urgency(a) - urgency(b) || a.subtotalCents - b.subtotalCents,
    );

  for (const group of groups) {
    const sup = supplierDef(group.supplierId);
    let lines = group.lines.filter((l) => l.qty > 0);
    const dropped: string[] = [];
    const cost = (ls: RestockLine[]) =>
      ls.reduce(
        (a, l) =>
          a + l.qty * quoteUnitCents(ctx.state, group.supplierId, l.productId),
        0,
      );
    while (lines.length > 0 && cost(lines) > ctx.state.ledger.balanceCents) {
      dropped.push(lines[lines.length - 1].productId);
      lines = lines.slice(0, -1);
    }
    if (lines.length === 0 || cost(lines) < sup.minOrderCents) {
      result.skipped.push({
        supplierId: group.supplierId,
        reason:
          lines.length === 0 || dropped.length > 0
            ? "Saldo insuficiente."
            : `Pedido mínimo de ${(sup.minOrderCents / 100).toFixed(2)} € no alcanzado.`,
        productIds: group.lines.map((l) => l.productId),
      });
      continue;
    }
    const total = cost(lines);
    const err = placeOrder(
      ctx,
      group.supplierId,
      lines.map((l) => ({ productId: l.productId, qty: l.qty })),
    );
    if (err) {
      result.skipped.push({
        supplierId: group.supplierId,
        reason: err,
        productIds: group.lines.map((l) => l.productId),
      });
      continue;
    }
    result.placed.push({
      supplierId: group.supplierId,
      totalCents: total,
      lines: lines.length,
    });
    result.spentCents += total;
    if (dropped.length > 0) {
      result.skipped.push({
        supplierId: group.supplierId,
        reason: "Saldo insuficiente.",
        productIds: dropped,
      });
    }
  }
  return result;
}
