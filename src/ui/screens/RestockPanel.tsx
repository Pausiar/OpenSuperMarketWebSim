import { useMemo, useState } from "react";
import { formatDay } from "../../core/time";
import { productDef } from "../../domain/data/products";
import { supplierDef } from "../../domain/data/suppliers";
import {
  placeRestock,
  planRepeatLast,
  planRestock,
  type RestockLine,
  type RestockPlan,
  type RestockResult,
} from "../../domain/restock";
import { Card } from "../components";
import { money } from "../format";
import { useGame } from "../useGame";
import "./restock.css";

function describeResult(res: RestockResult): string {
  const parts: string[] = [];
  if (res.placed.length > 0) {
    parts.push(
      `Pedido realizado a ${res.placed
        .map(
          (p) => `${supplierDef(p.supplierId).name} (${money(p.totalCents)})`,
        )
        .join(", ")}. Total: ${money(res.spentCents)}.`,
    );
  }
  for (const s of res.skipped) {
    const names = s.productIds.map((id) => productDef(id).name).join(", ");
    parts.push(
      `Sin pedir a ${supplierDef(s.supplierId).name}: ${names}. ${s.reason}`,
    );
  }
  return parts.join(" ") || "No había nada que pedir.";
}

export function RestockPanel() {
  const { state, run } = useGame();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );

  const base = planRestock(state);
  const overrides: Record<string, number> = { ...qty };
  for (const id of Object.keys(excluded)) if (excluded[id]) overrides[id] = 0;
  const plan = useMemo(
    () => planRestock(state, { qtyOverrides: overrides }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      qty,
      excluded,
      state.clock.timeMin,
      state.orders.length,
      state.ledger.balanceCents,
    ],
  );

  const baseLines: RestockLine[] = base.groups.flatMap((g) => g.lines);
  const effective = new Map<string, RestockLine>(
    plan.groups.flatMap((g) => g.lines).map((l) => [l.productId, l]),
  );
  const cash = state.ledger.balanceCents;
  const short = plan.totalCents > cash;
  const underMin = plan.groups.filter((g) => g.belowMinOrder);

  const submit = (p: RestockPlan) => {
    let res: RestockResult | null = null;
    run((ctx) => {
      res = placeRestock(ctx, p);
      return null;
    });
    const result = res as RestockResult | null;
    if (!result) return;
    setMessage({
      text: describeResult(result),
      ok: result.skipped.length === 0,
    });
    if (result.placed.length > 0) {
      setQty({});
      setExcluded({});
    }
  };

  const repeat = planRepeatLast(state);

  return (
    <Card
      title="Reposición rápida"
      actions={
        <div className="restock-actions">
          <button
            className="primary"
            disabled={plan.groups.length === 0}
            onClick={() => submit(plan)}
          >
            Pedir todo
          </button>
          <button
            disabled={repeat.groups.length === 0}
            onClick={() => submit(repeat)}
          >
            Repetir último pedido
          </button>
        </div>
      }
    >
      <div className="restock-live" role="status" aria-live="polite">
        {message && (
          <p
            className={message.ok ? "restock-msg is-ok" : "restock-msg is-warn"}
          >
            {message.text}
          </p>
        )}
      </div>

      {baseLines.length === 0 && base.blocked.length === 0 ? (
        <p className="dim">Todo el stock está por encima del mínimo.</p>
      ) : (
        <>
          <div className="restock-scroll">
            <table className="table restock-table">
              <thead>
                <tr>
                  <th>Pedir</th>
                  <th>Producto</th>
                  <th className="num">Stock</th>
                  <th>Cantidad</th>
                  <th>Proveedor</th>
                  <th className="num">Precio/ud</th>
                  <th className="num">Total</th>
                </tr>
              </thead>
              <tbody>
                {baseLines.map((b) => {
                  const line = effective.get(b.productId);
                  const off = !line;
                  const shown = line ?? b;
                  const q = off ? (qty[b.productId] ?? b.qty) : shown.qty;
                  const name = productDef(b.productId).name;
                  return (
                    <tr
                      key={b.productId}
                      className={off ? "is-dim" : undefined}
                    >
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Incluir ${name}`}
                          checked={!off}
                          onChange={(e) =>
                            setExcluded({
                              ...excluded,
                              [b.productId]: !e.target.checked,
                            })
                          }
                        />
                      </td>
                      <td>{name}</td>
                      <td className="num dim">
                        {b.stock}
                        {b.incoming > 0 ? ` (+${b.incoming})` : ""} /{" "}
                        {b.minStock}
                      </td>
                      <td>
                        <div className="restock-qty">
                          <button
                            className="small"
                            aria-label={`Menos ${name}`}
                            disabled={off || q <= 1}
                            onClick={() =>
                              setQty({
                                ...qty,
                                [b.productId]: Math.max(1, q - 1),
                              })
                            }
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            aria-label={`Cantidad de ${name}`}
                            value={q}
                            disabled={off}
                            onChange={(e) =>
                              setQty({
                                ...qty,
                                [b.productId]: Math.max(
                                  1,
                                  parseInt(e.target.value) || 1,
                                ),
                              })
                            }
                          />
                          <button
                            className="small"
                            aria-label={`Más ${name}`}
                            disabled={off}
                            onClick={() =>
                              setQty({ ...qty, [b.productId]: q + 1 })
                            }
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{supplierDef(shown.supplierId).name}</td>
                      <td className="num">{money(shown.unitCents)}</td>
                      <td className="num">
                        {off ? "—" : money(shown.lineCents)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {base.blocked.length > 0 && (
            <ul className="restock-blocked">
              {base.blocked.map((b) => (
                <li key={b.productId} className="t-warn">
                  {productDef(b.productId).name}: {b.reason}
                </li>
              ))}
            </ul>
          )}

          <div className="restock-groups">
            {plan.groups.map((g) => (
              <div key={g.supplierId} className="restock-group">
                <strong>{supplierDef(g.supplierId).name}</strong>
                <span className="dim">Llega el {formatDay(g.etaDay)}</span>
                <span className="num">{money(g.subtotalCents)}</span>
                {g.belowMinOrder && (
                  <span className="t-warn">
                    Mínimo {money(supplierDef(g.supplierId).minOrderCents)}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="restock-total">
            <span>
              Total <strong className="num">{money(plan.totalCents)}</strong>
            </span>
            <span className={short ? "t-warn" : "dim"}>
              Caja disponible <span className="num">{money(cash)}</span>
            </span>
          </div>
          {short && (
            <p className="t-warn">
              No hay caja para todo: se pedirá primero lo más urgente y el resto
              quedará sin pedir.
            </p>
          )}
          {underMin.length > 0 && (
            <p className="t-warn">
              Algún proveedor no alcanza su pedido mínimo; ese pedido no se
              hará.
            </p>
          )}
        </>
      )}
    </Card>
  );
}
