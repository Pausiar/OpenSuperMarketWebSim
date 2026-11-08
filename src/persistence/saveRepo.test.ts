import { beforeEach, describe, expect, it } from 'vitest';
import { Rng } from '../core/rng';
import { customerSystem } from '../sim/customerSystem';
import { createNewGame } from '../domain/newGame';
import { CURRENT_SAVE_VERSION, deleteGame, listSaves, loadGame, saveGame } from './saveRepo';

function installStorage(): Map<string, string> {
  const store = new Map<string, string>();
  const stub = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: stub, configurable: true });
  return store;
}

describe('saveRepo', () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = installStorage();
  });

  it('round-trips a v2 save', () => {
    const state = createNewGame('Test', 42);
    const id = saveGame(state);
    const loaded = loadGame(id);
    expect(loaded.saveVersion).toBe(CURRENT_SAVE_VERSION);
    expect(loaded.live).toEqual(state.live);
    expect(listSaves()).toHaveLength(1);
    deleteGame(id);
    expect(listSaves()).toHaveLength(0);
  });

  it('migrates a v1 save to v2 filling live with defaults', () => {
    const v1: Record<string, unknown> = { ...createNewGame('Old', 7), saveVersion: 1 };
    delete v1.live;
    store.set('smt:save:old', JSON.stringify(v1));
    const loaded = loadGame('old');
    expect(loaded.saveVersion).toBe(2);
    expect(loaded.live).toEqual({
      hour: 0,
      potential: 0,
      served: 0,
      lost: 0,
      openCheckouts: 0,
      cashierIds: [],
      queueEstimate: 0,
      stockerPresent: false,
      securityPresent: false,
    });
  });

  it('rejects saves from a newer version', () => {
    store.set('smt:save:new', JSON.stringify({ ...createNewGame('N', 1), saveVersion: 99 }));
    expect(() => loadGame('new')).toThrow(/versión más reciente/);
  });

  it('rejects corrupt saves', () => {
    store.set('smt:save:bad1', '{not json');
    expect(() => loadGame('bad1')).toThrow();
    store.set('smt:save:bad2', JSON.stringify({ saveVersion: 2 }));
    expect(() => loadGame('bad2')).toThrow(/corrupta/);
    const broken = createNewGame('B', 1) as unknown as Record<string, unknown>;
    broken.map = { w: 5, h: 5, placements: [{ equipmentId: 'x', x: 'a', y: 1, rot: 0 }] };
    store.set('smt:save:bad3', JSON.stringify(broken));
    expect(() => loadGame('bad3')).toThrow(/corrupta/);
    expect(() => loadGame('missing')).toThrow();
  });
});

describe('live snapshot', () => {
  it('updates each customer hour and resets outside opening hours', () => {
    const state = createNewGame('Live', 5);
    const ctx = { state, rng: new Rng(5), notify: () => {} };
    customerSystem.onHour?.(ctx, 12);
    expect(state.live.hour).toBe(12);
    expect(state.live.potential).toBeGreaterThan(0);
    customerSystem.onHour?.(ctx, 13);
    expect(state.live.hour).toBe(13);
    customerSystem.onHour?.(ctx, 3);
    expect(state.live.hour).toBe(3);
    expect(state.live.potential).toBe(0);
    expect(state.live.cashierIds).toEqual([]);
  });
});
