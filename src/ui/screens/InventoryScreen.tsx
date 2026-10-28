import { dayOf, formatDay } from '../../core/time';
import { PRODUCTS, type StorageType } from '../../domain/data/products';
import { capacityByStorage, incomingQty, stockByStorage, stockOf } from '../../domain/inventory';
import { Badge, Card, Progress } from '../components';
import { money, num } from '../format';
import { useGame } from '../useGame';

const STORAGE_LABEL: Record<StorageType, string> = {
  ambient: 'Estanterías (ambiente)',
  chilled: 'Refrigerado',
  frozen: 'Congelado',
};

export function InventoryScreen() {
  const { state } = useGame();
  const day = dayOf(state.clock.timeMin);
  const stock = stockByStorage(state);
  const capacity = capacityByStorage(state);

  const expiringSoon = state.lots
    .filter((l) => l.expiresDay !== null && l.expiresDay - day <= 2 && l.qty > 0)
    .sort((a, b) => (a.expiresDay ?? 0) - (b.expiresDay ?? 0));

  const totalUnits = state.lots.reduce((a, l) => a + l.qty, 0);

  return (
    <div className="screen">
      <h1>Inventario</h1>

      <div className="grid cols-3">
        {(['ambient', 'chilled', 'frozen'] as StorageType[]).map((st) => (
          <Card key={st} title={STORAGE_LABEL[st]}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span>
                {num(stock[st])} / {num(capacity[st])} unidades
              </span>
              <span className="dim">
                {capacity[st] > 0 ? Math.round((stock[st] / capacity[st]) * 100) : 0}%
              </span>
            </div>
            <Progress
              value={stock[st]}
              max={capacity[st]}
              tone={stock[st] / Math.max(capacity[st], 1) > 0.9 ? 'red' : undefined}
            />
            {capacity[st] === 0 && (
              <small style={{ color: 'var(--red)' }}>
                Sin equipamiento operativo para este tipo.
              </small>
            )}
          </Card>
        ))}
      </div>

      {expiringSoon.length > 0 && (
        <Card title="Caduca pronto (≤ 2 días)">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th className="num">Unidades</th>
                <th>Caduca</th>
              </tr>
            </thead>
            <tbody>
              {expiringSoon.map((l) => {
                const def = PRODUCTS.find((p) => p.id === l.productId)!;
                const expired = (l.expiresDay ?? 0) < day;
                return (
                  <tr key={l.id}>
                    <td>{def.name}</td>
                    <td className="num">{l.qty}</td>
                    <td>
                      <Badge tone={expired || l.expiresDay === day ? 'red' : 'yellow'}>
                        {formatDay(l.expiresDay ?? 0)}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <small className="dim">Considera bajar el precio para venderlo antes de perderlo.</small>
        </Card>
      )}

      <Card title={`Stock por producto (${num(totalUnits)} unidades en total)`}>
        <table className="table">
          <thead>
            <tr>
              <th>Producto</th>
              <th className="num">Stock</th>
              <th className="num">En camino</th>
              <th className="num">Mínimo</th>
              <th>Próxima caducidad</th>
              <th className="num">Valor a coste</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map((p) => {
              const ps = state.products[p.id];
              const stockQty = stockOf(state, p.id);
              const incoming = incomingQty(state, p.id);
              const lots = state.lots.filter((l) => l.productId === p.id && l.expiresDay !== null);
              const nextExpiry = lots.length ? Math.min(...lots.map((l) => l.expiresDay!)) : null;
              const low = ps.active && stockQty < ps.minStock;
              return (
                <tr key={p.id} style={{ opacity: ps.active ? 1 : 0.45 }}>
                  <td>{p.name}</td>
                  <td className="num">{stockQty}</td>
                  <td className="num dim">{incoming > 0 ? `+${incoming}` : '—'}</td>
                  <td className="num dim">{ps.minStock}</td>
                  <td className="dim">
                    {nextExpiry !== null ? formatDay(nextExpiry) : 'No caduca'}
                  </td>
                  <td className="num dim">{money(stockQty * p.baseCostCents)}</td>
                  <td>
                    {!ps.active ? (
                      <Badge>Retirado</Badge>
                    ) : stockQty === 0 ? (
                      <Badge tone="red">AGOTADO</Badge>
                    ) : low ? (
                      <Badge tone="yellow">Stock bajo</Badge>
                    ) : (
                      <Badge tone="green">OK</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
