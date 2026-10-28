import type { StorageType } from './products';

export type EquipmentType = 'shelf' | 'fridge' | 'freezer' | 'checkout';

export interface EquipmentDef {
  id: EquipmentType;
  name: string;
  priceCents: number;
  /** Capacidad de unidades que aporta al pool de su tipo de almacenaje. */
  capacity: number;
  storage: StorageType | null; // null = no almacena (cajas)
  /** Consumo eléctrico diario en kWh. */
  kwhPerDay: number;
  /** Huella en el mapa (sin rotar): ancho x alto. */
  w: number;
  h: number;
}

export const EQUIPMENT: EquipmentDef[] = [
  {
    id: 'shelf',
    name: 'Estantería',
    priceCents: 25_000,
    capacity: 200,
    storage: 'ambient',
    kwhPerDay: 0,
    w: 2,
    h: 1,
  },
  {
    id: 'fridge',
    name: 'Nevera expositora',
    priceCents: 90_000,
    capacity: 120,
    storage: 'chilled',
    kwhPerDay: 7,
    w: 2,
    h: 1,
  },
  {
    id: 'freezer',
    name: 'Arcón congelador',
    priceCents: 120_000,
    capacity: 120,
    storage: 'frozen',
    kwhPerDay: 10,
    w: 2,
    h: 1,
  },
  {
    id: 'checkout',
    name: 'Caja registradora',
    priceCents: 60_000,
    capacity: 0,
    storage: null,
    kwhPerDay: 1.5,
    w: 1,
    h: 2,
  },
];

export const EQUIPMENT_MAP: Record<EquipmentType, EquipmentDef> = Object.fromEntries(
  EQUIPMENT.map((e) => [e.id, e]),
) as Record<EquipmentType, EquipmentDef>;

/** Coste de reparación de una avería (fracción del precio). */
export const REPAIR_COST_FACTOR = 0.35;
