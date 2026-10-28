import { z } from 'zod';
import { dayOf } from '../core/time';
import type { GameState } from '../domain/state';

export const CURRENT_SAVE_VERSION = 1;

const SAVE_INDEX_KEY = 'smt:save-index';
const SAVE_PREFIX = 'smt:save:';

export interface SaveMeta {
  id: string;
  name: string;
  savedAt: number;
  day: number;
  balanceCents: number;
  level: number;
}

// Validación estructural mínima al cargar. Los campos desconocidos se conservan.
const stateSchema = z.looseObject({
  saveVersion: z.number(),
  meta: z.looseObject({ gameName: z.string(), nextId: z.number() }),
  seed: z.number(),
  rngState: z.number(),
  clock: z.looseObject({ timeMin: z.number(), speed: z.number() }),
  ledger: z.looseObject({ balanceCents: z.number(), transactions: z.array(z.unknown()) }),
  bills: z.array(z.unknown()),
  loans: z.array(z.unknown()),
  products: z.record(z.string(), z.unknown()),
  lots: z.array(z.unknown()),
  orders: z.array(z.unknown()),
  employees: z.array(z.unknown()),
  applicants: z.array(z.unknown()),
  shifts: z.array(z.unknown()),
  store: z.looseObject({ level: z.number(), equipment: z.array(z.unknown()) }),
  map: z.looseObject({ w: z.number(), h: z.number(), placements: z.array(z.unknown()) }),
  stats: z.looseObject({ days: z.array(z.unknown()) }),
  flags: z.looseObject({ blackout: z.boolean() }),
});

/** Punto de extensión para migraciones entre versiones de guardado. */
function migrate(raw: { saveVersion: number }): unknown {
  if (raw.saveVersion > CURRENT_SAVE_VERSION) {
    throw new Error('La partida fue guardada con una versión más reciente del juego.');
  }
  // Futuras migraciones: if (raw.saveVersion === 1) { ...; raw.saveVersion = 2; }
  return raw;
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
  };
  const index = readIndex().filter((m) => m.id !== saveId);
  index.push(meta);
  writeIndex(index);
  return saveId;
}

export function loadGame(id: string): GameState {
  const raw = localStorage.getItem(SAVE_PREFIX + id);
  if (!raw) throw new Error('Partida no encontrada.');
  const parsed = JSON.parse(raw) as { saveVersion: number };
  const migrated = migrate(parsed);
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
