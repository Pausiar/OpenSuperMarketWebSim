import { useState } from 'react';
import { dayOf, formatDay, formatDateTime } from '../../core/time';
import { LOAN_OFFERS, monthlyPaymentCents } from '../../domain/data/loans';
import {
  payBill,
  repayLoanEarly,
  takeLoan,
  TX_CATEGORY_NAMES,
  type BillStatus,
  type TxCategory,
} from '../../domain/economy';
import { Badge, Card, ErrorBox, Stat } from '../components';
import { money } from '../format';
import { useGame } from '../useGame';

const BILL_STATUS: Record<
  BillStatus,
  { label: string; tone: 'green' | 'red' | 'yellow' | 'blue' }
> = {
  pending: { label: 'Pendiente', tone: 'yellow' },
  paid: { label: 'Pagada', tone: 'green' },
  overdue: { label: 'VENCIDA', tone: 'red' },
  cancelled: { label: 'Anulada', tone: 'blue' },
};

export function FinanceScreen() {
  const { state, run } = useGame();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TxCategory | 'all'>('all');
  const day = dayOf(state.clock.timeMin);

  const openBills = state.bills
    .filter((b) => b.status === 'pending' || b.status === 'overdue')
    .sort((a, b) => a.dueDay - b.dueDay);
  const closedBills = state.bills
    .filter((b) => b.status === 'paid' || b.status === 'cancelled')
    .slice(-10)
    .reverse();

  const transactions = [...state.ledger.transactions]
    .reverse()
    .filter((t) => filter === 'all' || t.category === filter)
    .slice(0, 100);

  return (
    <div className="screen">
      <h1>Finanzas</h1>
      <ErrorBox message={error} />

      <div className="grid cols-4">
        <Stat
          label="Caja"
          value={money(state.ledger.balanceCents)}
          tone={state.ledger.balanceCents < 0 ? 'bad' : undefined}
        />
        <Stat
          label="Facturas abiertas"
          value={money(openBills.reduce((a, b) => a + b.totalCents, 0))}
          sub={`${openBills.length} facturas`}
          tone={openBills.some((b) => b.status === 'overdue') ? 'bad' : undefined}
        />
        <Stat
          label="Deuda de préstamos"
          value={money(state.loans.reduce((a, l) => a + l.monthlyCents * l.remainingMonths, 0))}
          sub={`${state.loans.length} activos`}
        />
        <Stat label="Ventas de hoy" value={money(state.stats.today.revenueCents)} />
      </div>

      <Card title="Facturas">
        <table className="table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Periodo</th>
              <th>Detalle</th>
              <th className="num">Importe</th>
              <th>Vence</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {openBills.map((b) => (
              <tr key={b.id}>
                <td>{b.label}</td>
                <td className="dim">{b.periodLabel}</td>
                <td className="dim">{b.lines.join(' · ')}</td>
                <td className="num">{money(b.totalCents)}</td>
                <td className={b.dueDay < day ? 'dim' : ''}>{formatDay(b.dueDay)}</td>
                <td>
                  <Badge tone={BILL_STATUS[b.status].tone}>{BILL_STATUS[b.status].label}</Badge>
                </td>
                <td>
                  <button
                    className="small primary"
                    disabled={state.ledger.balanceCents < b.totalCents}
                    onClick={() => setError(run((ctx) => payBill(ctx, b.id)))}
                  >
                    Pagar
                  </button>
                </td>
              </tr>
            ))}
            {closedBills.map((b) => (
              <tr key={b.id} style={{ opacity: 0.55 }}>
                <td>{b.label}</td>
                <td className="dim">{b.periodLabel}</td>
                <td className="dim">{b.lines.join(' · ')}</td>
                <td className="num">{money(b.totalCents)}</td>
                <td>{formatDay(b.dueDay)}</td>
                <td>
                  <Badge tone={BILL_STATUS[b.status].tone}>{BILL_STATUS[b.status].label}</Badge>
                </td>
                <td></td>
              </tr>
            ))}
            {state.bills.length === 0 && (
              <tr>
                <td colSpan={7} className="dim">
                  Las facturas llegan al inicio de cada mes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="grid cols-2">
        <Card title="Préstamos activos">
          {state.loans.length === 0 && <span className="dim">No tienes préstamos.</span>}
          {state.loans.map((l) => (
            <div
              key={l.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
              }}
            >
              <div>
                <strong>{l.name}</strong>
                <div className="dim">
                  Cuota {money(l.monthlyCents)}/mes · quedan {l.remainingMonths} meses
                </div>
              </div>
              <button
                className="small"
                onClick={() => setError(run((ctx) => repayLoanEarly(ctx, l.id)))}
              >
                Amortizar ({money(Math.round(l.monthlyCents * l.remainingMonths * 0.97))})
              </button>
            </div>
          ))}
        </Card>

        <Card title="Solicitar financiación">
          {LOAN_OFFERS.map((offer) => (
            <div
              key={offer.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
              }}
            >
              <div>
                <strong>{offer.name}</strong> · {money(offer.principalCents)}
                <div className="dim">
                  {offer.months} meses · {(offer.annualRate * 100).toFixed(1)}% anual · cuota{' '}
                  {money(monthlyPaymentCents(offer))}
                </div>
              </div>
              <button
                className="small"
                onClick={() => setError(run((ctx) => takeLoan(ctx, offer.id)))}
              >
                Solicitar
              </button>
            </div>
          ))}
        </Card>
      </div>

      <Card
        title="Transacciones"
        actions={
          <select value={filter} onChange={(e) => setFilter(e.target.value as TxCategory | 'all')}>
            <option value="all">Todas las categorías</option>
            {Object.entries(TX_CATEGORY_NAMES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        }
      >
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th className="num">Importe</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td className="dim" style={{ whiteSpace: 'nowrap' }}>
                  {formatDateTime(t.timeMin)}
                </td>
                <td>
                  <Badge tone={t.kind === 'income' ? 'green' : undefined}>
                    {TX_CATEGORY_NAMES[t.category]}
                  </Badge>
                </td>
                <td>{t.description}</td>
                <td
                  className="num"
                  style={{ color: t.kind === 'income' ? 'var(--green)' : 'var(--red)' }}
                >
                  {t.kind === 'income' ? '+' : '−'}
                  {money(t.amountCents)}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="dim">
                  Sin transacciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
