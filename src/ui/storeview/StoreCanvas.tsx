import { useEffect, useMemo, useRef } from "react";
import { doorTiles, tilesOf, type MapState } from "../../domain/map";
import type { HourSnapshot } from "../../domain/state";
import type { Speed } from "../../core/time";
import { SPEED_MIN_PER_SEC } from "../../core/time";
import {
  buildLayout,
  createRng,
  openCheckouts,
  queueTiles,
  stepCrowd,
  type Crowd,
  type Layout,
} from "./agents";
import {
  findPath,
  isWalkable,
  type EquipmentKind,
  type Tile,
} from "./geometry";
import {
  BROKEN_OVERLAY,
  CHECKOUT_SCREEN,
  CUSTOMER_VARIANTS,
  TILE,
  cashierSprite,
  customerSprite,
  drawSprite,
  rasterize,
  spriteFor,
  stockerSprite,
  tileSprite,
  type Direction,
} from "./pixel";
import "./storeview.css";

export interface StoreCanvasProps {
  map: MapState;
  equipment: readonly { id: string; type: EquipmentKind; broken: boolean }[];
  live: HourSnapshot;
  blackout: boolean;
  speed: Speed;
  /** Semilla del PRNG visual (no afecta al juego). */
  seed?: number;
  /** Hora del día (0-24) para el tinte de luz; por defecto `live.hour`. */
  hour?: number;
}

/** Seguimiento visual de cada agente: dirección y fase de paso derivadas de su movimiento. */
interface Track {
  x: number;
  y: number;
  dir: Direction;
  dist: number;
  moving: boolean;
}

interface Entity {
  y: number;
  paint: () => void;
}

const STEP_CYCLE = [1, 0, 2, 0];
const STORAGE = { x: 1, y: 1, w: 2, h: 2 };

/** Tinte de ambiente por hora: cálido por la mañana, neutro de día, frío al anochecer. */
const TINTS: readonly [number, number, number, number, number][] = [
  [0, 18, 28, 80, 0.42],
  [5, 30, 40, 100, 0.34],
  [7, 255, 170, 90, 0.14],
  [9, 255, 210, 150, 0.04],
  [12, 255, 255, 255, 0],
  [16, 255, 230, 170, 0.04],
  [18, 255, 140, 70, 0.16],
  [20, 40, 50, 120, 0.3],
  [22, 18, 28, 80, 0.4],
  [24, 18, 28, 80, 0.42],
];

export function tintFor(hour: number): string | null {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 1; i < TINTS.length; i++) {
    const a = TINTS[i - 1];
    const b = TINTS[i];
    if (h <= b[0]) {
      const k = (h - a[0]) / (b[0] - a[0]);
      const m = (j: 1 | 2 | 3 | 4) => a[j] + (b[j] - a[j]) * k;
      const alpha = m(4);
      if (alpha < 0.005) return null;
      return `rgb(${Math.round(m(1))} ${Math.round(m(2))} ${Math.round(m(3))} / ${alpha.toFixed(3)})`;
    }
  }
  return null;
}

/**
 * `buildLayout` elige la primera casilla libre junto a cada equipo, que puede quedar en un
 * hueco cerrado (p. ej. tras el mostrador) y sin ruta desde la puerta: los clientes no
 * nacerían. Aquí se reemplaza por la casilla vecina más cercana a la puerta que sí es alcanzable
 * y se descartan las estanterías inalcanzables.
 */
function reachableLayout(layout: Layout): Layout {
  const { grid, door } = layout;
  const dist = (t: Tile) => findPath(grid, door, t)?.length ?? Infinity;
  const nearestAccess = (tiles: Tile[], fallback: Tile): Tile => {
    let best = fallback;
    let bestD = dist(fallback);
    for (const t of tiles)
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [-1, 0],
        [0, -1],
      ] as const) {
        const n = { x: t.x + dx, y: t.y + dy };
        if (!isWalkable(grid, n)) continue;
        const d = dist(n);
        if (d < bestD) {
          best = n;
          bestD = d;
        }
      }
    return best;
  };
  const checkouts = layout.checkouts.map((c) => ({
    ...c,
    access: nearestAccess(c.tiles, c.access),
  }));
  const shelves = layout.shelves.filter((t) => dist(t) < Infinity);
  return {
    ...layout,
    shelves: shelves.length > 0 ? shelves : layout.shelves,
    checkouts,
  };
}

function dirBetween(dx: number, dy: number): Direction {
  return Math.abs(dx) > Math.abs(dy)
    ? dx < 0
      ? "left"
      : "right"
    : dy < 0
      ? "up"
      : "down";
}

interface DrawCtx {
  ctx: CanvasRenderingContext2D;
  s: number;
  time: number;
  still: boolean;
  tracks: Map<number, Track>;
}

function updateTracks(crowd: Crowd, tracks: Map<number, Track>) {
  const alive = new Set<number>();
  for (const a of crowd.agents) {
    alive.add(a.id);
    const t = tracks.get(a.id);
    if (!t) {
      tracks.set(a.id, { x: a.x, y: a.y, dir: "down", dist: 0, moving: false });
      continue;
    }
    const dx = a.x - t.x;
    const dy = a.y - t.y;
    const d = Math.hypot(dx, dy);
    t.moving = d > 1e-4;
    if (t.moving) {
      t.dir = dirBetween(dx, dy);
      t.dist += d;
    }
    t.x = a.x;
    t.y = a.y;
  }
  for (const id of tracks.keys()) if (!alive.has(id)) tracks.delete(id);
}

function draw(
  d: DrawCtx,
  props: StoreCanvasProps,
  layout: Layout,
  crowd: Crowd,
) {
  const { ctx, s, time, still } = d;
  const { map, equipment, live, blackout } = props;
  const U = TILE * s;
  const W = map.w * U;
  const H = map.h * U;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);

  const kinds = new Map(equipment.map((e) => [e.id, e]));
  const doors = doorTiles(map);
  const isDoor = (x: number, y: number) =>
    doors.some((t) => t.x === x && t.y === y);
  const doorNear = crowd.agents.some((a) =>
    doors.some((t) => Math.abs(a.x - t.x) + Math.abs(a.y - t.y) < 1.6),
  );

  // Suelo, paredes y puerta
  for (let y = 0; y < map.h; y++)
    for (let x = 0; x < map.w; x++) {
      const border = x === 0 || y === 0 || x === map.w - 1 || y === map.h - 1;
      let key: string;
      let rows;
      if (isDoor(x, y)) {
        const open = doorNear && !blackout;
        key = open ? "doorOpen" : "door";
        rows = tileSprite(open ? "doorOpen" : "door");
      } else if (border) {
        const corner =
          (x === 0 || x === map.w - 1) && (y === 0 || y === map.h - 1);
        key = corner ? "wallCorner" : "wall";
        rows = tileSprite(corner ? "wallCorner" : "wall");
      } else {
        const v = (x * 3 + y * 5) % 2;
        key = `floor${v}`;
        rows = tileSprite("floor", v);
      }
      drawSprite(ctx, `t:${key}`, rows, x * U, y * U, s);
    }

  // Zona de almacén: tinte cálido y borde discontinuo
  ctx.fillStyle = "rgb(240 146 46 / 0.16)";
  ctx.fillRect(STORAGE.x * U, STORAGE.y * U, STORAGE.w * U, STORAGE.h * U);
  ctx.fillStyle = "rgb(43 29 26 / 0.55)";
  for (let i = 0; i < STORAGE.w * TILE; i += 4) {
    ctx.fillRect(
      STORAGE.x * U + i * s,
      (STORAGE.y + STORAGE.h) * U - s,
      2 * s,
      s,
    );
    ctx.fillRect(STORAGE.x * U + i * s, STORAGE.y * U, 2 * s, s);
  }
  for (let i = 0; i < STORAGE.h * TILE; i += 4) {
    ctx.fillRect(
      (STORAGE.x + STORAGE.w) * U - s,
      STORAGE.y * U + i * s,
      s,
      2 * s,
    );
    ctx.fillRect(STORAGE.x * U, STORAGE.y * U + i * s, s, 2 * s);
  }

  // Equipamiento (estático)
  const brokenFrame = still ? 0 : Math.floor(time * 2) % BROKEN_OVERLAY.length;
  for (const p of map.placements) {
    const eq = kinds.get(p.equipmentId);
    if (!eq) continue;
    const rows = spriteFor(eq.type, eq.id);
    const tiles = tilesOf(p, eq.type);
    tiles.forEach((t, i) => {
      drawSprite(ctx, `e:${eq.type}:${eq.id}`, rows, t.x * U, t.y * U, s);
      if (eq.type === "checkout" && i === 0 && !eq.broken)
        drawSprite(ctx, "e:screen", CHECKOUT_SCREEN, t.x * U, t.y * U, s);
      if (eq.broken)
        drawSprite(
          ctx,
          `e:broken${brokenFrame}`,
          BROKEN_OVERLAY[brokenFrame],
          t.x * U,
          t.y * U,
          s,
        );
    });
  }

  // Entidades con orden por profundidad (y)
  const ents: Entity[] = [];
  const shadow = (px: number, py: number) => {
    ctx.fillStyle = "rgb(43 29 26 / 0.22)";
    ctx.fillRect(px + 4 * s, py + 14 * s, 8 * s, s);
  };
  const open = openCheckouts(layout, live.openCheckouts);
  for (const c of open) {
    const t = c.tiles[0];
    if (!t) continue;
    ents.push({
      y: t.y + 0.5,
      paint: () => {
        // Solo cabeza y torso: el mostrador tapa las piernas.
        const img = rasterize("cashier:down", cashierSprite("down", 0), s);
        if (!img) return;
        ctx.drawImage(
          img,
          0,
          0,
          TILE * s,
          10 * s,
          Math.round(t.x * U),
          Math.round(t.y * U - 4 * s),
          TILE * s,
          10 * s,
        );
      },
    });
  }
  queueTiles(layout, open, live.queueEstimate).forEach((slots, i) => {
    const co = open[i];
    const ct = co?.tiles[0];
    slots.forEach((sl: Tile, j: number) => {
      const target = j === 0 ? ct : slots[j - 1];
      const dir = target
        ? dirBetween(target.x - sl.x, target.y - sl.y)
        : "down";
      const v = (i * 2 + j) % CUSTOMER_VARIANTS;
      ents.push({
        y: sl.y + 0.5,
        paint: () => {
          const px = sl.x * U;
          const py = sl.y * U;
          shadow(px, py);
          drawSprite(
            ctx,
            `c:${v}:${dir}:0`,
            customerSprite(v, dir, 0),
            px,
            py,
            s,
          );
        },
      });
    });
  });
  for (const a of crowd.agents) {
    const t = d.tracks.get(a.id);
    const dir = t?.dir ?? "down";
    const frame =
      t && t.moving
        ? STEP_CYCLE[Math.floor(t.dist * 3) % STEP_CYCLE.length]
        : 0;
    const v = a.id % CUSTOMER_VARIANTS;
    ents.push({
      y: a.y + 0.5,
      paint: () => {
        const px = a.x * U;
        const py = a.y * U;
        shadow(px, py);
        drawSprite(
          ctx,
          `c:${v}:${dir}:${frame}`,
          customerSprite(v, dir, frame),
          px,
          py,
          s,
        );
      },
    });
  }
  if (live.stockerPresent) {
    // Repone entre la zona de almacén y las estanterías.
    const span = STORAGE.w - 1;
    const ph = (time * 0.5) % (2 * span);
    const sx = STORAGE.x + (ph < span ? ph : 2 * span - ph);
    const dir: Direction = ph < span ? "right" : "left";
    const frame = still
      ? 0
      : STEP_CYCLE[Math.floor(time * 6) % STEP_CYCLE.length];
    const sy = STORAGE.y + STORAGE.h - 1;
    ents.push({
      y: sy + 0.5,
      paint: () => {
        shadow(sx * U, sy * U);
        drawSprite(
          ctx,
          `s:${dir}:${frame}`,
          stockerSprite(dir, frame),
          sx * U,
          sy * U,
          s,
        );
      },
    });
  }
  ents.sort((p, q) => p.y - q.y);
  for (const e of ents) e.paint();

  // Luz ambiente por hora
  const tint = tintFor(props.hour ?? live.hour);
  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, W, H);
  }

  // Apagón: oscuridad y luces de emergencia parpadeantes
  if (blackout) {
    ctx.fillStyle = "rgb(3 5 12 / 0.7)";
    ctx.fillRect(0, 0, W, H);
    const flick = still
      ? 0.8
      : Math.sin(time * 23) + Math.sin(time * 7.3) > 0.2
        ? 1
        : 0.25;
    const lamps = [Math.round(map.w * 0.25), Math.round(map.w * 0.75)];
    for (const lx of lamps) {
      const cx = lx * U + U / 2;
      const cy = U + U / 2;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, U * 3.5);
      g.addColorStop(0, `rgb(255 60 50 / ${0.4 * flick})`);
      g.addColorStop(1, "rgb(255 60 50 / 0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - U * 3.5, cy - U * 3.5, U * 7, U * 7);
      ctx.fillStyle = flick > 0.5 ? "rgb(255 110 90)" : "rgb(120 30 30)";
      ctx.fillRect(lx * U + 5 * s, 10 * s, 6 * s, 3 * s);
    }
  }
}

function useReducedMotion() {
  const ref = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    ref.current = mq.matches;
    const on = () => {
      ref.current = mq.matches;
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return ref;
}

/** Dibuja la tienda. Solo lee props; los agentes viven en un ref local. */
export function StoreCanvas(props: StoreCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const crowd = useRef<Crowd>({ agents: [], carry: 0 });
  const tracks = useRef(new Map<number, Track>());
  const scaleRef = useRef(1);
  const still = useReducedMotion();

  const signature = JSON.stringify([
    props.map.w,
    props.map.h,
    props.map.placements,
    props.equipment.map((e) => [e.id, e.type, e.broken]),
  ]);
  const layout = useMemo(
    () =>
      reachableLayout(
        buildLayout(latest.current.map, latest.current.equipment),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature],
  );
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  useEffect(() => {
    crowd.current = { agents: [], carry: 0 };
    tracks.current.clear();
  }, [layout]);

  // Escala entera: el mayor múltiplo de 16 px que cabe en el ancho disponible (en píxeles físicos).
  useEffect(() => {
    const canvas = canvasRef.current;
    const box = frameRef.current;
    if (!canvas || !box) return;
    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const style = getComputedStyle(box);
      const avail =
        box.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const baseW = latest.current.map.w * TILE;
      const baseH = latest.current.map.h * TILE;
      const s = Math.max(2, Math.floor((avail * dpr * 1.02) / baseW));
      scaleRef.current = s;
      if (canvas.width !== baseW * s) canvas.width = baseW * s;
      if (canvas.height !== baseH * s) canvas.height = baseH * s;
      canvas.style.width = `${(baseW * s) / dpr}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [props.map.w, props.map.h]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
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
      stepCrowd(
        crowd.current,
        layoutRef.current,
        rng,
        p.live,
        simMinPerSec * dt,
        dt * walk,
      );
      updateTracks(crowd.current, tracks.current);
      draw(
        {
          ctx,
          s: scaleRef.current,
          time: now / 1000,
          still: still.current,
          tracks: tracks.current,
        },
        p,
        layoutRef.current,
        crowd.current,
      );
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  return (
    <div className="storeview" data-blackout={props.blackout || undefined}>
      <div className="storeview__screen" ref={frameRef}>
        <canvas
          ref={canvasRef}
          width={props.map.w * TILE}
          height={props.map.h * TILE}
          aria-label="Vista de la tienda"
        />
        {props.blackout && (
          <span className="storeview__badge" role="status">
            <svg
              viewBox="0 0 12 16"
              width="10"
              height="14"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M7.5 0 1 9h4l-1 7 7-9H7z" fill="currentColor" />
            </svg>
            Apagón
          </span>
        )}
      </div>
      <span className="storeview__led" aria-hidden="true" />
    </div>
  );
}
