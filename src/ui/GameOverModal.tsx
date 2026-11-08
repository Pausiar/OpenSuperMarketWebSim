import { dayOf } from '../core/time';
import type { GameState } from '../domain/state';
import { Modal } from './components';
import { money } from './format';
import { WarningIcon } from './icons';
import './modal.css';

export interface GameOverModalProps {
  state: GameState;
  onNewGame: () => void;
  onMenu: () => void;
}

export function GameOverModal({ state, onNewGame, onMenu }: GameOverModalProps) {
  const overdue = state.bills.filter((b) => b.status === 'overdue').length;
  const days = dayOf(state.clock.timeMin) + 1;
  const debtDays = state.flags.debtDays ?? 0;

  return (
    <Modal role="alertdialog" titleId="gameover-title" descId="gameover-desc">
      <div className="gameover">
        <h2 id="gameover-title" className="gameover-title">
          <WarningIcon size={20} className="gameover-icon" />
          <span>Quiebra: fin de la partida</span>
        </h2>
        <div id="gameover-desc" className="gameover-desc">
          <p>{state.meta.gameName} ha cerrado sus puertas.</p>
          <ul className="gameover-stats">
            <li>
              <span>Días jugados:</span> <strong>{days}</strong>
            </li>
            <li>
              <span>Saldo final:</span> <strong>{money(state.ledger.balanceCents)}</strong>
            </li>
            <li>
              <span>Días en deuda:</span> <strong>{debtDays}</strong>
            </li>
            <li>
              <span>Facturas vencidas:</span> <strong>{overdue}</strong>
            </li>
          </ul>
        </div>
        <div className="modal-actions">
          <button data-autofocus className="primary" onClick={onNewGame}>
            Nueva partida
          </button>
          <button onClick={onMenu}>Menú principal</button>
        </div>
      </div>
    </Modal>
  );
}
