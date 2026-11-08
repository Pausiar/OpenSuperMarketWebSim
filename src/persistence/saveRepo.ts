import { z } from 'zod';
import { dayOf } from '../core/time';
import type { GameState } from '../domain/state';

export const CURRENT_SAVE_VERSION = 2;

const SAVE_INDEX_KEY = 'smt:save-index';
const SAVE_PREFIX = 'smt:save:';

export interface SaveMeta {
  id: string;
  name: string;
  savedAt: number;
  day: number;
  balanceCents: number;
  level: number;
  /** Versión del formato con el que se guardó. Ausente en índices anteriores (v1). */
  saveVersion?: number;
}

const hourSnapshotSchema = z.looseObject({
  hour: z.number(),
  potential: z.number(),
  served: z.number(),
  lost: z.number(),
  openCheckouts: z.number(),
  cashierIds: z.array(z.string()),
  queueEstimate: z.number(),
  stockerPresent: z.boolean(),
  securityPresent: z.boolean(),
});

const productSchema = z.looseObject({
  sellingPriceCents: z.number(),
  active: z.boolean(),
  minStock: z.number(),
});

const placementSchema = z.looseObject({
  equipmentId: z.string(),
  x: z.number().int(),
  y: z.number().int(),
  rot: z.union([z.literal(0), z.literal(1)]),
});

const equipmentSchema = z.looseObject({
  id: z.string(),
  type: z.string(),
  broken: z.boolean(),
});

// Validación estructural al cargar. Los campos desconocidos se conservan.
const stateSchema = z.looseObject({
  saveVersion: z.literal(CURRENT_SAVE_VERSION),
  meta: z.looseObject({
    gameName: z.string(),
    createdAt: z.number(),
    nextId: z.number().int().min(1),
  }),
  seed: z.number(),
  rngState: z.number(),
  clock: z.looseObject({
    timeMin: z.number().min(0),
    speed: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(5), z.literal(10)]),
  }),
  ledger: z.looseObject({ balanceCents: z.number(), transactions: z.array(z.unknown()) }),
  bills: z.array(z.unknown()),
  loans: z.array(z.unknown()),
  products: z.record(z.string(), productSchema),
  lots: z.array(z.unknown()),
  orders: z.array(z.unknown()),
  employees: z.array(z.unknown()),
  applicants: z.array(z.unknown()),
  shifts: z.array(z.unknown()),
  store: z.looseObject({
    level: z.number().int().min(1),
    reputation: z.number(),
    satisfaction: z.number(),
    cleanliness: z.number(),
    equipment: z.array(equipmentSchema),
    campaigns: z.array(z.unknown()),
  }),
  map: z.looseObject({
    w: z.number().int().positive(),
    h: z.number().int().positive(),
    placements: z.array(placementSchema),
  }),
  stats: z.looseObject({ days: z.array(z.unknown()) }),
  live: hourSnapshotSchema,
  flags: z.looseObject({ blackout: z.boolean() }),
});

/** Migra un guardado crudo hasta CURRENT_SAVE_VERSION. */
function migrate(raw: Record<string, unknown>): unknown {
  const version = raw.saveVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new Error('La partida guardada está corrupta o es incompatible.');
  }
  if (version > CURRENT_SAVE_VERSION) {
    throw new Error('La partida fue guardada con una versión más reciente del juego.');
  }
  let current = raw;
  if (version === 1) {
    current = {
      ...current,
      saveVersion: 2,
      live: {
        hour: 0,
        potential: 0,
        served: 0,
        lost: 0,
        openCheckouts: 0,
        cashierIds: [],
        queueEstimate: 0,
        stockerPresent: false,
        securityPresent: false,
      },
    };
  }
  return current;
}

function readIndex(): SaveMeta[] {
  try {
    const raw = localStorage.getItem(SAVE_INDEX_KEY);
    return raw ? (JSON.parse(raw) as SaveMeta[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(index: SaveMeta[]): void {
  localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index));
}

export function listSaves(): SaveMeta[] {
  return readIndex().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveGame(state: GameState, id?: string): string {
  const saveId = id ?? `save-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  localStorage.setItem(SAVE_PREFIX + saveId, JSON.stringify(state));
  const meta: SaveMeta = {
    id: saveId,
    name: state.meta.gameName,
    savedAt: Date.now(),
    day: dayOf(state.clock.timeMin),
    balanceCents: state.ledger.balanceCents,
    level: state.store.level,
    saveVersion: CURRENT_SAVE_VERSION,
  };
  const index = readIndex().filter((m) => m.id !== saveId);
  index.push(meta);
  writeIndex(index);
  return saveId;
}

export function loadGame(id: string): GameState {
  const raw = localStorage.getItem(SAVE_PREFIX + id);
  if (!raw) throw new Error('Partida no encontrada.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('La partida guardada está corrupta o es incompatible.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('La partida guardada está corrupta o es incompatible.');
  }
  const migrated = migrate(parsed as Record<string, unknown>);
  const result = stateSchema.safeParse(migrated);
  if (!result.success) {
    throw new Error('La partida guardada está corrupta o es incompatible.');
  }
  return migrated as GameState;
}

export function deleteGame(id: string): void {
  localStorage.removeItem(SAVE_PREFIX + id);
  writeIndex(readIndex().filter((m) => m.id !== id));
}
