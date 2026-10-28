import { useState } from 'react';
import { dayOf } from '../../core/time';
import {
  EQUIPMENT,
  EQUIPMENT_MAP,
  REPAIR_COST_FACTOR,
  type EquipmentType,
} from '../../domain/data/equipment';
import { levelDef, STORE_LEVELS } from '../../domain/data/levels';
import { CAMPAIGNS, CAMPAIGN_MAP } from '../../domain/data/marketing';
import {
  doorTiles,
  footprint,
  layoutEffects,
  placeEquipment,
  STORAGE_ZONE,
} from '../../domain/map';
import {
  buyEquipment,
  equipmentCount,
  repairEquipment,
  sellEquipment,
  startCampaign,
  upgradeStore,
} from '../../domain/storeOps';
import { Badge, Card, ErrorBox, Stat } from '../components';
import { money, pct } from '../format';
import { useGame } from '../useGame';

const TYPE_LABEL: Record<EquipmentType, string> = {
  shelf: 'EST',
  fridge: 'NEV',
  freezer: 'CONG',
  checkout: 'CAJA',
};

export function StoreScreen() {
  const { state, run } = useGame();
  const [error, setError] = useState<string | null>(null);
  const level = levelDef(state.store.level);
  const next = state.store.level < STORE_LEVELS.length ? STORE_LEVELS[state.store.level] : null;
  const today = dayOf(state.clock.timeMin);
  const effects = layoutEffects(state);

  return (
    <div className="screen">
      <h1>Tienda</h1>
      <ErrorBox message={error} />

      <div className="grid cols-2">
        <Card title={`Nivel ${state.store.level}: ${level.name}`}>
          <p className="dim">
            Tráfico base: {level.baseTraffic} clientes/hora punta · Alquiler:{' '}
            {money(level.rentCents)}/mes · Sala: {level.grid.w}×{level.grid.h}
          </p>
          {level.upgrade && next && (
            <div style={{ marginTop: 10 }}>
              <p>
                <strong>Siguiente: {next.name}</strong> — {money(level.upgrade.costCents)} y
                reputación ≥ {level.upgrade.minReputation} (tienes{' '}
                {Math.round(state.store.reputation)}).
              </p>
              <p className="dim" style={{ fontSize: 12.5 }}>
                Desbloquea: sala {next.grid.w}×{next.grid.h}, hasta {next.maxEquipment.shelf}{' '}
                estanterías, {next.maxEquipment.fridge} neveras, {next.maxEquipment.freezer}{' '}
                congeladores y {next.maxEquipment.checkout} cajas. Más tráfico de clientes.
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
                <Badge tone="blue">{CAMPAIGN_MAP[c.campaignId]?.name}</Badge>{' '}
                <span className="dim">activa hasta el día {c.endsDay + 1}</span>
              </p>
            ))}
          {CAMPAIGNS.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '5px 0',
              }}
            >
              <div>
                <strong>{c.name}</strong>
                <div className="dim" style={{ fontSize: 12 }}>
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
                  {def.storage ? ` · ${def.capacity} uds` : ''}
                  {def.kwhPerDay > 0 ? ` · ${def.kwhPerDay} kWh/día` : ''}
                </div>
                <button
                  className="small primary"
                  style={{ marginTop: 6 }}
                  disabled={count >= max || state.ledger.balanceCents < def.priceCents}
                  onClick={() => setError(run((ctx) => buyEquipment(ctx, def.id)))}
                >
                  Comprar
                </button>
              </div>
            );
          })}
        </div>

        <table className="table" style={{ marginTop: 14 }}>
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
                  <td style={{ display: 'flex', gap: 6 }}>
                    {eq.broken && (
                      <button
                        className="small primary"
                        onClick={() => setError(run((ctx) => repairEquipment(ctx, eq.id)))}
                      >
                        Reparar ({money(Math.round(def.priceCents * REPAIR_COST_FACTOR))})
                      </button>
                    )}
                    <button
                      className="small danger"
                      onClick={() => setError(run((ctx) => sellEquipment(ctx, eq.id)))}
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

      <Card title="Distribución de la sala (mapa)">
        <div className="grid cols-3" style={{ marginBottom: 12 }}>
          <Stat
            label="Eficiencia de reposición"
            value={pct(effects.restockFactor * 100)}
            sub="distancia del almacén a las estanterías"
            tone={effects.restockFactor < 0.95 ? 'warn' : 'good'}
          />
          <Stat
            label="Eficiencia de cajas"
            value={pct(effects.queueFactor * 100)}
            sub="distancia de la puerta a las cajas"
            tone={effects.queueFactor < 0.95 ? 'warn' : 'good'}
          />
          <Stat
            label="Circulación"
            value={pct(effects.circulationFactor * 100)}
            sub="espacio libre para los clientes"
            tone={effects.circulationFactor < 1 ? 'warn' : 'good'}
          />
        </div>
        <MapEditor onError={setError} />
      </Card>
    </div>
  );
}

function MapEditor(props: { onError: (e: string | null) => void }) {
  const { state, run } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const TILE = 30;
  const map = state.map;
  const door = doorTiles(map);

  const selectedPlacement = map.placements.find((p) => p.equipmentId === selectedId) ?? null;

  const tileClass = (x: number, y: number): string => {
    if (door.some((d) => d.x === x && d.y === y)) return 'door';
    if (x === 0 || y === 0 || x === map.w - 1 || y === map.h - 1) return 'wall';
    if (
      x >= STORAGE_ZONE.x &&
      x < STORAGE_ZONE.x + STORAGE_ZONE.w &&
      y >= STORAGE_ZONE.y &&
      y < STORAGE_ZONE.y + STORAGE_ZONE.h
    )
      return 'storage';
    return 'floor';
  };

  const onTileClick = (x: number, y: number) => {
    if (!selectedId || !selectedPlacement) return;
    props.onError(run((ctx) => placeEquipment(ctx.state, selectedId, x, y, selectedPlacement.rot)));
  };

  const rotate = () => {
    if (!selectedId || !selectedPlacement) return;
    const { x, y, rot } = selectedPlacement;
    props.onError(run((ctx) => placeEquipment(ctx.state, selectedId, x, y, rot === 0 ? 1 : 0)));
  };

  return (
    <>
      <div
        style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}
      >
        {selectedId ? (
          <>
            <Badge tone="blue">
              Seleccionado:{' '}
              {EQUIPMENT_MAP[state.store.equipment.find((e) => e.id === selectedId)!.type].name}
            </Badge>
            <span className="dim">Haz clic en una casilla libre para moverlo.</span>
            <button className="small" onClick={rotate}>
              Rotar
            </button>
            <button className="small" onClick={() => setSelectedId(null)}>
              Cancelar
            </button>
          </>
        ) : (
          <span className="dim">Haz clic en un objeto para seleccionarlo y moverlo o rotarlo.</span>
        )}
      </div>

      <div className="map-wrap">
        <div className="map-grid" style={{ width: map.w * TILE, height: map.h * TILE }}>
          {Array.from({ length: map.h }, (_, y) =>
            Array.from({ length: map.w }, (_, x) => (
              <div
                key={`${x}-${y}`}
                className={`map-tile ${tileClass(x, y)}`}
                style={{ left: x * TILE, top: y * TILE, width: TILE, height: TILE }}
                onClick={() => onTileClick(x, y)}
              />
            )),
          )}
          {map.placements.map((p) => {
            const eq = state.store.equipment.find((e) => e.id === p.equipmentId);
            if (!eq) return null;
            const fp = footprint(eq.type, p.rot);
            return (
              <div
                key={p.equipmentId}
                className={`map-obj ${eq.type} ${p.equipmentId === selectedId ? 'selected' : ''} ${eq.broken ? 'broken' : ''}`}
                style={{
                  left: p.x * TILE + 2,
                  top: p.y * TILE + 2,
                  width: fp.w * TILE - 4,
                  height: fp.h * TILE - 4,
                }}
                onClick={() => setSelectedId(p.equipmentId === selectedId ? null : p.equipmentId)}
                title={EQUIPMENT_MAP[eq.type].name}
              >
                {TYPE_LABEL[eq.type]}
              </div>
            );
          })}
        </div>
      </div>

      <div className="map-legend">
        <span>
          <span
            className="chip"
            style={{ background: '#3ecf8e33', border: '1px solid var(--green)' }}
          />{' '}
          Puerta
        </span>
        <span>
          <span
            className="chip"
            style={{ background: '#4f8cff22', border: '1px solid #4f8cff55' }}
          />{' '}
          Almacén
        </span>
        <span>
          <span className="chip" style={{ background: '#8a6d3b' }} /> Estantería
        </span>
        <span>
          <span className="chip" style={{ background: '#2b6cb0' }} /> Nevera
        </span>
        <span>
          <span className="chip" style={{ background: '#4c51bf' }} /> Congelador
        </span>
        <span>
          <span className="chip" style={{ background: '#2f855a' }} /> Caja
        </span>
      </div>
      <small className="dim">
        La distribución importa: estanterías cerca del almacén reponen mejor, cajas cerca de la
        puerta gestionan mejor las colas y una sala despejada mejora la satisfacción.
      </small>
    </>
  );
}
