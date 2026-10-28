import { useState } from 'react';
import { deleteGame, listSaves } from '../persistence/saveRepo';
import { useGameStore } from '../state/gameStore';
import { Card, ErrorBox } from './components';
import { money } from './format';

export function MainMenu() {
  const newGame = useGameStore((s) => s.newGame);
  const loadGame = useGameStore((s) => s.loadGame);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [, forceRefresh] = useState(0);

  const saves = listSaves();

  return (
    <div className="menu-screen">
      <div className="menu-box">
        <div className="menu-title">
          <h1>Supermarket Tycoon</h1>
          <p>Gestiona tu supermercado: compras, precios, personal, facturas y expansión.</p>
        </div>
        <ErrorBox message={error} />

        <Card title="Nueva partida">
          <div className="form-row">
            <input
              style={{ flex: 1 }}
              placeholder="Nombre del supermercado"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && newGame(name)}
            />
            <button className="primary" onClick={() => newGame(name)}>
              Empezar
            </button>
          </div>
          <small className="dim">
            Empiezas con 25.000 €, una tienda pequeña, 3 empleados y stock inicial.
          </small>
        </Card>

        {saves.length > 0 && (
          <Card title="Continuar partida">
            {saves.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: '1px solid rgba(42,54,80,.4)',
                }}
              >
                <div>
                  <strong>{s.name}</strong>
                  <div className="dim" style={{ fontSize: 12 }}>
                    Día {s.day + 1} · Nivel {s.level} · {money(s.balanceCents)} ·{' '}
                    {new Date(s.savedAt).toLocaleString('es-ES')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="small primary" onClick={() => setError(loadGame(s.id))}>
                    Cargar
                  </button>
                  <button
                    className="small danger"
                    onClick={() => {
                      deleteGame(s.id);
                      forceRefresh((n) => n + 1);
                    }}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
