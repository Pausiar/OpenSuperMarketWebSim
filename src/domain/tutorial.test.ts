import { describe, expect, it } from "vitest";
import { hire } from "./employees";
import { addShift } from "./roster";
import { emptyDailyStats } from "./state";
import { makeCtx, makeState } from "../test/helpers";
import {
  TUTORIAL_STEPS,
  isStepDone,
  loadProgress,
  saveProgress,
} from "./tutorial";

describe("tutorial", () => {
  it("estado nuevo: ningún paso completado", () => {
    const s = makeState();
    for (const step of TUTORIAL_STEPS)
      expect(isStepDone(step.id, s, ["report"])).toBe(false);
  });

  it("contratar un cajero completa el paso y luego abrir turnos", () => {
    const s = makeState();
    const ctx = makeCtx(s);
    const cand = s.applicants.find((a) => a.role === "cashier");
    // Garantiza un candidato cajero.
    const id = cand
      ? cand.id
      : ((s.applicants[0].role = "cashier"), s.applicants[0].id);
    expect(hire(ctx, id)).toBeNull();
    expect(isStepDone("hire", s, [])).toBe(true);
    expect(isStepDone("schedule", s, [])).toBe(false);
    const emp = s.employees[s.employees.length - 1];
    expect(addShift(ctx, emp.id, 6, 9 * 60, 14 * 60)).toBeNull();
    expect(isStepDone("schedule", s, [])).toBe(true);
  });

  it("pedido y precios", () => {
    const s = makeState();
    expect(isStepDone("order", s, [])).toBe(false);
    s.orders.push({
      id: "po-x",
      supplierId: "x",
      lines: [],
      totalCents: 0,
      placedDay: 0,
      expectedDay: 1,
      status: "inTransit",
    });
    expect(isStepDone("order", s, [])).toBe(true);
    expect(isStepDone("prices", s, [])).toBe(false);
    const first = Object.keys(s.products)[0];
    s.products[first].sellingPriceCents += 10;
    expect(isStepDone("prices", s, [])).toBe(true);
  });

  it("día y informe", () => {
    const s = makeState();
    expect(isStepDone("day", s, [])).toBe(false);
    s.stats.days.push(emptyDailyStats(0));
    expect(isStepDone("day", s, [])).toBe(true);
    expect(isStepDone("report", s, [])).toBe(false);
    expect(isStepDone("report", s, ["report"])).toBe(true);
  });

  it("progreso persiste por partida y tolera datos corruptos", () => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    } as unknown as Storage;
    saveProgress("a", { dismissed: true, collapsed: false, acked: ["report"] });
    expect(loadProgress("a").dismissed).toBe(true);
    expect(loadProgress("b").dismissed).toBe(false);
    store.set("osmws.tutorial.c", "{no json");
    expect(loadProgress("c").acked).toEqual([]);
  });
});
