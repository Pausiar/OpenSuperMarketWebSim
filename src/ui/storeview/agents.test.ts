import { describe, expect, it } from 'vitest';
import { createMap } from '../../domain/map';
import {
  MAX_AGENTS,
  buildLayout,
  createRng,
  distributeQueue,
  leaveFraction,
  openCheckouts,
  queueTiles,
  spawnAgent,
  spawnBudget,
  stepCrowd,
  type Crowd,
} from './agents';

function layout() {
  const map = createMap(10, 8);
  map.placements.push({ equipmentId: 's', x: 3, y: 3, rot: 0 });
  map.placements.push({ equipmentId: 'c1', x: 7, y: 3, rot: 0 });
  map.placements.push({ equipmentId: 'c2', x: 8, y: 3, rot: 0 });
  return buildLayout(map, [
    { id: 's', type: 'shelf', broken: false },
    { id: 'c1', type: 'checkout', broken: false },
    { id: 'c2', type: 'checkout', broken: true },
  ]);
}

describe('PRNG', () => {
  it('es determinista por semilla', () => {
    const a = createRng(7);
    const b = createRng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('spawn', () => {
  it('escala con el potencial y es cero sin él', () => {
    expect(spawnBudget(0, 60)).toBe(0);
    expect(spawnBudget(100, 0)).toBe(0);
    expect(spawnBudget(200, 30)).toBeCloseTo(spawnBudget(100, 60));
  });
  it('leaveFraction se acota a [0,1]', () => {
    expect(leaveFraction(0, 5)).toBe(0);
    expect(leaveFraction(100, 25)).toBe(0.25);
    expect(leaveFraction(10, 50)).toBe(1);
  });
  it('quien se va no pasa por caja y los demás sí', () => {
    const l = layout();
    const stay = spawnAgent(l, createRng(1), false)!;
    const leave = spawnAgent(l, createRng(1), true)!;
    expect(stay.path.length).toBeGreaterThan(leave.path.length);
    expect(leave.path[0]).toEqual(l.door);
  });
  it('respeta el tope de agentes', () => {
    const l = layout();
    const crowd: Crowd = { agents: [], carry: 0 };
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) stepCrowd(crowd, l, rng, { potential: 5000, lost: 0 }, 5, 0.05);
    expect(crowd.agents.length).toBeLessThanOrEqual(MAX_AGENTS);
    expect(crowd.agents.length).toBeGreaterThan(0);
  });
  it('en pausa (dt 0) no se mueve ni aparece nadie', () => {
    const crowd: Crowd = { agents: [], carry: 0 };
    stepCrowd(crowd, layout(), createRng(1), { potential: 500, lost: 0 }, 10, 0);
    expect(crowd.agents).toHaveLength(0);
  });
});

describe('colas', () => {
  it('reparte parejo y acota por caja', () => {
    expect(distributeQueue(7, 3, 6)).toEqual([3, 2, 2]);
    expect(distributeQueue(40, 2, 6)).toEqual([6, 6]);
    expect(distributeQueue(5, 0, 6)).toEqual([]);
    expect(distributeQueue(-3, 2, 6)).toEqual([0, 0]);
  });
  it('solo atienden cajas no averiadas y la cola tiene el tamaño pedido', () => {
    const l = layout();
    const open = openCheckouts(l, 2);
    expect(open.map((c) => c.id)).toEqual(['c1']);
    const q = queueTiles(l, open, 3);
    expect(q[0]).toHaveLength(3);
    expect(q[0]![0]).toEqual(open[0]!.access);
  });
});
