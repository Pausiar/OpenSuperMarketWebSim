import React, { useEffect } from 'react';
import { formatClock, formatDate, SPEEDS, type Speed } from './core/time';
import { useGameStore, type ScreenId } from './state/gameStore';
import { MainMenu } from './ui/MainMenu';
import { money } from './ui/format';
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

const SPEED_LABEL: Record<Speed, string> = { 0: '⏸', 1: '1x', 2: '2x', 5: '5x', 10: '10x' };

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
  return <GameShell />;
}

function GameShell() {
  const engine = useGameStore((s) => s.engine)!;
  useGameStore((s) => s.revision);
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);
  const setSpeed = useGameStore((s) => s.setSpeed);

  const state = engine.state;
  const Screen = SCREENS[screen];

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
              className={state.clock.speed === s ? 'active' : ''}
              onClick={() => setSpeed(s)}
            >
              {SPEED_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <div className="main-area">
        <nav className="sidebar">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={screen === item.id ? 'active' : ''}
              onClick={() => setScreen(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <Screen />
      </div>
    </div>
  );
}
