import { dayOf, formatClock } from '../../core/time';
import { productDef } from '../../domain/data/products';
import { stockOf, incomingQty } from '../../domain/inventory';
import { scheduleIssues } from '../../domain/roster';
import { inventoryValueCents } from '../../domain/storeOps';
import { levelDef } from '../../domain/data/levels';
import { useGameStore } from '../../state/gameStore';
import { Badge, Card, Stat } from '../components';
import { money, num } from '../format';
import { useGame } from '../useGame';

export function DashboardScreen() {
  const { state } = useGame();
  const setScreen = useGameStore((s) => s.setScreen);
  const today = state.stats.today;
  const day = dayOf(state.clock.timeMin);

  const pendingBills = state.bills.filter((b) => b.status === 'pending');
  const overdueBills = state.bills.filter((b) => b.status === 'overdue');
  const brokenEquipment = state.store.equipment.filter((e) => e.broken);
  const lowStock = Object.entries(state.products).filter(
    ([id, ps]) => ps.active && stockOf(state, id) < ps.minStock && incomingQty(state, id) === 0,
  );
  const issues = scheduleIssues(state);
  const activeModifiers = state.modifiers.filter((m) => m.untilDay >= day);

  return (
    <div className="screen">
      <h1>Panel de control</h1>

      <div className="grid cols-6">
        <Stat
          label="Caja"
          value={money(state.ledger.balanceCents)}
          tone={state.ledger.balanceCents < 0 ? 'bad' : undefined}
          sub={`Inventario a coste: ${money(inventoryValueCents(state))}`}
        />
        <Stat
          label="Ventas hoy"
          value={money(today.revenueCents)}
          sub={`${num(today.itemsSold)} artículos`}
        />
        <Stat
          label="Clientes hoy"
          value={num(today.served)}
          sub={today.lost > 0 ? `${num(today.lost)} perdidos` : 'sin pérdidas'}
          tone={today.lost > today.served ? 'warn' : undefined}
        />
        <Stat
          label="Satisfacción"
          value={`${Math.round(state.store.satisfaction)}/100`}
          tone={
            state.store.satisfaction < 45
              ? 'bad'
              : state.store.satisfaction > 70
                ? 'good'
                : undefined
          }
        />
        <Stat label="Reputación" value={`${Math.round(state.store.reputation)}/100`} />
        <Stat
          label="Limpieza"
          value={`${Math.round(state.store.cleanliness)}/100`}
          tone={state.store.cleanliness < 45 ? 'bad' : undefined}
        />
      </div>

      <div className="grid cols-2">
        <Card title="Alertas">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {state.flags.blackout && (
              <div className="error-box">
                Corte de luz por impago. Paga la factura de electricidad para reabrir.
              </div>
            )}
            {overdueBills.length > 0 && (
              <div>
                <Badge tone="red">{overdueBills.length} facturas vencidas</Badge>{' '}
                <button className="small" onClick={() => setScreen('finance')}>
                  Ir a Finanzas
                </button>
              </div>
            )}
            {pendingBills.length > 0 && (
              <div>
                <Badge tone="yellow">{pendingBills.length} facturas pendientes</Badge>{' '}
                <span className="dim">
                  por {money(pendingBills.reduce((a, b) => a + b.totalCents, 0))}
                </span>
              </div>
            )}
            {brokenEquipment.length > 0 && (
              <div>
                <Badge tone="red">{brokenEquipment.length} equipos averiados</Badge>{' '}
                <button className="small" onClick={() => setScreen('store')}>
                  Reparar
                </button>
              </div>
            )}
            {lowStock.length > 0 && (
              <div>
                <Badge tone="yellow">Stock bajo</Badge>{' '}
                <span className="dim">
                  {lowStock
                    .slice(0, 5)
                    .map(([id]) => productDef(id).name)
                    .join(', ')}
                  {lowStock.length > 5 ? ` y ${lowStock.length - 5} más` : ''}
                </span>
              </div>
            )}
            {issues.length > 0 && (
              <div>
                <Badge tone={issues.some((i) => i.severity === 'error') ? 'red' : 'yellow'}>
                  {issues.length} avisos de turnos
                </Badge>{' '}
                <button className="small" onClick={() => setScreen('schedule')}>
                  Ver horarios
                </button>
              </div>
            )}
            {activeModifiers.map((m) => (
              <div key={m.id}>
                <Badge tone="blue">{m.label}</Badge>{' '}
                <span className="dim">hasta el día {m.untilDay + 1}</span>
              </div>
            ))}
            {!state.flags.blackout &&
              overdueBills.length +
                pendingBills.length +
                brokenEquipment.length +
                lowStock.length +
                issues.length ===
                0 && <span className="dim">Todo en orden.</span>}
          </div>
        </Card>

        <Card title="Actividad reciente">
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {[...state.notifications]
              .reverse()
              .slice(0, 30)
              .map((n) => (
                <div key={n.id} className={`notif ${n.severity}`}>
                  <span className="time">
                    D{dayOf(n.timeMin) + 1} {formatClock(n.timeMin)}
                  </span>
                  <span>{n.message}</span>
                </div>
              ))}
            {state.notifications.length === 0 && (
              <span className="dim">Sin actividad todavía.</span>
            )}
          </div>
        </Card>
      </div>

      <Card title="Últimos 14 días">
        <DailyChart />
      </Card>

      <Card title={`Nivel: ${levelDef(state.store.level).name}`}>
        <span className="dim">
          Nivel {state.store.level} de 5 · Empleados: {state.employees.length} · Equipamiento:{' '}
          {state.store.equipment.length} unidades
        </span>{' '}
        <button className="small" onClick={() => setScreen('store')}>
          Gestionar tienda
        </button>
      </Card>
    </div>
  );
}

function DailyChart() {
  const { state } = useGame();
  const days = state.stats.days.slice(-14);
  if (days.length === 0) return <span className="dim">Aún no hay días cerrados.</span>;
  const max = Math.max(...days.map((d) => d.revenueCents), 1);
  return (
    <>
      <div className="barchart">
        {days.map((d) => (
          <div
            key={d.day}
            className="bar"
            style={{ height: `${(d.revenueCents / max) * 100}%` }}
            title={`Día ${d.day + 1}: ${money(d.revenueCents)} · ${d.served} clientes`}
          />
        ))}
      </div>
      <small className="dim">Ventas diarias (pasa el cursor para ver detalles).</small>
    </>
  );
}
