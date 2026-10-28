import type { SimCtx, GameState } from '../domain/state';
import { useGameStore } from '../state/gameStore';

/**
 * Acceso de lectura al estado del juego + ejecución de comandos.
 * La suscripción a `revision` fuerza el re-render tras cada tick/comando.
 */
export function useGame(): {
  state: GameState;
  run: (fn: (ctx: SimCtx) => string | null | void) => string | null;
} {
  const engine = useGameStore((s) => s.engine);
  useGameStore((s) => s.revision);
  const run = useGameStore((s) => s.run);
  if (!engine) throw new Error('useGame debe usarse con una partida activa.');
  return { state: engine.state, run };
}
