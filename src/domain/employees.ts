import type { Rng } from '../core/rng';
import { dayOf, toParts } from '../core/time';
import { ROLE_MAP, type Role } from './data/roles';
import { record } from './economy';
import { newId, type GameState, type SimCtx } from './state';

export type EmployeeStatus = 'active' | 'sick' | 'vacation';

export interface Employee {
  id: string;
  name: string;
  age: number;
  role: Role;
  salaryCents: number; // mensual
  weeklyHours: number; // horas de contrato
  experience: number; // 0-100
  productivity: number; // 0.6 - 1.4
  motivation: number; // 0-100
  fatigue: number; // 0-100
  vacationDaysLeft: number;
  status: EmployeeStatus;
  awayUntilDay?: number; // fin de baja o vacaciones
  hiredDay: number;
}

export interface Applicant {
  id: string;
  name: string;
  age: number;
  role: Role;
  salaryCents: number;
  weeklyHours: number;
  experience: number;
  productivity: number;
}

const FIRST_NAMES = [
  'Lucía',
  'Marc',
  'Sofía',
  'Hugo',
  'Carmen',
  'Pablo',
  'Aina',
  'Javier',
  'Nerea',
  'Álvaro',
  'Marta',
  'Iván',
  'Paula',
  'Sergio',
  'Laia',
  'Diego',
  'Elena',
  'Raúl',
  'Clara',
  'Andrés',
];
const LAST_NAMES = [
  'García',
  'Martínez',
  'López',
  'Sánchez',
  'Ferrer',
  'Navarro',
  'Serra',
  'Ortega',
  'Vidal',
  'Romero',
  'Molina',
  'Castro',
  'Rubio',
  'Iglesias',
  'Pons',
];

export function generateApplicant(state: GameState, rng: Rng, role?: Role): Applicant {
  const roles = Object.keys(ROLE_MAP) as Role[];
  const r = role ?? rng.pick(roles);
  const experience = rng.int(5, 90);
  const productivity = 0.7 + (experience / 100) * 0.4 + rng.range(-0.1, 0.15);
  const salaryFactor = 0.85 + (experience / 100) * 0.4;
  return {
    id: newId(state, 'app'),
    name: `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`,
    age: rng.int(18, 58),
    role: r,
    salaryCents: Math.round(ROLE_MAP[r].baseSalaryCents * salaryFactor),
    weeklyHours: rng.pick([20, 30, 40, 40]),
    experience,
    productivity: Math.round(productivity * 100) / 100,
  };
}

export function refreshApplicants(state: GameState, rng: Rng): void {
  const n = rng.int(4, 7);
  state.applicants = [];
  for (let i = 0; i < n; i++) state.applicants.push(generateApplicant(state, rng));
}

export function hire(ctx: SimCtx, applicantId: string): string | null {
  const { state } = ctx;
  const idx = state.applicants.findIndex((a) => a.id === applicantId);
  if (idx === -1) return 'Candidato no encontrado.';
  const a = state.applicants[idx];
  state.applicants.splice(idx, 1);
  state.employees.push({
    id: newId(state, 'emp'),
    name: a.name,
    age: a.age,
    role: a.role,
    salaryCents: a.salaryCents,
    weeklyHours: a.weeklyHours,
    experience: a.experience,
    productivity: a.productivity,
    motivation: 70,
    fatigue: 15,
    vacationDaysLeft: 15,
    status: 'active',
    hiredDay: dayOf(state.clock.timeMin),
  });
  ctx.notify('info', `${a.name} contratado/a como ${ROLE_MAP[a.role].name}.`);
  return null;
}

export function fire(ctx: SimCtx, employeeId: string): string | null {
  const { state } = ctx;
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return 'Empleado no encontrado.';
  const severance = Math.round(emp.salaryCents / 2);
  if (state.ledger.balanceCents < severance) return 'Saldo insuficiente para pagar el finiquito.';
  record(state, {
    kind: 'expense',
    category: 'salarios',
    amountCents: severance,
    description: `Finiquito de ${emp.name}`,
    reference: emp.id,
  });
  state.employees = state.employees.filter((e) => e.id !== employeeId);
  state.shifts = state.shifts.filter((s) => s.employeeId !== employeeId);
  // Baja de moral general por el despido.
  for (const other of state.employees) other.motivation = Math.max(0, other.motivation - 4);
  ctx.notify('info', `${emp.name} ha sido despedido/a (finiquito: medio mes de salario).`);
  return null;
}

export function grantVacation(ctx: SimCtx, employeeId: string, days: number): string | null {
  const { state } = ctx;
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return 'Empleado no encontrado.';
  if (emp.status !== 'active') return 'El empleado no está disponible.';
  if (days < 1) return 'Las vacaciones deben durar al menos 1 día.';
  if (days > emp.vacationDaysLeft)
    return `Solo le quedan ${emp.vacationDaysLeft} días de vacaciones.`;
  emp.status = 'vacation';
  emp.awayUntilDay = dayOf(state.clock.timeMin) + days;
  emp.vacationDaysLeft -= days;
  emp.motivation = Math.min(100, emp.motivation + days * 2);
  ctx.notify('info', `${emp.name} de vacaciones ${days} días.`);
  return null;
}

export function giveRaise(ctx: SimCtx, employeeId: string, pct: number): string | null {
  const emp = ctx.state.employees.find((e) => e.id === employeeId);
  if (!emp) return 'Empleado no encontrado.';
  if (pct < 1 || pct > 30) return 'La subida debe estar entre 1% y 30%.';
  emp.salaryCents = Math.round(emp.salaryCents * (1 + pct / 100));
  emp.motivation = Math.min(100, emp.motivation + pct * 1.5);
  ctx.notify('info', `Subida de sueldo del ${pct}% para ${emp.name}.`);
  return null;
}

/** Empleados presentes en este momento según su turno semanal y su estado. */
export function onDutyAt(state: GameState, timeMin: number): Employee[] {
  const p = toParts(timeMin);
  const scheduledIds = new Set(
    state.shifts
      .filter(
        (s) => s.weekday === p.weekday && s.startMin <= p.minuteOfDay && p.minuteOfDay < s.endMin,
      )
      .map((s) => s.employeeId),
  );
  return state.employees.filter((e) => e.status === 'active' && scheduledIds.has(e.id));
}

/** Productividad efectiva media considerando motivación, fatiga y encargado presente. */
export function effectiveProductivity(onDuty: Employee[], filterRole?: Role): number {
  const managerPresent = onDuty.some((e) => e.role === 'manager');
  const list = filterRole ? onDuty.filter((e) => e.role === filterRole) : onDuty;
  if (list.length === 0) return 0;
  const avg =
    list.reduce((acc, e) => {
      const motivationFactor = 0.8 + (e.motivation / 100) * 0.35;
      const fatigueFactor = e.fatigue > 75 ? 0.8 : 1;
      return acc + e.productivity * motivationFactor * fatigueFactor;
    }, 0) / list.length;
  return avg * (managerPresent ? 1.1 : 1);
}

/**
 * Mantenimiento diario (a las 00:00): vueltas de baja/vacaciones, fatiga por las
 * horas trabajadas ayer, recuperación nocturna, deriva de motivación y riesgo de baja.
 */
export function dailyEmployeeUpkeep(ctx: SimCtx): void {
  const { state, rng } = ctx;
  const today = dayOf(state.clock.timeMin);
  const yesterdayWeekday = (((today - 1) % 7) + 7) % 7;
  for (const emp of state.employees) {
    if (emp.status !== 'active' && emp.awayUntilDay !== undefined && today >= emp.awayUntilDay) {
      const was = emp.status;
      emp.status = 'active';
      emp.awayUntilDay = undefined;
      if (was === 'sick') ctx.notify('info', `${emp.name} se ha recuperado y vuelve al trabajo.`);
    }
    if (emp.status !== 'active') continue;

    const workedMin = state.shifts
      .filter((s) => s.employeeId === emp.id && s.weekday === yesterdayWeekday)
      .reduce((acc, s) => acc + (s.endMin - s.startMin), 0);
    emp.fatigue = Math.max(0, Math.min(100, emp.fatigue + (workedMin / 60) * 2.2 - 26));
    // La motivación tiende a 65; la fatiga alta la reduce.
    emp.motivation += (65 - emp.motivation) * 0.05 - (emp.fatigue > 70 ? 1.5 : 0);
    emp.motivation = Math.max(0, Math.min(100, emp.motivation));

    const sickChance = 0.004 + (emp.fatigue / 100) * 0.02;
    if (rng.chance(sickChance)) {
      emp.status = 'sick';
      emp.awayUntilDay = today + rng.int(1, 3);
      ctx.notify(
        'warn',
        `${emp.name} está de baja por enfermedad hasta dentro de ${emp.awayUntilDay - today} día(s).`,
      );
    }
  }
}

/** Nómina mensual: salario + horas extra sobre el contrato. Se paga aunque deje saldo negativo. */
export function processPayrollMonthly(ctx: SimCtx): void {
  const { state } = ctx;
  let total = 0;
  for (const emp of state.employees) {
    const weeklyMin = state.shifts
      .filter((s) => s.employeeId === emp.id)
      .reduce((acc, s) => acc + (s.endMin - s.startMin), 0);
    const overtimeHours = Math.max(0, weeklyMin / 60 - emp.weeklyHours);
    const hourlyCents = emp.salaryCents / (emp.weeklyHours * 4.33 || 1);
    const overtimeCents = Math.round(overtimeHours * 4.33 * hourlyCents * 1.25);
    total += emp.salaryCents + overtimeCents;
  }
  if (total === 0) return;
  record(state, {
    kind: 'expense',
    category: 'salarios',
    amountCents: total,
    description: `Nóminas de ${state.employees.length} empleados`,
  });
  if (state.ledger.balanceCents < 0) {
    for (const emp of state.employees) emp.motivation = Math.max(0, emp.motivation - 12);
    ctx.notify(
      'error',
      'Las nóminas han dejado la caja en negativo. La plantilla está preocupada (motivación -12).',
    );
  } else {
    ctx.notify('info', `Nóminas pagadas: ${(total / 100).toFixed(2)} €.`);
  }
}
