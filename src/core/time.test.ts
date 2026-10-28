import { describe, expect, it } from 'vitest';
import { MIN_PER_DAY, toParts, formatClock } from './time';
import { GameEngine, type SimSystem } from '../sim/engine';
import { makeState } from '../test/helpers';

describe('tiempo', () => {
  it('descompone minutos en calendario (semanas de 7, meses de 30)', () => {
    const p = toParts(31 * MIN_PER_DAY + 9 * 60 + 30); // día 31, 09:30
    expect(p.dayIndex).toBe(31);
    expect(p.month).toBe(1); // segundo mes
    expect(p.dayOfMonth).toBe(1);
    expect(p.weekday).toBe(3); // 31 % 7
    expect(p.hour).toBe(9);
    expect(p.minute).toBe(30);
    expect(formatClock(31 * MIN_PER_DAY + 9 * 60 + 30)).toBe('09:30');
  });

  it('el reloj central dispara hooks de hora, día y mes en orden determinista', () => {
    const state = makeState();
    const calls = { hour: 0, day: 0, month: 0 };
    const probe: SimSystem = {
      id: 'probe',
      onHour: () => calls.hour++,
      onDayStart: () => calls.day++,
      onMonthStart: () => calls.month++,
    };
    const engine = new GameEngine(state, [probe]);

    engine.advanceMinutes(MIN_PER_DAY); // desde día 0 07:00 hasta día 1 07:00
    expect(calls.hour).toBe(24);
    expect(calls.day).toBe(1);
    expect(calls.month).toBe(0);

    engine.advanceMinutes(MIN_PER_DAY * 29); // hasta el día 30 → nuevo mes
    expect(calls.month).toBe(1);
    expect(calls.day).toBe(30);
  });

  it('en pausa no avanza; la velocidad escala los minutos', () => {
    const state = makeState();
    const engine = new GameEngine(state, []);
    state.clock.speed = 0;
    expect(engine.tickReal(5000)).toBe(0);
    state.clock.speed = 10;
    expect(engine.tickReal(1000)).toBe(20); // 20 min de juego por segundo a 10x
  });
});
