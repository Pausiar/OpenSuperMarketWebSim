import { useState } from 'react';
import { CATEGORY_NAMES, PRODUCTS, type ProductCategory } from '../../domain/data/products';
import { setMinStock, setSellingPrice, stockOf, toggleProductActive } from '../../domain/inventory';
import { Badge, Card, ErrorBox } from '../components';
import { marginPct, money, pct } from '../format';
import { useGame } from '../useGame';

const STORAGE_LABEL = { ambient: 'Ambiente', chilled: 'Refrigerado', frozen: 'Congelado' } as const;

export function ProductsScreen() {
  const { state, run } = useGame();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ProductCategory | 'all'>('all');

  const products = PRODUCTS.filter((p) => category === 'all' || p.category === category);

  return (
    <div className="screen">
      <h1>Productos</h1>
      <ErrorBox message={error} />
      <Card
        title={`Catálogo (${products.length})`}
        actions={
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory | 'all')}
          >
            <option value="all">Todas las categorías</option>
            {Object.entries(CATEGORY_NAMES).map(([id, name]) => (
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
              <th>Producto</th>
              <th>Categoría</th>
              <th>Conservación</th>
              <th className="num">Coste base</th>
              <th className="num">Precio venta</th>
              <th className="num">Margen</th>
              <th className="num">Stock</th>
              <th className="num">Stock mín.</th>
              <th>En venta</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const ps = state.products[p.id];
              const stock = stockOf(state, p.id);
              const margin = marginPct(p.baseCostCents, ps.sellingPriceCents);
              const overpriced = ps.sellingPriceCents > p.baseSellCents * 1.25;
              return (
                <tr key={p.id} style={{ opacity: ps.active ? 1 : 0.5 }}>
                  <td>
                    <strong>{p.name}</strong>
                  </td>
                  <td className="dim">{CATEGORY_NAMES[p.category]}</td>
                  <td>
                    <Badge
                      tone={
                        p.storage === 'chilled'
                          ? 'blue'
                          : p.storage === 'frozen'
                            ? 'blue'
                            : undefined
                      }
                    >
                      {STORAGE_LABEL[p.storage]}
                    </Badge>
                  </td>
                  <td className="num dim">{money(p.baseCostCents)}</td>
                  <td className="num">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={(ps.sellingPriceCents / 100).toFixed(2)}
                      onChange={(e) =>
                        setError(
                          run((ctx) =>
                            setSellingPrice(
                              ctx,
                              p.id,
                              Math.round(parseFloat(e.target.value) * 100),
                            ),
                          ),
                        )
                      }
                    />
                  </td>
                  <td
                    className="num"
                    style={{
                      color: margin < 10 ? 'var(--red)' : margin > 35 ? 'var(--green)' : undefined,
                    }}
                  >
                    {pct(margin, 1)}
                    {overpriced && (
                      <div style={{ fontSize: 10, color: 'var(--yellow)' }}>
                        caro: venderá menos
                      </div>
                    )}
                  </td>
                  <td
                    className="num"
                    style={{ color: stock < ps.minStock ? 'var(--red)' : undefined }}
                  >
                    {stock}
                  </td>
                  <td className="num">
                    <input
                      type="number"
                      min="0"
                      value={ps.minStock}
                      onChange={(e) =>
                        setError(
                          run((ctx) => setMinStock(ctx, p.id, parseInt(e.target.value) || 0)),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={ps.active}
                      onChange={() => setError(run((ctx) => toggleProductActive(ctx, p.id)))}
                    />
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
