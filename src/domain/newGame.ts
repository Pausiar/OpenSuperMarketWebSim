import { Rng } from '../core/rng';
import { MIN_PER_DAY } from '../core/time';
import { levelDef } from './data/levels';
import { PRODUCTS } from './data/products';
import { generateApplicant, refreshApplicants, type Employee } from './employees';
import { addLot } from './inventory';
import { autoPlace, createMap } from './map';
import { emptyDailyStats, newId, type GameState } from './state';
import type { EquipmentInstance } from './storeOps';

const STARTING_BALANCE_CENTS = 2_500_000; // 25.000 €
const START_TIME_MIN = 7 * 60; // día 0, 07:00

export function createNewGame(gameName: string, seed: number): GameState {
  const rng = new Rng(seed);

  const state: GameState = {
    saveVersion: 1,
    meta: { gameName, createdAt: Date.now(), nextId: 1 },
    seed,
    rngState: seed,
    clock: { timeMin: START_TIME_MIN, speed: 1 },
    ledger: { balanceCents: STARTING_BALANCE_CENTS, transactions: [] },
    bills: [],
    loans: [],
    products: Object.fromEntries(
      PRODUCTS.map((p) => [
        p.id,
        { sellingPriceCents: p.baseSellCents, active: true, minStock: 10 },
      ]),
    ),
    lots: [],
    orders: [],
    employees: [],
    applicants: [],
    shifts: [],
    store: {
      level: 1,
      reputation: 40,
      satisfaction: 55,
      cleanliness: 85,
      equipment: [],
      campaigns: [],
    },
    map: createMap(levelDef(1).grid.w, levelDef(1).grid.h),
    modifiers: [],
    notifications: [],
    stats: { days: [], today: emptyDailyStats(0), monthly: [] },
    flags: { blackout: false },
  };

  // Equipamiento inicial (colocado automáticamente en el mapa).
  const initialEquipment: EquipmentInstance['type'][] = [
    'checkout',
    'shelf',
    'shelf',
    'shelf',
    'fridge',
    'freezer',
  ];
  for (const type of initialEquipment) {
    const eq: EquipmentInstance = { id: newId(state, 'eq'), type, broken: false };
    state.store.equipment.push(eq);
    autoPlace(state, eq.id, type);
  }

  // Stock inicial.
  const initialQty = { ambient: 26, chilled: 14, frozen: 22 } as const;
  for (const p of PRODUCTS) {
    const qty = initialQty[p.storage];
    addLot(state, p.id, qty, p.expirationDays === null ? null : p.expirationDays);
  }

  // Plantilla inicial: 2 cajeros y 1 reponedor con turnos ya asignados.
  const hireFrom = (role: Parameters<typeof generateApplicant>[2]) => {
    const a = generateApplicant(state, rng, role);
    const emp: Employee = {
      id: newId(state, 'emp'),
      name: a.name,
      age: a.age,
      role: a.role,
      salaryCents: a.salaryCents,
      weeklyHours: 40,
      experience: a.experience,
      productivity: a.productivity,
      motivation: 70,
      fatigue: 10,
      vacationDaysLeft: 15,
      status: 'active',
      hiredDay: 0,
    };
    state.employees.push(emp);
    return emp;
  };

  const cashier1 = hireFrom('cashier');
  const cashier2 = hireFrom('cashier');
  const stocker = hireFrom('stocker');

  // Cajero 1: mañanas L-S 9:00-15:30. Cajero 2: tardes L-S 15:30-22:00.
  // Reponedor: L-V 8:00-16:00.
  for (let weekday = 0; weekday < 6; weekday++) {
    state.shifts.push({
      id: newId(state, 'shift'),
      employeeId: cashier1.id,
      weekday,
      startMin: 9 * 60,
      endMin: 15 * 60 + 30,
    });
    state.shifts.push({
      id: newId(state, 'shift'),
      employeeId: cashier2.id,
      weekday,
      startMin: 15 * 60 + 30,
      endMin: 22 * 60,
    });
  }
  for (let weekday = 0; weekday < 5; weekday++) {
    state.shifts.push({
      id: newId(state, 'shift'),
      employeeId: stocker.id,
      weekday,
      startMin: 8 * 60,
      endMin: 16 * 60,
    });
  }

  refreshApplicants(state, rng);
  state.rngState = rng.state;
  return state;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

/** Día de juego actual de un estado (helper para UI). */
export function currentDay(state: GameState): number {
  return Math.floor(state.clock.timeMin / MIN_PER_DAY);
}
