import type { Rng } from '../core/rng';
import type { Speed } from '../core/time';
import type { Transaction, Bill, Loan } from './economy';
import type { InventoryLot } from './inventory';
import type { PurchaseOrder } from './orders';
import type { Employee, Applicant } from './employees';
import type { Shift } from './roster';
import type { StoreState } from './storeOps';
import type { MapState } from './map';

export interface PlayerProduct {
  sellingPriceCents: number;
  active: boolean;
  minStock: number;
}

export type Severity = 'info' | 'warn' | 'error';

export interface Notification {
  id: string;
  timeMin: number;
  severity: Severity;
  message: string;
}

export interface DailyStats {
  day: number;
  customers: number;
  served: number;
  lost: number;
  itemsSold: number;
  revenueCents: number;
  expiredUnits: number;
  expiredValueCents: number;
  theftUnits: number;
  theftValueCents: number;
}

export interface MonthlyReport {
  monthAbs: number;
  revenueCents: number;
  expensesCents: number;
  profitCents: number;
  expensesByCategory: Record<string, number>;
  customers: number;
  itemsSold: number;
}

export type ModifierKind = 'demand' | 'electricityPrice' | 'supplierPrice';

export interface ActiveModifier {
  id: string;
  kind: ModifierKind;
  factor: number;
  untilDay: number;
  label: string;
  supplierId?: string;
}

export interface GameState {
  saveVersion: number;
  meta: { gameName: string; createdAt: number; nextId: number };
  seed: number;
  rngState: number;
  clock: { timeMin: number; speed: Speed };
  ledger: { balanceCents: number; transactions: Transaction[] };
  bills: Bill[];
  loans: Loan[];
  products: Record<string, PlayerProduct>;
  lots: InventoryLot[];
  orders: PurchaseOrder[];
  employees: Employee[];
  applicants: Applicant[];
  shifts: Shift[];
  store: StoreState;
  map: MapState;
  modifiers: ActiveModifier[];
  notifications: Notification[];
  stats: { days: DailyStats[]; today: DailyStats; monthly: MonthlyReport[] };
  flags: { blackout: boolean; lastNoCashierNoticeDay?: number };
}

/** Contexto que reciben sistemas y comandos: estado + rng + notificaciones. */
export interface SimCtx {
  state: GameState;
  rng: Rng;
  notify(severity: Severity, message: string): void;
}

export function newId(state: GameState, prefix: string): string {
  return `${prefix}-${state.meta.nextId++}`;
}

export function pushNotification(state: GameState, severity: Severity, message: string): void {
  state.notifications.push({
    id: newId(state, 'ntf'),
    timeMin: state.clock.timeMin,
    severity,
    message,
  });
  if (state.notifications.length > 200) state.notifications.splice(0, 50);
}

export function emptyDailyStats(day: number): DailyStats {
  return {
    day,
    customers: 0,
    served: 0,
    lost: 0,
    itemsSold: 0,
    revenueCents: 0,
    expiredUnits: 0,
    expiredValueCents: 0,
    theftUnits: 0,
    theftValueCents: 0,
  };
}

// ---- Modificadores activos (eventos) ----

function activeFactor(state: GameState, kind: ModifierKind, supplierId?: string): number {
  const day = Math.floor(state.clock.timeMin / 1440);
  return state.modifiers
    .filter(
      (m) =>
        m.kind === kind &&
        m.untilDay >= day &&
        (kind !== 'supplierPrice' || m.supplierId === supplierId),
    )
    .reduce((acc, m) => acc * m.factor, 1);
}

export const demandFactor = (s: GameState) => activeFactor(s, 'demand');
export const electricityPriceFactor = (s: GameState) => activeFactor(s, 'electricityPrice');
export const supplierPriceFactor = (s: GameState, supplierId: string) =>
  activeFactor(s, 'supplierPrice', supplierId);
