// Calendario del juego: 12 meses de 30 días (360 días/año), semanas de 7 días.
// Todo el tiempo se expresa en minutos de juego desde el día 0 a las 00:00.

export const MIN_PER_HOUR = 60;
export const MIN_PER_DAY = 1440;
export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 22;
export const ACCOUNTING_HOUR = 23;

export type Speed = 0 | 1 | 2 | 5 | 10;
export const SPEEDS: Speed[] = [0, 1, 2, 5, 10];
// Minutos de juego por segundo real en cada velocidad.
export const SPEED_MIN_PER_SEC: Record<Speed, number> = { 0: 0, 1: 2, 2: 4, 5: 10, 10: 20 };

export interface TimeParts {
  year: number; // 1-based
  month: number; // 0-11
  dayOfMonth: number; // 0-29
  dayIndex: number; // días totales desde el inicio
  weekday: number; // 0 = lunes
  hour: number;
  minute: number;
  minuteOfDay: number;
}

export function toParts(timeMin: number): TimeParts {
  const dayIndex = Math.floor(timeMin / MIN_PER_DAY);
  const minuteOfDay = timeMin - dayIndex * MIN_PER_DAY;
  return {
    year: Math.floor(dayIndex / DAYS_PER_YEAR) + 1,
    month: Math.floor((dayIndex % DAYS_PER_YEAR) / DAYS_PER_MONTH),
    dayOfMonth: dayIndex % DAYS_PER_MONTH,
    dayIndex,
    weekday: dayIndex % DAYS_PER_WEEK,
    hour: Math.floor(minuteOfDay / MIN_PER_HOUR),
    minute: minuteOfDay % MIN_PER_HOUR,
    minuteOfDay,
  };
}

export function dayOf(timeMin: number): number {
  return Math.floor(timeMin / MIN_PER_DAY);
}

export const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const pad = (n: number) => String(n).padStart(2, '0');

export function formatClock(timeMin: number): string {
  const p = toParts(timeMin);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

export function formatDate(timeMin: number): string {
  const p = toParts(timeMin);
  return `${WEEKDAY_NAMES[p.weekday]} ${p.dayOfMonth + 1} ${MONTH_NAMES[p.month]}, Año ${p.year}`;
}

export function formatDay(dayIndex: number): string {
  return formatDate(dayIndex * MIN_PER_DAY);
}

export function formatDateTime(timeMin: number): string {
  return `${formatDate(timeMin)} · ${formatClock(timeMin)}`;
}

export function monthLabel(monthAbs: number): string {
  // monthAbs: meses totales desde el inicio
  const year = Math.floor(monthAbs / MONTHS_PER_YEAR) + 1;
  return `${MONTH_NAMES[monthAbs % MONTHS_PER_YEAR]} Año ${year}`;
}

/** Horas en las que entran clientes (la última hora completa es CLOSE_HOUR - 1). */
export function isCustomerHour(hour: number): boolean {
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}

export function formatMinutesAsHM(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}
