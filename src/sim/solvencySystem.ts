import {
  BANKRUPTCY_DEBT_DAYS,
  bankruptcyReason,
  countOverdueBills,
  gameOverMessage,
  isWarningDay,
  nextDebtDays,
} from '../domain/solvency';
import type { SimSystem } from './engine';

/** Quiebra: evalúa la solvencia al inicio de cada día (tras facturación). */
export const solvencySystem: SimSystem = {
  id: 'solvency',

  onDayStart(ctx) {
    const { state } = ctx;
    if (state.flags.gameOver) {
      state.clock.speed = 0;
      return;
    }
    const debtDays = nextDebtDays(state.flags.debtDays ?? 0, state.ledger.balanceCents);
    state.flags.debtDays = debtDays;

    const reason = bankruptcyReason(debtDays, countOverdueBills(state));
    if (reason) {
      state.flags.gameOver = true;
      state.clock.speed = 0;
      ctx.notify('error', gameOverMessage(reason));
      return;
    }
    if (isWarningDay(debtDays)) {
      ctx.notify(
        'warn',
        `Llevas ${debtDays} días seguidos en números rojos. Si llegas a ${BANKRUPTCY_DEBT_DAYS}, el negocio quebrará.`,
      );
    }
  },
};
