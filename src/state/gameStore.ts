import { create } from 'zustand';
import { dayOf, type Speed } from '../core/time';
import { createNewGame, randomSeed } from '../domain/newGame';
import type { SimCtx } from '../domain/state';
import * as repo from '../persistence/saveRepo';
import { createSystems, GameEngine } from '../sim';

export type ScreenId =
  | 'dashboard'
  | 'finance'
  | 'products'
  | 'inventory'
  | 'suppliers'
  | 'employees'
  | 'schedule'
  | 'store'
  | 'reports'
  | 'settings';

interface GameStore {
  engine: GameEngine | null;
  saveId: string | null;
  /** Se incrementa tras cada mutación para que React re-renderice. */
  revision: number;
  screen: ScreenId;
  lastSavedDay: number;

  setScreen(screen: ScreenId): void;
  newGame(name: string): void;
  loadGame(id: string): string | null;
  saveNow(): void;
  quitToMenu(): void;
  setSpeed(speed: Speed): void;
  /** Ejecuta un comando del jugador. Devuelve un mensaje de error o null. */
  run(fn: (ctx: SimCtx) => string | null | void): string | null;
  tick(dtMs: number): void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  engine: null,
  saveId: null,
  revision: 0,
  screen: 'dashboard',
  lastSavedDay: 0,

  setScreen: (screen) => set({ screen }),

  newGame: (name) => {
    const state = createNewGame(name.trim() || 'Mi supermercado', randomSeed());
    const engine = new GameEngine(state, createSystems());
    const saveId = repo.saveGame(state);
    set({ engine, saveId, revision: 0, screen: 'dashboard', lastSavedDay: 0 });
  },

  loadGame: (id) => {
    try {
      const state = repo.loadGame(id);
      const engine = new GameEngine(state, createSystems());
      set({
        engine,
        saveId: id,
        revision: 0,
        screen: 'dashboard',
        lastSavedDay: dayOf(state.clock.timeMin),
      });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : 'No se pudo cargar la partida.';
    }
  },

  saveNow: () => {
    const { engine, saveId } = get();
    if (!engine) return;
    const id = repo.saveGame(engine.state, saveId ?? undefined);
    set({
      saveId: id,
      lastSavedDay: dayOf(engine.state.clock.timeMin),
      revision: get().revision + 1,
    });
  },

  quitToMenu: () => {
    get().saveNow();
    set({ engine: null, saveId: null, screen: 'dashboard' });
  },

  setSpeed: (speed) => {
    const { engine } = get();
    if (!engine) return;
    engine.state.clock.speed = speed;
    set({ revision: get().revision + 1 });
  },

  run: (fn) => {
    const { engine } = get();
    if (!engine) return 'No hay partida activa.';
    const result = engine.runCommand(fn);
    set({ revision: get().revision + 1 });
    return typeof result === 'string' ? result : null;
  },

  tick: (dtMs) => {
    const { engine, lastSavedDay } = get();
    if (!engine) return;
    const advanced = engine.tickReal(dtMs);
    if (advanced > 0) {
      // Autoguardado al cambiar de día.
      const day = dayOf(engine.state.clock.timeMin);
      if (day > lastSavedDay) get().saveNow();
      set({ revision: get().revision + 1 });
    }
  },
}));
