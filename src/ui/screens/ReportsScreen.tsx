import { monthLabel, formatDay } from '../../core/time';
import { Card, Stat } from '../components';
import { money, num } from '../format';
import { useGame } from '../useGame';

export function ReportsScreen() {
  const { state } = useGame();
  const monthly = [...state.stats.monthly].reverse();
  const last = monthly[0];
  const days = [...state.stats.days].reverse().slice(0, 14);

  return (
    <div className="screen">
      <h1>Informes</h1>

      {last ? (
        <div className="grid cols-4">
          <Stat
            label={`Ingresos (${monthLabel(last.monthAbs)})`}
            value={money(last.revenueCents)}
          />
          <Stat label="Gastos" value={money(last.expensesCents)} />
          <Stat
            label="Resultado"
            value={money(last.profitCents)}
            tone={last.profitCents >= 0 ? 'good' : 'bad'}
          />
          <Stat
            label="Clientes atendidos"
            value={num(last.customers)}
            sub={`${num(last.itemsSold)} artículos`}
          />
        </div>
      ) : (
        <Card>
          <span className="dim">El primer informe mensual llegará al cerrar el mes en curso.</span>
        </Card>
      )}

      {last && Object.keys(last.expensesByCategory).length > 0 && (
        <Card title={`Desglose de gastos — ${monthLabel(last.monthAbs)}`}>
          <table className="table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th className="num">Importe</th>
                <th className="num">% del gasto</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(last.expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, cents]) => (
                  <tr key={category}>
                    <td>{category}</td>
                    <td className="num">{money(cents)}</td>
                    <td className="num dim">
                      {((cents / Math.max(last.expensesCents, 1)) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card title="Histórico mensual">
        <table className="table">
          <thead>
            <tr>
              <th>Mes</th>
              <th className="num">Ingresos</th>
              <th className="num">Gastos</th>
              <th className="num">Resultado</th>
              <th className="num">Clientes</th>
              <th className="num">Artículos</th>
            </tr>
          </thead>
          <tbody>
            {monthly.map((r) => (
              <tr key={r.monthAbs}>
                <td>{monthLabel(r.monthAbs)}</td>
                <td className="num">{money(r.revenueCents)}</td>
                <td className="num">{money(r.expensesCents)}</td>
                <td
                  className="num"
                  style={{ color: r.profitCents >= 0 ? 'var(--green)' : 'var(--red)' }}
                >
                  {money(r.profitCents)}
                </td>
                <td className="num">{num(r.customers)}</td>
                <td className="num">{num(r.itemsSold)}</td>
              </tr>
            ))}
            {monthly.length === 0 && (
              <tr>
                <td colSpan={6} className="dim">
                  Aún no hay meses cerrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Últimos días">
        <table className="table">
          <thead>
            <tr>
              <th>Día</th>
              <th className="num">Clientes</th>
              <th className="num">Perdidos</th>
              <th className="num">Artículos</th>
              <th className="num">Ventas</th>
              <th className="num">Caducados</th>
              <th className="num">Robos</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day}>
                <td>{formatDay(d.day)}</td>
                <td className="num">{num(d.served)}</td>
                <td className="num" style={{ color: d.lost > 0 ? 'var(--yellow)' : undefined }}>
                  {num(d.lost)}
                </td>
                <td className="num">{num(d.itemsSold)}</td>
                <td className="num">{money(d.revenueCents)}</td>
                <td
                  className="num"
                  style={{ color: d.expiredUnits > 0 ? 'var(--red)' : undefined }}
                >
                  {d.expiredUnits > 0 ? `${d.expiredUnits} (${money(d.expiredValueCents)})` : '—'}
                </td>
                <td className="num" style={{ color: d.theftUnits > 0 ? 'var(--red)' : undefined }}>
                  {d.theftUnits > 0 ? `${d.theftUnits} (${money(d.theftValueCents)})` : '—'}
                </td>
              </tr>
            ))}
            {days.length === 0 && (
              <tr>
                <td colSpan={7} className="dim">
                  Todavía no hay días cerrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
