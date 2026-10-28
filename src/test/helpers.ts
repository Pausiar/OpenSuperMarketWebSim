import { Rng } from '../core/rng';
import { createNewGame } from '../domain/newGame';
import { pushNotification, type GameState, type SimCtx } from '../domain/state';

export function makeState(seed = 12345): GameState {
  return createNewGame('Partida de test', seed);
}

export function makeCtx(state: GameState): SimCtx {
  const rng = new Rng(state.rngState);
  return {
    state,
    rng,
    notify: (severity, message) => pushNotification(state, severity, message),
  };
}
