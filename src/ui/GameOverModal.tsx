import { dayOf } from '../core/time';
import type { GameState } from '../domain/state';
import { Modal } from './components';
import { money } from './format';

export interface GameOverModalProps {
  state: GameState;
  onNewGame: () => void;
  onMenu: () => void;
}

export function GameOverModal({ state, onNewGame, onMenu }: GameOverModalProps) {
  const overdue = state.bills.filter((b) => b.status === 'overdue').length;

  return (
    <Modal role="alertdialog" titleId="gameover-title" descId="gameover-desc">
      <h2 id="gameover-title">Quiebra: fin de la partida</h2>
      <div id="gameover-desc">
        <p>{state.meta.gameName} ha cerrado sus puertas.</p>
        <ul>
          <li>Días jugados: {dayOf(state.clock.timeMin) + 1}</li>
          <li>Saldo final: {money(state.ledger.balanceCents)}</li>
          <li>Días en deuda: {state.flags.debtDays ?? 0}</li>
          <li>Facturas vencidas: {overdue}</li>
        </ul>
      </div>
      <div className="modal-actions">
        <button data-autofocus className="primary" onClick={onNewGame}>
          Nueva partida
        </button>
        <button onClick={onMenu}>Menú principal</button>
      </div>
    </Modal>
  );
}
