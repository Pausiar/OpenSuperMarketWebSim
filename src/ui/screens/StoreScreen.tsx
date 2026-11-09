import { useEffect, useRef, useState } from "react";
import { dayOf } from "../../core/time";
import {
  EQUIPMENT,
  EQUIPMENT_MAP,
  REPAIR_COST_FACTOR,
  type EquipmentType,
} from "../../domain/data/equipment";
import { levelDef, STORE_LEVELS } from "../../domain/data/levels";
import { CAMPAIGNS, CAMPAIGN_MAP } from "../../domain/data/marketing";
import {
  doorTiles,
  footprint,
  layoutEffects,
  placeEquipment,
  STORAGE_ZONE,
} from "../../domain/map";
import {
  buyEquipment,
  equipmentCount,
  repairEquipment,
  sellEquipment,
  startCampaign,
  upgradeStore,
} from "../../domain/storeOps";
import { Badge, Card, ErrorBox, Stat } from "../components";
import { money, pct } from "../format";
import { StoreCanvas } from "../storeview/StoreCanvas";
import { useGame } from "../useGame";
import {
  canMoveTo,
  clampedTarget,
  clampOffset,
  footprintOf,
  pointerToTile,
  toggleRot,
  type Rot,
  type Tile,
} from "./mapDrag";

type MapView = "live" | "edit";

const TYPE_LABEL: Record<EquipmentType, string> = {
  shelf: "EST",
  fridge: "NEV",
  freezer: "CONG",
  checkout: "CAJA",
};

export function StoreScreen() {
  const { state, run } = useGame();
  const [error, setError] = useState<string | null>(null);
  const [mapView, setMapView] = useState<MapView>("live");
  const level = levelDef(state.store.level);
  const next =
    state.store.level < STORE_LEVELS.length
      ? STORE_LEVELS[state.store.level]
      : null;
  const today = dayOf(state.clock.timeMin);
  const effects = layoutEffects(state);

  return (
    <div className="screen">
      <h1>Tienda</h1>
      <ErrorBox message={error} />

      <div className="grid cols-2">
        <Card title={`Nivel ${state.store.level}: ${level.name}`}>
          <p className="dim">
            Tráfico base: {level.baseTraffic} clientes/hora punta. Alquiler:{" "}
            {money(level.rentCents)}/mes. Sala: {level.grid.w}×{level.grid.h}
          </p>
          {level.upgrade && next && (
            <div className="stack">
              <p>
                <strong>Siguiente: {next.name}</strong> —{" "}
                {money(level.upgrade.costCents)} y reputación ≥{" "}
                {level.upgrade.minReputation} (tienes{" "}
                {Math.round(state.store.reputation)}).
              </p>
              <p className="dim t-small">
                Desbloquea: sala {next.grid.w}×{next.grid.h}, hasta{" "}
                {next.maxEquipment.shelf} estanterías,{" "}
                {next.maxEquipment.fridge} neveras, {next.maxEquipment.freezer}{" "}
                congeladores y {next.maxEquipment.checkout} cajas. Más tráfico
                de clientes.
              </p>
              <button
                className="primary"
                disabled={
                  state.ledger.balanceCents < level.upgrade.costCents ||
                  state.store.reputation < level.upgrade.minReputation
                }
                onClick={() => setError(run(upgradeStore))}
              >
                Ampliar por {money(level.upgrade.costCents)}
              </button>
            </div>
          )}
          {!level.upgrade && <Badge tone="green">Nivel máximo alcanzado</Badge>}
        </Card>

        <Card title="Marketing">
          {state.store.campaigns
            .filter((c) => c.endsDay >= today)
            .map((c) => (
              <p key={c.id}>
                <Badge tone="blue">{CAMPAIGN_MAP[c.campaignId]?.name}</Badge>{" "}
                <span className="dim">activa hasta el día {c.endsDay + 1}</span>
              </p>
            ))}
          {CAMPAIGNS.map((c) => (
            <div key={c.id} className="list-row">
              <div>
                <strong>{c.name}</strong>
                <div className="dim t-small">
                  {money(c.costCents)} · {c.durationDays} días · +
                  {Math.round((c.trafficBoost - 1) * 100)}% clientes
                </div>
              </div>
              <button
                className="small"
                onClick={() => setError(run((ctx) => startCampaign(ctx, c.id)))}
              >
                Lanzar
              </button>
            </div>
          ))}
        </Card>
      </div>

      <Card title="Equipamiento">
        <div className="grid cols-4">
          {EQUIPMENT.map((def) => {
            const count = equipmentCount(state, def.id);
            const max = level.maxEquipment[def.id];
            return (
              <div key={def.id} className="stat">
                <div className="stat-label">{def.name}</div>
                <div className="stat-value">
                  {count} / {max}
                </div>
                <div className="stat-sub">
                  {money(def.priceCents)}
                  {def.storage ? ` · ${def.capacity} uds` : ""}
                  {def.kwhPerDay > 0 ? ` · ${def.kwhPerDay} kWh/día` : ""}
                </div>
                <button
                  className="small primary"

                  disabled={
                    count >= max || state.ledger.balanceCents < def.priceCents
                  }
                  onClick={() =>
                    setError(run((ctx) => buyEquipment(ctx, def.id)))
                  }
                >
                  Comprar
                </button>
              </div>
            );
          })}
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Unidad</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {state.store.equipment.map((eq) => {
              const def = EQUIPMENT_MAP[eq.type];
              return (
                <tr key={eq.id}>
                  <td className="dim">{eq.id}</td>
                  <td>{def.name}</td>
                  <td>
                    {eq.broken ? (
                      <Badge tone="red">AVERIADO</Badge>
                    ) : (
                      <Badge tone="green">Operativo</Badge>
                    )}
                  </td>
                  <td className="cell-actions">
                    {eq.broken && (
                      <button
                        className="small primary"
                        onClick={() =>
                          setError(run((ctx) => repairEquipment(ctx, eq.id)))
                        }
                      >
                        Reparar (
                        {money(Math.round(def.priceCents * REPAIR_COST_FACTOR))}
                        )
                      </button>
                    )}
                    <button
                      className="small danger"
                      onClick={() =>
                        setError(run((ctx) => sellEquipment(ctx, eq.id)))
                      }
                    >
                      Vender ({money(Math.round(def.priceCents * 0.4))})
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card
        title="Distribución de la sala (mapa)"
        actions={
          <div className="row">
            <button
              className={`small ${mapView === "live" ? "primary" : ""}`}
              aria-pressed={mapView === "live"}
              onClick={() => setMapView("live")}
            >
              Vista en vivo
            </button>
            <button
              className={`small ${mapView === "edit" ? "primary" : ""}`}
              aria-pressed={mapView === "edit"}
              onClick={() => setMapView("edit")}
            >
              Editar
            </button>
          </div>
        }
      >
        <div className="grid cols-3">
          <Stat
            label="Eficiencia de reposición"
            value={pct(effects.restockFactor * 100)}
            sub="distancia del almacén a las estanterías"
            tone={effects.restockFactor < 0.95 ? "warn" : "good"}
          />
          <Stat
            label="Eficiencia de cajas"
            value={pct(effects.queueFactor * 100)}
            sub="distancia de la puerta a las cajas"
            tone={effects.queueFactor < 0.95 ? "warn" : "good"}
          />
          <Stat
            label="Circulación"
            value={pct(effects.circulationFactor * 100)}
            sub="espacio libre para los clientes"
            tone={effects.circulationFactor < 1 ? "warn" : "good"}
          />
        </div>
        {mapView === "live" ? (
          <StoreCanvas
            map={state.map}
            equipment={state.store.equipment}
            live={state.live}
            blackout={state.flags.blackout}
            speed={state.clock.speed}
            hour={(state.clock.timeMin / 60) % 24}
          />
        ) : (
          <MapEditor onError={setError} />
        )}
      </Card>
    </div>
  );
}

interface DragState {
  id: string;
  type: EquipmentType;
  rot: Rot;
  offset: Tile;
  target: Tile;
  valid: boolean;
  startX: number;
  startY: number;
  moved: boolean;
  wasSelected: boolean;
}

function MapEditor(props: { onError: (e: string | null) => void }) {
  const { state, run } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [note, setNote] = useState("");
  const dragRef = useRef<DragState | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const TILE = 30;
  const map = state.map;
  const door = doorTiles(map);

  const selectedPlacement =
    map.placements.find((p) => p.equipmentId === selectedId) ?? null;
  const selectedEq = state.store.equipment.find((e) => e.id === selectedId);

  const tileClass = (x: number, y: number): string => {
    if (door.some((d) => d.x === x && d.y === y)) return "door";
    if (x === 0 || y === 0 || x === map.w - 1 || y === map.h - 1) return "wall";
    if (
      x >= STORAGE_ZONE.x &&
      x < STORAGE_ZONE.x + STORAGE_ZONE.w &&
      y >= STORAGE_ZONE.y &&
      y < STORAGE_ZONE.y + STORAGE_ZONE.h
    )
      return "storage";
    return "floor";
  };

  const setDragBoth = (d: DragState | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  /** Intenta colocar mediante el comando habitual y anuncia el resultado. */
  const commit = (id: string, x: number, y: number, rot: Rot) => {
    const err = run((ctx) => placeEquipment(ctx.state, id, x, y, rot));
    props.onError(err);
    setNote(err ?? `Pieza colocada en columna ${x + 1}, fila ${y + 1}.`);
    return err === null;
  };

  const onTileClick = (x: number, y: number) => {
    if (!selectedId || !selectedPlacement) return;
    commit(selectedId, x, y, selectedPlacement.rot);
  };

  const rotate = () => {
    if (!selectedId || !selectedPlacement) return;
    const { x, y, rot } = selectedPlacement;
    commit(selectedId, x, y, toggleRot(rot));
  };

  const evaluate = (d: DragState, pointer: Tile, rot: Rot): DragState => {
    const fp = footprintOf(d.type, rot);
    const offset = clampOffset(d.offset, fp);
    const target = clampedTarget(pointer, offset, fp, map);
    return {
      ...d,
      rot,
      offset,
      target,
      valid: canMoveTo(state, d.id, target.x, target.y, rot),
    };
  };

  const pointerTile = (e: { clientX: number; clientY: number }): Tile => {
    const r = gridRef.current!.getBoundingClientRect();
    return pointerToTile(e.clientX, e.clientY, r, TILE);
  };

  const onPiecePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    p: { equipmentId: string; x: number; y: number; rot: Rot },
    type: EquipmentType,
  ) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = pointerTile(e);
    const base: DragState = {
      id: p.equipmentId,
      type,
      rot: p.rot,
      offset: { x: pt.x - p.x, y: pt.y - p.y },
      target: { x: p.x, y: p.y },
      valid: true,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      wasSelected: p.equipmentId === selectedId,
    };
    setDragBoth(base);
    setSelectedId(p.equipmentId);
  };

  const onPiecePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const moved =
      d.moved || Math.hypot(e.clientX - d.startX, e.clientY - d.startY) > 4;
    if (!moved) return;
    setDragBoth({ ...evaluate(d, pointerTile(e), d.rot), moved: true });
  };

  const onPiecePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setDragBoth(null);
    if (!d.moved) {
      if (d.wasSelected) setSelectedId(null);
      return;
    }
    const cur = evaluate(d, pointerTile(e), d.rot);
    if (cur.valid) commit(cur.id, cur.target.x, cur.target.y, cur.rot);
    else {
      const msg = "No se puede colocar ahí. La pieza vuelve a su sitio.";
      props.onError(msg);
      setNote(msg);
    }
  };

  const cancelDrag = () => {
    if (!dragRef.current) return;
    setDragBoth(null);
    setNote("Movimiento cancelado.");
  };

  // Teclas durante el arrastre: R rota, Escape cancela.
  useEffect(() => {
    if (!drag) return;
    const onKey = (e: KeyboardEvent) => {
      const d = dragRef.current;
      if (!d) return;
      if (e.key === "Escape") {
        e.preventDefault();
        cancelDrag();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        const anchor: Tile = {
          x: d.target.x + d.offset.x,
          y: d.target.y + d.offset.y,
        };
        setDragBoth({ ...evaluate(d, anchor, toggleRot(d.rot)), moved: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null]);

  const onPieceKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    p: { equipmentId: string; x: number; y: number; rot: Rot },
  ) => {
    const isSel = p.equipmentId === selectedId;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedId(isSel ? null : p.equipmentId);
      return;
    }
    if (!isSel) return;
    const delta: Record<string, Tile> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
    };
    if (delta[e.key]) {
      e.preventDefault();
      commit(p.equipmentId, p.x + delta[e.key].x, p.y + delta[e.key].y, p.rot);
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      commit(p.equipmentId, p.x, p.y, toggleRot(p.rot));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSelectedId(null);
      setNote("Pieza deseleccionada.");
    }
  };

  const ghostFp = drag ? footprintOf(drag.type, drag.rot) : null;

  return (
    <>
      <div className="row">
        {selectedEq ? (
          <>
            <Badge tone="blue">
              Seleccionado: {EQUIPMENT_MAP[selectedEq.type].name}
            </Badge>
            <span className="dim">
              Arrástralo o haz clic en una casilla libre. Teclado: flechas
              mueven, R rota, Esc deselecciona.
            </span>
            <button className="small" onClick={rotate}>
              Rotar
            </button>
            <button className="small" onClick={() => setSelectedId(null)}>
              Cancelar
            </button>
          </>
        ) : (
          <span className="dim">
            Arrastra una pieza para moverla, o selecciónala con clic o
            teclado.
          </span>
        )}
      </div>
      <div className="sr-only" role="status" aria-live="polite">
        {note}
      </div>

      <div className="map-wrap">
        <div
          ref={gridRef}
          className="map-grid"
          style={{ width: map.w * TILE, height: map.h * TILE }}
        >
          {Array.from({ length: map.h }, (_, y) =>
            Array.from({ length: map.w }, (_, x) => (
              <div
                key={`${x}-${y}`}
                className={`map-tile ${tileClass(x, y)}`}
                style={{
                  left: x * TILE,
                  top: y * TILE,
                  width: TILE,
                  height: TILE,
                }}
                onClick={() => onTileClick(x, y)}
              />
            )),
          )}
          {map.placements.map((p) => {
            const eq = state.store.equipment.find(
              (e) => e.id === p.equipmentId,
            );
            if (!eq) return null;
            const fp = footprint(eq.type, p.rot);
            const dragging = drag?.moved && drag.id === p.equipmentId;
            return (
              <div
                key={p.equipmentId}
                role="button"
                tabIndex={0}
                aria-pressed={p.equipmentId === selectedId}
                aria-label={`${EQUIPMENT_MAP[eq.type].name} en columna ${p.x + 1}, fila ${p.y + 1}`}
                className={`map-obj ${eq.type} ${p.equipmentId === selectedId ? "selected" : ""} ${eq.broken ? "broken" : ""} ${dragging ? "dragging" : ""}`}
                style={{
                  left: p.x * TILE + 2,
                  top: p.y * TILE + 2,
                  width: fp.w * TILE - 4,
                  height: fp.h * TILE - 4,
                }}
                onPointerDown={(e) => onPiecePointerDown(e, p, eq.type)}
                onPointerMove={onPiecePointerMove}
                onPointerUp={onPiecePointerUp}
                onPointerCancel={cancelDrag}
                onKeyDown={(e) => onPieceKeyDown(e, p)}
                title={EQUIPMENT_MAP[eq.type].name}
              >
                {TYPE_LABEL[eq.type]}
              </div>
            );
          })}
          {drag?.moved && ghostFp && (
            <div
              aria-hidden="true"
              data-testid="map-ghost"
              className={`map-obj map-ghost ${drag.type} ${drag.valid ? "ok" : "bad"}`}
              style={{
                left: drag.target.x * TILE + 2,
                top: drag.target.y * TILE + 2,
                width: ghostFp.w * TILE - 4,
                height: ghostFp.h * TILE - 4,
              }}
            >
              {TYPE_LABEL[drag.type]}
            </div>
          )}
        </div>
      </div>

      <div className="map-legend">
        <span>
          <span className="chip chip-door" /> Puerta
        </span>
        <span>
          <span className="chip chip-storage" /> Almacén
        </span>
        <span>
          <span className="chip chip-shelf" /> Estantería
        </span>
        <span>
          <span className="chip chip-fridge" /> Nevera
        </span>
        <span>
          <span className="chip chip-freezer" /> Congelador
        </span>
        <span>
          <span className="chip chip-checkout" /> Caja
        </span>
      </div>
      <small className="dim">
        La distribución importa: estanterías cerca del almacén reponen mejor,
        cajas cerca de la puerta gestionan mejor las colas y una sala despejada
        mejora la satisfacción.
      </small>
    </>
  );
}
