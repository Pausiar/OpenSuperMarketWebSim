import { useEffect, useMemo, useRef } from 'react';
import { doorTiles, tilesOf, type MapState } from '../../domain/map';
import type { HourSnapshot } from '../../domain/state';
import type { Speed } from '../../core/time';
import { SPEED_MIN_PER_SEC } from '../../core/time';
import {
  buildLayout,
  createRng,
  openCheckouts,
  queueTiles,
  stepCrowd,
  type Crowd,
  type Layout,
} from './agents';
import { tileToPixel, type EquipmentKind } from './geometry';
import './storeview.css';

const T = 32;

export interface StoreCanvasProps {
  map: MapState;
  equipment: readonly { id: string; type: EquipmentKind; broken: boolean }[];
  live: HourSnapshot;
  blackout: boolean;
  speed: Speed;
  /** Semilla del PRNG visual (no afecta al juego). */
  seed?: number;
}

const COLORS: Record<EquipmentKind, [string, string]> = {
  shelf: ['#8a6a3d', '#b48a4f'],
  fridge: ['#3b7ea8', '#7cc4ee'],
  freezer: ['#5b5fc7', '#a5a8ff'],
  checkout: ['#3a8f6b', '#5fd3a0'],
};

function draw(
  ctx: CanvasRenderingContext2D,
  props: StoreCanvasProps,
  layout: Layout,
  crowd: Crowd,
  time: number,
) {
  const { map, equipment, live, blackout } = props;
  const kinds = new Map(equipment.map((e) => [e.id, e]));
  ctx.clearRect(0, 0, map.w * T, map.h * T);
  // Suelo en damero sutil
  for (let y = 0; y < map.h; y++)
    for (let x = 0; x < map.w; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#1c2438' : '#202a42';
      ctx.fillRect(x * T, y * T, T, T);
    }
  // Almacén
  ctx.fillStyle = 'rgb(255 201 77 / 0.12)';
  ctx.fillRect(T, T, 2 * T, 2 * T);
  ctx.fillStyle = '#ffc94d';
  ctx.font = '10px system-ui';
  ctx.fillText('ALMACÉN', T + 4, T + 14);
  // Paredes
  ctx.fillStyle = '#0b0f19';
  for (let x = 0; x < map.w; x++) {
    ctx.fillRect(x * T, 0, T, T);
    ctx.fillRect(x * T, (map.h - 1) * T, T, T);
  }
  for (let y = 0; y < map.h; y++) {
    ctx.fillRect(0, y * T, T, T);
    ctx.fillRect((map.w - 1) * T, y * T, T, T);
  }
  // Puerta
  ctx.fillStyle = '#4f8cff';
  for (const d of doorTiles(map)) ctx.fillRect(d.x * T + 2, d.y * T + 6, T - 4, T - 12);
  // Equipamiento
  for (const p of map.placements) {
    const eq = kinds.get(p.equipmentId);
    if (!eq) continue;
    const [dark, light] = COLORS[eq.type];
    for (const t of tilesOf(p, eq.type)) {
      ctx.fillStyle = dark;
      ctx.fillRect(t.x * T + 2, t.y * T + 2, T - 4, T - 4);
      ctx.fillStyle = light;
      ctx.fillRect(t.x * T + 4, t.y * T + 4, T - 8, 5);
      if (eq.broken) {
        ctx.fillStyle = 'rgb(255 107 107 / 0.55)';
        ctx.fillRect(t.x * T + 2, t.y * T + 2, T - 4, T - 4);
      }
    }
  }
  // Colas y cajeros
  const open = openCheckouts(layout, live.openCheckouts);
  queueTiles(layout, open, live.queueEstimate).forEach((slots, i) => {
    slots.forEach((s, j) => {
      const c = tileToPixel(s, T);
      ctx.fillStyle = j === 0 ? '#ffc94d' : `hsl(${(i * 70 + j * 37) % 360} 55% 65%)`;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  for (const c of open) {
    const t = c.tiles[0];
    if (!t) continue;
    const p = tileToPixel(t, T);
    ctx.fillStyle = '#f2f5ff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3ecf8e';
    ctx.fillRect(p.x - 6, p.y + 5, 12, 3);
  }
  // Clientes
  for (const a of crowd.agents) {
    const c = tileToPixel({ x: a.x, y: a.y }, T);
    const bob = Math.sin(time * 9 + a.id) * 1;
    ctx.fillStyle = 'rgb(0 0 0 / 0.3)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 6, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `hsl(${a.hue} 60% 62%)`;
    ctx.beginPath();
    ctx.arc(c.x, c.y + bob, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Apagón
  if (blackout) {
    ctx.fillStyle = 'rgb(3 5 12 / 0.72)';
    ctx.fillRect(0, 0, map.w * T, map.h * T);
  }
}

/** Dibuja la tienda. Solo lee props; los agentes viven en un ref local. */
export function StoreCanvas(props: StoreCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const crowd = useRef<Crowd>({ agents: [], carry: 0 });

  const signature = JSON.stringify([
    props.map.w,
    props.map.h,
    props.map.placements,
    props.equipment.map((e) => [e.id, e.type, e.broken]),
  ]);
  const layout = useMemo(
    () => buildLayout(latest.current.map, latest.current.equipment),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  useEffect(() => {
    crowd.current = { agents: [], carry: 0 };
  }, [layout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rng = createRng(latest.current.seed ?? 1337);
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const p = latest.current;
      const simMinPerSec = SPEED_MIN_PER_SEC[p.speed];
      // Velocidad visual moderada: a x10 no corren, solo llegan más.
      const walk = p.speed === 0 ? 0 : Math.min(2.5, 1 + p.speed / 5);
      stepCrowd(crowd.current, layoutRef.current, rng, p.live, simMinPerSec * dt, dt * walk);
      draw(ctx, p, layoutRef.current, crowd.current, now / 1000);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="storeview">
      <canvas ref={canvasRef} width={props.map.w * T} height={props.map.h * T} aria-label="Vista de la tienda" />
      {props.blackout && <span className="storeview__badge">APAGÓN</span>}
    </div>
  );
}
