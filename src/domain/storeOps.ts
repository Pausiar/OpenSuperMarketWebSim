import { dayOf } from '../core/time';
import { EQUIPMENT_MAP, REPAIR_COST_FACTOR, type EquipmentType } from './data/equipment';
import { levelDef, STORE_LEVELS } from './data/levels';
import { CAMPAIGN_MAP } from './data/marketing';
import { productDef } from './data/products';
import { record } from './economy';
import { capacityByStorage, stockByStorage } from './inventory';
import { autoPlace, createMap, removePlacement } from './map';
import { newId, type GameState, type SimCtx } from './state';

export interface EquipmentInstance {
  id: string;
  type: EquipmentType;
  broken: boolean;
}

export interface ActiveCampaign {
  id: string;
  campaignId: string;
  endsDay: number;
}

export interface StoreState {
  level: number;
  /** Reputación acumulada (0-100), evoluciona lentamente con la satisfacción. */
  reputation: number;
  /** Satisfacción reciente de los clientes (0-100). */
  satisfaction: number;
  /** Limpieza del local (0-100). */
  cleanliness: number;
  equipment: EquipmentInstance[];
  campaigns: ActiveCampaign[];
}

export function equipmentCount(state: GameState, type: EquipmentType): number {
  return state.store.equipment.filter((e) => e.type === type).length;
}

export function buyEquipment(ctx: SimCtx, type: EquipmentType): string | null {
  const { state } = ctx;
  const def = EQUIPMENT_MAP[type];
  const level = levelDef(state.store.level);
  if (equipmentCount(state, type) >= level.maxEquipment[type]) {
    return `Límite de ${def.name.toLowerCase()} alcanzado en este nivel (${level.maxEquipment[type]}).`;
  }
  if (state.ledger.balanceCents < def.priceCents) return 'Saldo insuficiente.';
  const eq: EquipmentInstance = { id: newId(state, 'eq'), type, broken: false };
  state.store.equipment.push(eq);
  if (!autoPlace(state, eq.id, type)) {
    state.store.equipment.pop();
    return 'No hay espacio libre en el mapa para colocarlo.';
  }
  record(state, {
    kind: 'expense',
    category: 'equipamiento',
    amountCents: def.priceCents,
    description: `Compra de ${def.name}`,
    reference: eq.id,
  });
  return null;
}

export function sellEquipment(ctx: SimCtx, equipmentId: string): string | null {
  const { state } = ctx;
  const eq = state.store.equipment.find((e) => e.id === equipmentId);
  if (!eq) return 'Equipamiento no encontrado.';
  const def = EQUIPMENT_MAP[eq.type];
  if (def.storage) {
    const remaining = capacityByStorage(state)[def.storage] - (eq.broken ? 0 : def.capacity);
    if (stockByStorage(state)[def.storage] > remaining) {
      return 'No puedes venderlo: el stock actual no cabría en el resto del equipamiento.';
    }
  }
  const refund = Math.round(def.priceCents * 0.4);
  state.store.equipment = state.store.equipment.filter((e) => e.id !== equipmentId);
  removePlacement(state, equipmentId);
  record(state, {
    kind: 'income',
    category: 'equipamiento',
    amountCents: refund,
    description: `Venta de ${def.name} (40% del precio)`,
    reference: equipmentId,
  });
  return null;
}

export function repairEquipment(ctx: SimCtx, equipmentId: string): string | null {
  const { state } = ctx;
  const eq = state.store.equipment.find((e) => e.id === equipmentId);
  if (!eq) return 'Equipamiento no encontrado.';
  if (!eq.broken) return 'Este equipamiento no está averiado.';
  const def = EQUIPMENT_MAP[eq.type];
  const cost = Math.round(def.priceCents * REPAIR_COST_FACTOR);
  if (state.ledger.balanceCents < cost) return 'Saldo insuficiente para la reparación.';
  record(state, {
    kind: 'expense',
    category: 'mantenimiento',
    amountCents: cost,
    description: `Reparación de ${def.name}`,
    reference: eq.id,
  });
  eq.broken = false;
  ctx.notify('info', `${def.name} reparado y operativo de nuevo.`);
  return null;
}

// ---------------- Marketing ----------------

export function startCampaign(ctx: SimCtx, campaignId: string): string | null {
  const { state } = ctx;
  const def = CAMPAIGN_MAP[campaignId];
  if (!def) return 'Campaña desconocida.';
  const today = dayOf(state.clock.timeMin);
  if (state.store.campaigns.some((c) => c.campaignId === campaignId && c.endsDay >= today)) {
    return 'Esta campaña ya está activa.';
  }
  if (state.ledger.balanceCents < def.costCents) return 'Saldo insuficiente.';
  record(state, {
    kind: 'expense',
    category: 'marketing',
    amountCents: def.costCents,
    description: `Campaña: ${def.name} (${def.durationDays} días)`,
  });
  state.store.campaigns.push({
    id: newId(state, 'camp'),
    campaignId,
    endsDay: today + def.durationDays,
  });
  ctx.notify('info', `Campaña "${def.name}" activa durante ${def.durationDays} días.`);
  return null;
}

export function campaignBoost(state: GameState): number {
  const today = dayOf(state.clock.timeMin);
  const boost = state.store.campaigns
    .filter((c) => c.endsDay >= today)
    .reduce((acc, c) => acc * (CAMPAIGN_MAP[c.campaignId]?.trafficBoost ?? 1), 1);
  return Math.min(boost, 1.6);
}

export function cleanupExpiredCampaigns(ctx: SimCtx): void {
  const today = dayOf(ctx.state.clock.timeMin);
  const expired = ctx.state.store.campaigns.filter((c) => c.endsDay < today);
  for (const c of expired) {
    ctx.notify('info', `La campaña "${CAMPAIGN_MAP[c.campaignId]?.name}" ha terminado.`);
  }
  ctx.state.store.campaigns = ctx.state.store.campaigns.filter((c) => c.endsDay >= today);
}

// ---------------- Progresión ----------------

export function upgradeStore(ctx: SimCtx): string | null {
  const { state } = ctx;
  const current = levelDef(state.store.level);
  if (!current.upgrade) return 'Ya estás en el nivel máximo.';
  if (state.store.reputation < current.upgrade.minReputation) {
    return `Necesitas una reputación de ${current.upgrade.minReputation} (tienes ${Math.round(state.store.reputation)}).`;
  }
  if (state.ledger.balanceCents < current.upgrade.costCents) {
    return 'Saldo insuficiente para la ampliación.';
  }
  const next = STORE_LEVELS[state.store.level]; // level es 1-based, el índice apunta al siguiente
  record(state, {
    kind: 'expense',
    category: 'ampliacion',
    amountCents: current.upgrade.costCents,
    description: `Ampliación a "${next.name}"`,
  });
  state.store.level = next.level;
  // Regenera el mapa más grande y recoloca todo el equipamiento.
  state.map = createMap(next.grid.w, next.grid.h);
  for (const eq of state.store.equipment) autoPlace(state, eq.id, eq.type);
  ctx.notify('info', `¡Ampliación completada! Ahora eres: ${next.name}.`);
  return null;
}

// ---------------- Nueva partida: helpers ----------------

/** Valor de stock a precio de coste, para informes. */
export function inventoryValueCents(state: GameState): number {
  return state.lots.reduce(
    (acc, lot) => acc + lot.qty * productDef(lot.productId).baseCostCents,
    0,
  );
}
