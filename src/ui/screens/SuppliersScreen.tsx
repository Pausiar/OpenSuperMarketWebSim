import { useMemo, useState } from 'react';
import { formatDay } from '../../core/time';
import { productDef } from '../../domain/data/products';
import { SUPPLIERS, supplierDef } from '../../domain/data/suppliers';
import { incomingQty, stockOf } from '../../domain/inventory';
import { placeOrder, quoteUnitCents } from '../../domain/orders';
import { supplierPriceFactor } from '../../domain/state';
import { Badge, Card, ErrorBox } from '../components';
import { money, num, pct } from '../format';
import { useGame } from '../useGame';

export function SuppliersScreen() {
  const { state, run } = useGame();
  const [supplierId, setSupplierId] = useState(SUPPLIERS[0].id);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const supplier = supplierDef(supplierId);
  const priceEvent = supplierPriceFactor(state, supplierId);

  const totalCents = useMemo(
    () =>
      supplier.catalog.reduce(
        (acc, pid) => acc + (qty[pid] ?? 0) * quoteUnitCents(state, supplierId, pid),
        0,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [qty, supplierId, state.clock.timeMin],
  );

  const submit = () => {
    const lines = Object.entries(qty)
      .filter(([, q]) => q > 0)
      .map(([productId, q]) => ({ productId, qty: q }));
    const err = run((ctx) => placeOrder(ctx, supplierId, lines));
    setError(err);
    if (!err) {
      setQty({});
      setOkMsg(`Pedido realizado a ${supplier.name} por ${money(totalCents)}.`);
      setTimeout(() => setOkMsg(null), 4000);
    }
  };

  const activeOrders = state.orders.filter((o) => o.status === 'inTransit');
  const pastOrders = [...state.orders.filter((o) => o.status !== 'inTransit')]
    .reverse()
    .slice(0, 10);

  return (
    <div className="screen">
      <h1>Proveedores y pedidos</h1>
      <ErrorBox message={error} />
      {okMsg && (
        <div
          className="error-box"
          style={{ borderColor: 'var(--green)', color: 'var(--green)', background: '#143528' }}
        >
          {okMsg}
        </div>
      )}

      <div className="grid cols-4">
        {SUPPLIERS.map((s) => (
          <div
            key={s.id}
            className="card"
            style={{
              cursor: 'pointer',
              borderColor: s.id === supplierId ? 'var(--accent)' : undefined,
            }}
            onClick={() => {
              setSupplierId(s.id);
              setQty({});
            }}
          >
            <h2>{s.name}</h2>
            <p className="dim" style={{ fontSize: 12.5 }}>
              {s.description}
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                fontSize: 12.5,
                marginTop: 6,
              }}
            >
              <span>
                Pedido mínimo: <strong>{money(s.minOrderCents)}</strong>
              </span>
              <span>
                Entrega: <strong>{s.leadDays} día(s)</strong>
              </span>
              <span>
                Fiabilidad: <strong>{pct(s.reliability * 100)}</strong>
              </span>
              <span>{s.catalog.length} productos</span>
            </div>
          </div>
        ))}
      </div>

      <Card
        title={`Nuevo pedido a ${supplier.name}`}
        actions={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {priceEvent > 1 && (
              <Badge tone="red">Precios +{Math.round((priceEvent - 1) * 100)}% (evento)</Badge>
            )}
            <strong
              style={{
                color: totalCents >= supplier.minOrderCents ? 'var(--green)' : 'var(--yellow)',
              }}
            >
              Total: {money(totalCents)}
            </strong>
            <button className="primary" disabled={totalCents === 0} onClick={submit}>
              Realizar pedido
            </button>
          </div>
        }
      >
        {totalCents > 0 && totalCents < supplier.minOrderCents && (
          <p style={{ color: 'var(--yellow)' }}>
            Por debajo del pedido mínimo ({money(supplier.minOrderCents)}).
          </p>
        )}
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="num">Precio/ud</th>
              <th className="num">Stock</th>
              <th className="num">En camino</th>
              <th className="num">Cantidad</th>
              <th className="num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {supplier.catalog.map((pid) => {
              const def = productDef(pid);
              const unit = quoteUnitCents(state, supplierId, pid);
              const q = qty[pid] ?? 0;
              return (
                <tr key={pid}>
                  <td>{def.name}</td>
                  <td className="num">{money(unit)}</td>
                  <td className="num dim">{stockOf(state, pid)}</td>
                  <td className="num dim">{incomingQty(state, pid) || '—'}</td>
                  <td className="num">
                    <input
                      type="number"
                      min="0"
                      value={q || ''}
                      placeholder="0"
                      onChange={(e) =>
                        setQty({ ...qty, [pid]: Math.max(0, parseInt(e.target.value) || 0) })
                      }
                    />
                  </td>
                  <td className="num">{q > 0 ? money(q * unit) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title="Pedidos">
        <table className="table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Proveedor</th>
              <th className="num">Líneas</th>
              <th className="num">Total</th>
              <th>Realizado</th>
              <th>Entrega prevista</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {[...activeOrders].reverse().map((o) => (
              <tr key={o.id}>
                <td className="dim">{o.id}</td>
                <td>{supplierDef(o.supplierId).name}</td>
                <td className="num">{num(o.lines.reduce((a, l) => a + l.qty, 0))} uds</td>
                <td className="num">{money(o.totalCents)}</td>
                <td className="dim">{formatDay(o.placedDay)}</td>
                <td>
                  {formatDay(o.expectedDay)}
                  {o.note && <span style={{ color: 'var(--yellow)' }}> · {o.note}</span>}
                </td>
                <td>
                  <Badge tone="blue">En camino</Badge>
                </td>
              </tr>
            ))}
            {pastOrders.map((o) => (
              <tr key={o.id} style={{ opacity: 0.55 }}>
                <td className="dim">{o.id}</td>
                <td>{supplierDef(o.supplierId).name}</td>
                <td className="num">{num(o.lines.reduce((a, l) => a + l.qty, 0))} uds</td>
                <td className="num">{money(o.totalCents)}</td>
                <td className="dim">{formatDay(o.placedDay)}</td>
                <td className="dim">
                  {o.deliveredDay !== undefined ? formatDay(o.deliveredDay) : '—'}
                </td>
                <td>
                  <Badge tone={o.status === 'delivered' ? 'green' : undefined}>
                    {o.status === 'delivered' ? 'Entregado' : 'Anulado'}
                  </Badge>
                </td>
              </tr>
            ))}
            {state.orders.length === 0 && (
              <tr>
                <td colSpan={7} className="dim">
                  Todavía no has hecho ningún pedido.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
