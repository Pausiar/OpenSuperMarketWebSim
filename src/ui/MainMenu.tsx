import { useEffect, useRef, useState } from 'react';
import { deleteGame, listSaves } from '../persistence/saveRepo';
import { useGameStore } from '../state/gameStore';
import { Card, ErrorBox } from './components';
import { money } from './format';
import {
  TILE,
  cashierSprite,
  customerSprite,
  drawSprite,
  spriteFor,
  stockerSprite,
  tileSprite,
  type SpriteMap,
} from './storeview/pixel';
import './menu.css';

/** Escaparate estático: 6 x 4 casillas, escala entera para que el pixel-art quede nítido. */
const COLS = 6;
const ROWS = 4;
const SCALE = 3;
const STAGE_W = COLS * TILE * SCALE;
const STAGE_H = ROWS * TILE * SCALE;

interface Piece {
  key: string;
  rows: SpriteMap;
  col: number;
  row: number;
}

function storefrontPieces(): Piece[] {
  const pieces: Piece[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (row === 0) {
        const door = col === 2;
        pieces.push(
          door
            ? { key: 'door', rows: tileSprite('door'), col, row }
            : { key: 'wall', rows: tileSprite('wall'), col, row },
        );
      } else {
        const v = (col + row) % 2;
        pieces.push({ key: `floor${v}`, rows: tileSprite('floor', v), col, row });
      }
    }
  }
  // Estanterías, nevera y congelador contra la pared.
  pieces.push({ key: 'fridge', rows: spriteFor('fridge'), col: 0, row: 1 });
  pieces.push({ key: 'freezer', rows: spriteFor('freezer'), col: 5, row: 1 });
  for (const col of [1, 2, 3, 4]) {
    const id = `menu-shelf-${col}`;
    pieces.push({ key: id, rows: spriteFor('shelf', id), col, row: 1 });
  }
  // Personal y clientes sobre el suelo; la caja al fondo.
  pieces.push({ key: 'customer-a', rows: customerSprite(1, 'down', 0), col: 1, row: 2 });
  pieces.push({ key: 'stocker', rows: stockerSprite('right', 0), col: 3, row: 2 });
  pieces.push({ key: 'cashier', rows: cashierSprite('down', 0), col: 4, row: 2 });
  pieces.push({ key: 'customer-b', rows: customerSprite(3, 'left', 0), col: 5, row: 2 });
  pieces.push({ key: 'checkout', rows: spriteFor('checkout'), col: 4, row: 3 });
  return pieces;
}

function drawStorefront(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  for (const p of storefrontPieces()) {
    drawSprite(ctx, `menu:${p.key}`, p.rows, p.col * TILE * SCALE, p.row * TILE * SCALE, SCALE);
  }
}

function Storefront() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Sin canvas (SSR, pruebas o navegadores antiguos) el escaparate simplemente no se dibuja.
    const ctx = canvasRef.current?.getContext('2d') ?? null;
    if (ctx) drawStorefront(ctx);
  }, []);

  return (
    <div className="menu-stage" aria-hidden="true">
      <canvas ref={canvasRef} width={STAGE_W} height={STAGE_H} className="menu-canvas" />
    </div>
  );
}

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
        <Storefront />

        <div className="menu-title">
          <h1>Supermarket Tycoon</h1>
          <p>Gestiona tu supermercado: compras, precios, personal, facturas y expansión.</p>
        </div>

        <Card title="Nueva partida">
          <div className="form-row">
            <input
              className="menu-name"
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
            {error && (
              <div role="alert" className="menu-alert">
                <ErrorBox message={error} />
              </div>
            )}
            {saves.map((s) => (
              <div key={s.id} className="save-row">
                <div className="save-info">
                  <strong>{s.name}</strong>
                  <div className="dim save-meta">
                    Día {s.day + 1} · Nivel {s.level} · {money(s.balanceCents)} ·{' '}
                    {new Date(s.savedAt).toLocaleString('es-ES')} · Guardado v{s.saveVersion ?? 1}
                  </div>
                </div>
                <div className="save-actions">
                  <button
                    className="small primary"
                    onClick={() => setError(loadGame(s.id))}
                    aria-label={`Cargar ${s.name}`}
                  >
                    Cargar
                  </button>
                  <button
                    className="small danger"
                    aria-label={`Borrar ${s.name}`}
                    onClick={() => {
                      deleteGame(s.id);
                      setError(null);
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
