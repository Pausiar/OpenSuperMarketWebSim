import { CLOSE_HOUR, OPEN_HOUR, WEEKDAY_NAMES, formatMinutesAsHM } from '../core/time';
import { newId, type GameState, type SimCtx } from './state';

/** Turno de plantilla semanal: se repite cada semana hasta que se elimine. */
export interface Shift {
  id: string;
  employeeId: string;
  weekday: number; // 0 = lunes
  startMin: number; // minuto del día
  endMin: number;
}

export function addShift(
  ctx: SimCtx,
  employeeId: string,
  weekday: number,
  startMin: number,
  endMin: number,
): string | null {
  const { state } = ctx;
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return 'Empleado no encontrado.';
  if (weekday < 0 || weekday > 6) return 'Día de la semana inválido.';
  if (startMin < 0 || endMin > 1440 || startMin >= endMin) return 'Horario inválido.';
  const duration = endMin - startMin;
  if (duration < 120) return 'Un turno debe durar al menos 2 horas.';
  if (duration > 600) return 'Un turno no puede superar las 10 horas.';

  const sameDay = state.shifts.filter((s) => s.employeeId === employeeId && s.weekday === weekday);
  for (const s of sameDay) {
    if (startMin < s.endMin && s.startMin < endMin) {
      return `Se solapa con su turno de ${formatMinutesAsHM(s.startMin)}–${formatMinutesAsHM(s.endMin)}.`;
    }
  }
  const dayMinutes = sameDay.reduce((acc, s) => acc + (s.endMin - s.startMin), 0) + duration;
  if (dayMinutes > 600) return 'Más de 10 horas en el mismo día.';

  const weeklyMin = weeklyMinutes(state, employeeId) + duration;
  if (weeklyMin / 60 > emp.weeklyHours + 10) {
    return `Supera en más de 10h las ${emp.weeklyHours}h semanales de contrato.`;
  }

  state.shifts.push({ id: newId(state, 'shift'), employeeId, weekday, startMin, endMin });
  return null;
}

export function removeShift(ctx: SimCtx, shiftId: string): string | null {
  const before = ctx.state.shifts.length;
  ctx.state.shifts = ctx.state.shifts.filter((s) => s.id !== shiftId);
  return ctx.state.shifts.length < before ? null : 'Turno no encontrado.';
}

export function weeklyMinutes(state: GameState, employeeId: string): number {
  return state.shifts
    .filter((s) => s.employeeId === employeeId)
    .reduce((acc, s) => acc + (s.endMin - s.startMin), 0);
}

export interface ScheduleIssue {
  severity: 'warn' | 'error';
  message: string;
}

/** Analiza la plantilla semanal y devuelve problemas de cobertura y de horas. */
export function scheduleIssues(state: GameState): ScheduleIssue[] {
  const issues: ScheduleIssue[] = [];
  const cashiers = new Set(state.employees.filter((e) => e.role === 'cashier').map((e) => e.id));

  for (let weekday = 0; weekday < 7; weekday++) {
    const uncovered: number[] = [];
    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
      const covered = state.shifts.some(
        (s) =>
          s.weekday === weekday &&
          cashiers.has(s.employeeId) &&
          s.startMin <= hour * 60 &&
          (hour + 1) * 60 <= s.endMin,
      );
      if (!covered) uncovered.push(hour);
    }
    if (uncovered.length === CLOSE_HOUR - OPEN_HOUR) {
      issues.push({
        severity: 'error',
        message: `${WEEKDAY_NAMES[weekday]}: sin ningún cajero en todo el día.`,
      });
    } else if (uncovered.length > 0) {
      issues.push({
        severity: 'warn',
        message: `${WEEKDAY_NAMES[weekday]}: sin cajero a las ${uncovered.map((h) => `${h}:00`).join(', ')}.`,
      });
    }
  }

  for (const emp of state.employees) {
    const hours = weeklyMinutes(state, emp.id) / 60;
    if (hours > emp.weeklyHours) {
      issues.push({
        severity: 'warn',
        message: `${emp.name}: ${hours.toFixed(1)}h semanales (contrato de ${emp.weeklyHours}h). Pagarás horas extra al 125%.`,
      });
    }
    const daysWorked = new Set(
      state.shifts.filter((s) => s.employeeId === emp.id).map((s) => s.weekday),
    ).size;
    if (daysWorked === 7) {
      issues.push({
        severity: 'warn',
        message: `${emp.name} trabaja los 7 días: la fatiga se acumulará.`,
      });
    }
  }
  return issues;
}
