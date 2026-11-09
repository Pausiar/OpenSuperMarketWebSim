import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
import {
  BROKEN_OVERLAY,
  CHECKOUT_SCREEN,
  drawSprite,
  spriteFor,
  tileSprite,
  TILE as TILE_SRC,
} from "../storeview/pixel";
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

/** Escala entera del editor: llena el ancho disponible, entre 2x y 4x. */
const MIN_SCALE = 2;
const MAX_SCALE = 4;

function getCtx(c: HTMLCanvasElement | null): CanvasRenderingContext2D | null {
  try {
    return c?.getContext("2d") ?? null;
  } catch {
    return null;
  }
}

/** Terreno estático: suelo, paredes y puerta con los sprites de la vista en vivo. */
function TerrainCanvas(props: {
  w: number;
  h: number;
  scale: number;
  isDoor: (x: number, y: number) => boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { w, h, scale, isDoor } = props;
  const tile = TILE_SRC * scale;
  useEffect(() => {
    const ctx = getCtx(ref.current);
    if (!ctx) return;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let key: string;
        let rows;
        if (isDoor(x, y)) {
          key = "door";
          rows = tileSprite("door");
        } else if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
          const corner = (x === 0 || x === w - 1) && (y === 0 || y === h - 1);
          key = corner ? "wallCorner" : "wall";
          rows = tileSprite(corner ? "wallCorner" : "wall");
        } else {
          const v = (x * 3 + y * 5) % 2;
          key = `floor${v}`;
          rows = tileSprite("floor", v);
        }
        drawSprite(ctx, `t:${key}`, rows, x * tile, y * tile, scale);
      }
  }, [w, h, isDoor, scale, tile]);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="map-canvas"
      width={w * tile}
      height={h * tile}
    />
  );
}

/** Pieza dibujada con su sprite en cada casilla de la huella (como en la vista en vivo). */
function PieceCanvas(props: {
  type: EquipmentType;
  equipmentId: string;
  fp: { w: number; h: number };
  broken: boolean;
  scale: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { type, equipmentId, fp, broken, scale } = props;
  const tile = TILE_SRC * scale;
  useEffect(() => {
    const ctx = getCtx(ref.current);
    if (!ctx) return;
    const rows = spriteFor(type, equipmentId);
    for (let i = 0; i < fp.w; i++)
      for (let j = 0; j < fp.h; j++) {
        const x = i * tile;
        const y = j * tile;
        drawSprite(ctx, `e:${type}:${equipmentId}`, rows, x, y, scale);
        if (type === "checkout" && i === 0 && j === 0 && !broken)
          drawSprite(ctx, "e:screen", CHECKOUT_SCREEN, x, y, scale);
        if (broken)
          drawSprite(ctx, "e:broken0", BROKEN_OVERLAY[0], x, y, scale);
      }
  }, [type, equipmentId, fp.w, fp.h, broken, scale, tile]);
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="map-canvas"
      width={fp.w * tile}
      height={fp.h * tile}
    />
  );
}

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const map = state.map;
  const door = doorTiles(map);
  const [scale, setScale] = useState(MIN_SCALE);
  const TILE = TILE_SRC * scale;

  // Escala entera según el ancho del contenedor; si no cabe, el mapa hace scroll dentro.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const fit = Math.floor(el.clientWidth / (map.w * TILE_SRC));
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, fit)));
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [map.w]);

  const selectedPlacement =
    map.placements.find((p) => p.equipmentId === selectedId) ?? null;
  const selectedEq = state.store.equipment.find((e) => e.id === selectedId);

  const isDoor = useCallback(
    (x: number, y: number) =>
      y === map.h - 1 &&
      (x === Math.floor(map.w / 2) - 1 || x === Math.floor(map.w / 2)),
    [map.w, map.h],
  );
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
    const g = gridRef.current!;
    const r = g.getBoundingClientRect();
    return pointerToTile(
      e.clientX,
      e.clientY,
      { left: r.left + g.clientLeft, top: r.top + g.clientTop },
      TILE,
    );
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

      <div className="map-wrap" ref={wrapRef}>
        <div
          ref={gridRef}
          className="map-grid"
          style={{ width: map.w * TILE, height: map.h * TILE }}
        >
          <TerrainCanvas
            w={map.w}
            h={map.h}
            scale={scale}
            isDoor={isDoor}
          />
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
                  left: p.x * TILE,
                  top: p.y * TILE,
                  width: fp.w * TILE,
                  height: fp.h * TILE,
                }}
                onPointerDown={(e) => onPiecePointerDown(e, p, eq.type)}
                onPointerMove={onPiecePointerMove}
                onPointerUp={onPiecePointerUp}
                onPointerCancel={cancelDrag}
                onKeyDown={(e) => onPieceKeyDown(e, p)}
                title={EQUIPMENT_MAP[eq.type].name}
              >
                <PieceCanvas
                  type={eq.type}
                  equipmentId={eq.id}
                  fp={fp}
                  broken={eq.broken}
                  scale={scale}
                />
              </div>
            );
          })}
          {drag?.moved && ghostFp && (
            <div
              aria-hidden="true"
              data-testid="map-ghost"
              className={`map-obj map-ghost ${drag.type} ${drag.valid ? "ok" : "bad"}`}
              style={{
                left: drag.target.x * TILE,
                top: drag.target.y * TILE,
                width: ghostFp.w * TILE,
                height: ghostFp.h * TILE,
              }}
            >
              <PieceCanvas
                type={drag.type}
                equipmentId={drag.id}
                fp={ghostFp}
                broken={false}
                scale={scale}
              />
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
