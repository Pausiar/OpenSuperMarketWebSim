import type { GameState } from './state';

/** Límite de descubierto: por debajo de este saldo cuenta como día de deuda. */
export const OVERDRAFT_LIMIT_CENTS = -100_000;
/** Días consecutivos por debajo del límite que provocan la quiebra. */
export const BANKRUPTCY_DEBT_DAYS = 30;
/** Facturas vencidas sin pagar que provocan la quiebra. */
export const BANKRUPTCY_OVERDUE_BILLS = 3;
/** Días de deuda en los que se avisa al jugador. */
export const DEBT_WARNING_DAYS = [10, 20] as const;

export type GameOverReason = 'debt' | 'bills';

export function isBelowOverdraft(balanceCents: number): boolean {
  return balanceCents < OVERDRAFT_LIMIT_CENTS;
}

export function countOverdueBills(state: Pick<GameState, 'bills'>): number {
  return state.bills.filter((b) => b.status === 'overdue').length;
}

/** Nuevo contador de días de deuda consecutivos tras evaluar el día. */
export function nextDebtDays(current: number, balanceCents: number): number {
  return isBelowOverdraft(balanceCents) ? current + 1 : 0;
}

export function isWarningDay(debtDays: number): boolean {
  return (DEBT_WARNING_DAYS as readonly number[]).includes(debtDays);
}

export function bankruptcyReason(debtDays: number, overdueBills: number): GameOverReason | null {
  if (debtDays >= BANKRUPTCY_DEBT_DAYS) return 'debt';
  if (overdueBills >= BANKRUPTCY_OVERDUE_BILLS) return 'bills';
  return null;
}

export function gameOverMessage(reason: GameOverReason): string {
  return reason === 'debt'
    ? `Fin de la partida: llevas ${BANKRUPTCY_DEBT_DAYS} días seguidos en números rojos. El banco ha embargado tu supermercado.`
    : `Fin de la partida: tienes ${BANKRUPTCY_OVERDUE_BILLS} facturas vencidas sin pagar. Tus acreedores han cerrado el negocio.`;
}
