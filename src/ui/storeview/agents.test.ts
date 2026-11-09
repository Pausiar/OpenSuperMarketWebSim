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
  stepAgent,
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

describe('reparto entre cajas abiertas', () => {
  function twoOpen() {
    const map = createMap(10, 8);
    map.placements.push({ equipmentId: 's', x: 3, y: 3, rot: 0 });
    map.placements.push({ equipmentId: 'c1', x: 6, y: 3, rot: 0 });
    map.placements.push({ equipmentId: 'c2', x: 8, y: 3, rot: 0 });
    map.placements.push({ equipmentId: 'c3', x: 6, y: 5, rot: 0 });
    return buildLayout(map, [
      { id: 's', type: 'shelf', broken: false },
      { id: 'c1', type: 'checkout', broken: false },
      { id: 'c2', type: 'checkout', broken: false },
      { id: 'c3', type: 'checkout', broken: false },
    ]);
  }
  it('con 2 cajeros solo usan las 2 cajas abiertas y se reparten', () => {
    const l = twoOpen();
    const rng = createRng(5);
    const agents: ReturnType<typeof spawnAgent>[] = [];
    for (let i = 0; i < 10; i++) {
      const a = spawnAgent(l, rng, false, 2, agents.filter((x) => x !== null))!;
      agents.push(a);
    }
    const ids = agents.map((a) => a!.checkoutId);
    expect(new Set(ids)).toEqual(new Set(['c1', 'c2']));
    expect(ids.filter((i) => i === 'c1')).toHaveLength(5);
  });
  it('sin cajas abiertas nadie va a pagar', () => {
    const a = spawnAgent(twoOpen(), createRng(1), false, 0)!;
    expect(a.checkoutId).toBeNull();
  });
  it('el cliente se detiene a pagar en su caja', () => {
    const l = twoOpen();
    const a = spawnAgent(l, createRng(2), false, 2)!;
    const spot = a.path[a.payAt]!;
    const co = l.checkouts.find((c) => c.id === a.checkoutId)!;
    expect(spot).toEqual(co.access);
    a.next = a.payAt + 1;
    a.x = spot.x;
    a.y = spot.y;
    a.pauseLeft = 0;
    stepAgent(a, 1);
    expect(a.next).toBe(a.payAt + 1);
    stepAgent(a, 5);
    expect(a.next).toBeGreaterThan(a.payAt + 1);
  });
});
