import { productDef } from "./data/products";
import type { GameState } from "./state";

/** Plantilla inicial de createNewGame: 2 cajeros + 1 reponedor. */
const INITIAL_STAFF = 3;

export type TutorialStepId =
  "hire" | "order" | "prices" | "schedule" | "day" | "report";

export type TutorialTarget =
  "employees" | "suppliers" | "products" | "schedule" | "dashboard" | "reports";

export interface TutorialStep {
  id: TutorialStepId;
  title: string;
  hint: string;
  target: TutorialTarget;
  /** Paso que no puede deducirse del estado: requiere confirmación del jugador. */
  manual?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "hire",
    title: "Contrata a un cajero",
    hint: "Revisa a los candidatos y contrata a un cajero más para cubrir las horas punta.",
    target: "employees",
  },
  {
    id: "order",
    title: "Revisa el stock y haz un pedido",
    hint: "Comprueba qué se agota y encarga mercancía a un proveedor.",
    target: "suppliers",
  },
  {
    id: "prices",
    title: "Ajusta los precios",
    hint: "Cambia el precio de venta de algún producto buscando un buen margen.",
    target: "products",
  },
  {
    id: "schedule",
    title: "Abre turnos",
    hint: "Asigna turnos a tu nuevo cajero en el horario semanal.",
    target: "schedule",
  },
  {
    id: "day",
    title: "Deja correr un día",
    hint: "Pulsa play y deja que el supermercado complete una jornada.",
    target: "dashboard",
  },
  {
    id: "report",
    title: "Lee el informe",
    hint: "Consulta los resultados del día y marca el paso como leído.",
    target: "reports",
    manual: true,
  },
];

const isHired = (e: GameState["employees"][number], index: number) =>
  e.hiredDay > 0 || index >= INITIAL_STAFF;

type Predicate = (state: GameState) => boolean;

export const tutorialPredicates: Record<
  Exclude<TutorialStepId, "report">,
  Predicate
> = {
  hire: (s) =>
    s.employees.some((e, i) => e.role === "cashier" && isHired(e, i)),
  order: (s) => s.orders.length > 0,
  prices: (s) =>
    Object.entries(s.products).some(
      ([id, p]) => p.sellingPriceCents !== productDef(id).baseSellCents,
    ),
  schedule: (s) =>
    s.employees.some(
      (e, i) => isHired(e, i) && s.shifts.some((sh) => sh.employeeId === e.id),
    ),
  day: (s) => s.stats.days.length >= 1,
};

/** El informe solo cuenta una vez jugado un día y confirmado por el jugador. */
export function isStepDone(
  id: TutorialStepId,
  state: GameState,
  acked: readonly string[],
): boolean {
  if (id === "report")
    return tutorialPredicates.day(state) && acked.includes("report");
  return tutorialPredicates[id](state);
}

export interface TutorialProgress {
  dismissed: boolean;
  collapsed: boolean;
  acked: string[];
}

export const DEFAULT_PROGRESS: TutorialProgress = {
  dismissed: false,
  collapsed: false,
  acked: [],
};

const key = (saveId: string) => `osmws.tutorial.${saveId}`;

export function loadProgress(saveId: string): TutorialProgress {
  try {
    const raw = localStorage.getItem(key(saveId));
    if (!raw) return { ...DEFAULT_PROGRESS };
    const p = JSON.parse(raw) as Partial<TutorialProgress>;
    return {
      dismissed: p.dismissed === true,
      collapsed: p.collapsed === true,
      acked: Array.isArray(p.acked)
        ? p.acked.filter((x) => typeof x === "string")
        : [],
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(saveId: string, progress: TutorialProgress): void {
  try {
    localStorage.setItem(key(saveId), JSON.stringify(progress));
  } catch {
    /* almacenamiento no disponible: el progreso queda solo en memoria */
  }
}
