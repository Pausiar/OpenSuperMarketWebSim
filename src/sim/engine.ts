import { Rng } from '../core/rng';
import { SPEED_MIN_PER_SEC, toParts } from '../core/time';
import { pushNotification, type GameState, type SimCtx } from '../domain/state';

/**
 * Un sistema de simulación reacciona a los límites del reloj central.
 * Los sistemas se ejecutan en el orden en que se registran.
 */
export interface SimSystem {
  id: string;
  onMinute?(ctx: SimCtx): void;
  onHour?(ctx: SimCtx, hour: number): void;
  onDayStart?(ctx: SimCtx, day: number): void;
  onMonthStart?(ctx: SimCtx, monthAbs: number): void;
}

/** Máximo de minutos de juego procesados en un solo tick real (evita espirales). */
const MAX_MINUTES_PER_TICK = 360;

export class GameEngine {
  readonly state: GameState;
  private readonly rng: Rng;
  private readonly systems: SimSystem[];
  private accumulator = 0;

  constructor(state: GameState, systems: SimSystem[]) {
    this.state = state;
    this.rng = new Rng(state.rngState);
    this.systems = systems;
  }

  private makeCtx(): SimCtx {
    return {
      state: this.state,
      rng: this.rng,
      notify: (severity, message) => pushNotification(this.state, severity, message),
    };
  }

  /** Avanza el juego según el tiempo real transcurrido y la velocidad. Devuelve minutos avanzados. */
  tickReal(dtMs: number): number {
    const minPerSec = SPEED_MIN_PER_SEC[this.state.clock.speed];
    if (minPerSec === 0) return 0;
    this.accumulator += (dtMs / 1000) * minPerSec;
    const minutes = Math.min(Math.floor(this.accumulator), MAX_MINUTES_PER_TICK);
    this.accumulator -= minutes;
    if (minutes > 0) this.advanceMinutes(minutes);
    return minutes;
  }

  advanceMinutes(minutes: number): void {
    const ctx = this.makeCtx();
    for (let i = 0; i < minutes; i++) this.advanceOneMinute(ctx);
    this.state.rngState = this.rng.state;
  }

  private advanceOneMinute(ctx: SimCtx): void {
    this.state.clock.timeMin += 1;
    const p = toParts(this.state.clock.timeMin);
    if (p.minuteOfDay === 0) {
      if (p.dayOfMonth === 0) {
        const monthAbs = (p.year - 1) * 12 + p.month;
        for (const s of this.systems) s.onMonthStart?.(ctx, monthAbs);
      }
      for (const s of this.systems) s.onDayStart?.(ctx, p.dayIndex);
    }
    if (p.minute === 0) {
      for (const s of this.systems) s.onHour?.(ctx, p.hour);
    }
    for (const s of this.systems) s.onMinute?.(ctx);
  }

  /** Ejecuta un comando del jugador dentro del contexto de simulación. */
  runCommand<T>(fn: (ctx: SimCtx) => T): T {
    const result = fn(this.makeCtx());
    this.state.rngState = this.rng.state;
    return result;
  }
}
