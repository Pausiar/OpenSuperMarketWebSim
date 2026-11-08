import React, { useCallback, useEffect, useRef, useState } from 'react';
import { formatClock, formatDate, SPEEDS, type Speed } from './core/time';
import { useGameStore, type ScreenId } from './state/gameStore';
import { GameOverModal } from './ui/GameOverModal';
import { MainMenu } from './ui/MainMenu';
import { ToastStack, type ToastItem } from './ui/components';
import { money } from './ui/format';
import { TutorialPanel } from './ui/TutorialPanel';
import { DashboardScreen } from './ui/screens/DashboardScreen';
import { EmployeesScreen } from './ui/screens/EmployeesScreen';
import { FinanceScreen } from './ui/screens/FinanceScreen';
import { InventoryScreen } from './ui/screens/InventoryScreen';
import { ProductsScreen } from './ui/screens/ProductsScreen';
import { ReportsScreen } from './ui/screens/ReportsScreen';
import { ScheduleScreen } from './ui/screens/ScheduleScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { StoreScreen } from './ui/screens/StoreScreen';
import { SuppliersScreen } from './ui/screens/SuppliersScreen';

const NAV: { id: ScreenId; label: string }[] = [
  { id: 'dashboard', label: '📊 Panel' },
  { id: 'finance', label: '💶 Finanzas' },
  { id: 'products', label: '🏷 Productos' },
  { id: 'inventory', label: '📦 Inventario' },
  { id: 'suppliers', label: '🚚 Proveedores' },
  { id: 'employees', label: '👥 Empleados' },
  { id: 'schedule', label: '🗓 Horarios' },
  { id: 'store', label: '🏪 Tienda' },
  { id: 'reports', label: '📈 Informes' },
  { id: 'settings', label: '⚙ Ajustes' },
];

const SCREENS: Record<ScreenId, () => React.JSX.Element> = {
  dashboard: DashboardScreen,
  finance: FinanceScreen,
  products: ProductsScreen,
  inventory: InventoryScreen,
  suppliers: SuppliersScreen,
  employees: EmployeesScreen,
  schedule: ScheduleScreen,
  store: StoreScreen,
  reports: ReportsScreen,
  settings: SettingsScreen,
};

const SPEED_LABEL: Record<Speed, string> = {
  0: '⏸',
  1: '1x',
  2: '2x',
  5: '5x',
  10: '10x',
};
const SPEED_NAME: Record<Speed, string> = {
  0: 'Pausar',
  1: 'Velocidad 1x',
  2: 'Velocidad 2x',
  5: 'Velocidad 5x',
  10: 'Velocidad 10x',
};

const MAX_TOASTS = 3;

export default function App() {
  const engine = useGameStore((s) => s.engine);
  const tick = useGameStore((s) => s.tick);

  // Driver único del reloj de simulación.
  useEffect(() => {
    if (!engine) return;
    let last = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      tick(now - last);
      last = now;
    }, 250);
    return () => clearInterval(interval);
  }, [engine, tick]);

  if (!engine) return <MainMenu />;
  // La key reinicia avisos y pantalla al cambiar de partida sin pasar por el menú.
  return <GameShell key={`${engine.state.seed}:${engine.state.meta.createdAt}`} />;
}

function GameShell() {
  const engine = useGameStore((s) => s.engine)!;
  const revision = useGameStore((s) => s.revision);
  const saveId = useGameStore((s) => s.saveId);
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const setSpeed = useGameStore((s) => s.setSpeed);
  const newGame = useGameStore((s) => s.newGame);
  const quitToMenu = useGameStore((s) => s.quitToMenu);

  const state = engine.state;
  const Screen = SCREENS[screen];
  const gameOver = state.flags.gameOver === true;

  // Avisos: solo las notificaciones nuevas desde la última revisión; las previas a montar no se muestran.
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenRef = useRef<string | null>(state.notifications.at(-1)?.id ?? null);
  useEffect(() => {
    const all = engine.state.notifications;
    const last = all.at(-1);
    if (!last || last.id === seenRef.current) return;
    const seenIdx = seenRef.current === null ? -1 : all.findIndex((n) => n.id === seenRef.current);
    const fresh = seenIdx >= 0 ? all.slice(seenIdx + 1) : all.slice(-MAX_TOASTS);
    seenRef.current = last.id;
    setToasts((prev) =>
      [
        ...prev,
        ...fresh.map((n) => ({
          id: n.id,
          severity: n.severity,
          message: n.message,
        })),
      ].slice(-MAX_TOASTS),
    );
  }, [engine, revision]);
  const dismissToast = useCallback(
    (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  return (
    <div className="app-shell">
      <div className="topbar">
        <span className="brand">🛒 {state.meta.gameName}</span>
        <span className="datetime">
          {formatDate(state.clock.timeMin)} · {formatClock(state.clock.timeMin)}
        </span>
        <span className={`money ${state.ledger.balanceCents < 0 ? 'negative' : ''}`}>
          {money(state.ledger.balanceCents)}
        </span>
        {state.flags.blackout && <span className="badge red">⚡ SIN LUZ</span>}
        <span className="spacer" />
        <div className="speed-controls">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-label={SPEED_NAME[s]}
              aria-pressed={state.clock.speed === s}
              title={SPEED_NAME[s]}
              className={state.clock.speed === s ? 'active' : ''}
              onClick={() => setSpeed(s)}
            >
              {SPEED_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="main-area">
        <nav className="sidebar" aria-label="Secciones">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={screen === item.id ? 'active' : ''}
              aria-current={screen === item.id ? 'page' : undefined}
              onClick={() => setScreen(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="content">
          {saveId && !gameOver && (
            <TutorialPanel state={state} saveId={saveId} onNavigate={setScreen} />
          )}
          <Screen />
        </div>
      </div>
      <ToastStack items={toasts} onDismiss={dismissToast} />
      {gameOver && (
        <GameOverModal
          state={state}
          onNewGame={() => newGame(state.meta.gameName)}
          onMenu={quitToMenu}
        />
      )}
    </div>
  );
}
