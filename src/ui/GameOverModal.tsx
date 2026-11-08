import { useEffect, useRef } from 'react';
import { dayOf } from '../core/time';
import type { GameState } from '../domain/state';
import { money } from './format';

export interface GameOverModalProps {
  state: GameState;
  onNewGame: () => void;
  onMenu: () => void;
}

export function GameOverModal({ state, onNewGame, onMenu }: GameOverModalProps) {
  const primaryRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    primaryRef.current?.focus();
  }, []);

  const overdue = state.bills.filter((b) => b.status === 'overdue').length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="gameover-title"
        aria-describedby="gameover-desc"
        style={{
          background: 'var(--panel, #1b2333)',
          color: 'inherit',
          padding: 24,
          borderRadius: 8,
          maxWidth: 420,
          width: '90%',
        }}
        onKeyDown={(e) => {
          if (e.key !== 'Tab') return;
          const btns = e.currentTarget.querySelectorAll<HTMLButtonElement>('button');
          const first = btns[0];
          const last = btns[btns.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
      >
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
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button ref={primaryRef} className="primary" onClick={onNewGame}>
            Nueva partida
          </button>
          <button onClick={onMenu}>Menú principal</button>
        </div>
      </div>
    </div>
  );
}
