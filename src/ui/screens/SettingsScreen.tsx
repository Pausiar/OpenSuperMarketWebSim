import { useState } from 'react';
import { dayOf } from '../../core/time';
import { listSaves, deleteGame } from '../../persistence/saveRepo';
import { useGameStore } from '../../state/gameStore';
import { Card, ErrorBox } from '../components';
import { money } from '../format';
import { useGame } from '../useGame';

export function SettingsScreen() {
  const { state } = useGame();
  const saveNow = useGameStore((s) => s.saveNow);
  const quitToMenu = useGameStore((s) => s.quitToMenu);
  const loadGame = useGameStore((s) => s.loadGame);
  const saveId = useGameStore((s) => s.saveId);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [, forceRefresh] = useState(0);

  const saves = listSaves();

  return (
    <div className="screen">
      <h1>Ajustes y partidas</h1>
      <ErrorBox message={error} />

      <Card title="Partida actual">
        <p>
          <strong>{state.meta.gameName}</strong> · Día {dayOf(state.clock.timeMin) + 1} ·{' '}
          {money(state.ledger.balanceCents)} · semilla {state.seed}
        </p>
        <p className="dim" style={{ fontSize: 12.5 }}>
          La partida se guarda automáticamente al empezar cada día. Versión de guardado:{' '}
          {state.saveVersion}.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button
            className="primary"
            onClick={() => {
              saveNow();
              setSavedMsg(true);
              setTimeout(() => setSavedMsg(false), 2500);
            }}
          >
            Guardar ahora
          </button>
          <button onClick={quitToMenu}>Guardar y salir al menú</button>
          {savedMsg && (
            <span style={{ color: 'var(--green)', alignSelf: 'center' }}>Partida guardada ✓</span>
          )}
        </div>
      </Card>

      <Card title="Partidas guardadas">
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Progreso</th>
              <th className="num">Caja</th>
              <th>Guardada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {saves.map((s) => (
              <tr key={s.id} style={{ fontWeight: s.id === saveId ? 600 : undefined }}>
                <td>
                  {s.name}
                  {s.id === saveId && <span className="dim"> (actual)</span>}
                </td>
                <td className="dim">
                  Día {s.day + 1} · Nivel {s.level}
                </td>
                <td className="num">{money(s.balanceCents)}</td>
                <td className="dim">{new Date(s.savedAt).toLocaleString('es-ES')}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  {s.id !== saveId && (
                    <button className="small" onClick={() => setError(loadGame(s.id))}>
                      Cargar
                    </button>
                  )}
                  <button
                    className="small danger"
                    onClick={() => {
                      deleteGame(s.id);
                      forceRefresh((n) => n + 1);
                    }}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
            {saves.length === 0 && (
              <tr>
                <td colSpan={5} className="dim">
                  No hay partidas guardadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Cómo funciona el tiempo">
        <p className="dim" style={{ fontSize: 13 }}>
          Apertura 9:00–22:00 · Cierre contable a las 23:00 · Entregas a las 8:00 · Facturas y
          nóminas el día 1 de cada mes · Meses de 30 días. Velocidades: 1x = 2 min de juego por
          segundo real.
        </p>
      </Card>
    </div>
  );
}
