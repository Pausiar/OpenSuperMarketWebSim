import type { EquipmentType } from './equipment';

export interface StoreLevelDef {
  level: number;
  name: string;
  /** Límite de unidades de cada equipamiento. */
  maxEquipment: Record<EquipmentType, number>;
  /** Clientes potenciales base por hora punta. */
  baseTraffic: number;
  rentCents: number; // alquiler mensual
  baseKwhPerDay: number; // consumo base (iluminación, clima)
  waterBaseCents: number; // agua base mensual
  grid: { w: number; h: number };
  /** Coste de ampliar AL SIGUIENTE nivel y reputación mínima. null en el último. */
  upgrade: { costCents: number; minReputation: number } | null;
}

export const STORE_LEVELS: StoreLevelDef[] = [
  {
    level: 1,
    name: 'Tienda pequeña',
    maxEquipment: { shelf: 4, fridge: 1, freezer: 1, checkout: 1 },
    baseTraffic: 11,
    rentCents: 80_000,
    baseKwhPerDay: 18,
    waterBaseCents: 4_500,
    grid: { w: 12, h: 9 },
    upgrade: { costCents: 1_500_000, minReputation: 45 },
  },
  {
    level: 2,
    name: 'Supermercado local',
    maxEquipment: { shelf: 8, fridge: 3, freezer: 2, checkout: 2 },
    baseTraffic: 17,
    rentCents: 150_000,
    baseKwhPerDay: 28,
    waterBaseCents: 7_000,
    grid: { w: 16, h: 11 },
    upgrade: { costCents: 4_000_000, minReputation: 55 },
  },
  {
    level: 3,
    name: 'Gran supermercado',
    maxEquipment: { shelf: 14, fridge: 5, freezer: 4, checkout: 3 },
    baseTraffic: 25,
    rentCents: 280_000,
    baseKwhPerDay: 42,
    waterBaseCents: 11_000,
    grid: { w: 20, h: 13 },
    upgrade: { costCents: 9_000_000, minReputation: 62 },
  },
  {
    level: 4,
    name: 'Hipermercado',
    maxEquipment: { shelf: 22, fridge: 8, freezer: 6, checkout: 5 },
    baseTraffic: 35,
    rentCents: 500_000,
    baseKwhPerDay: 65,
    waterBaseCents: 17_000,
    grid: { w: 24, h: 15 },
    upgrade: { costCents: 18_000_000, minReputation: 70 },
  },
  {
    level: 5,
    name: 'Cadena de supermercados',
    maxEquipment: { shelf: 30, fridge: 12, freezer: 8, checkout: 7 },
    baseTraffic: 48,
    rentCents: 800_000,
    baseKwhPerDay: 95,
    waterBaseCents: 26_000,
    grid: { w: 28, h: 17 },
    upgrade: null,
  },
];

export function levelDef(level: number): StoreLevelDef {
  const def = STORE_LEVELS[level - 1];
  if (!def) throw new Error(`Nivel desconocido: ${level}`);
  return def;
}
