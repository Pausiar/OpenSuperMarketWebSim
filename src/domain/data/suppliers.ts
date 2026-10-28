import { PRODUCTS, type StorageType, type ProductCategory } from './products';

export interface SupplierDef {
  id: string;
  name: string;
  description: string;
  /** Factor sobre el coste base del producto. */
  priceFactor: number;
  /** Pedido mínimo en céntimos. */
  minOrderCents: number;
  /** Días de entrega desde el pedido. */
  leadDays: number;
  /** 0-1: probabilidad de entrega puntual y completa. */
  reliability: number;
  /** Ids de productos que ofrece. */
  catalog: string[];
}

function byFilter(fn: (p: { storage: StorageType; category: ProductCategory }) => boolean) {
  return PRODUCTS.filter(fn).map((p) => p.id);
}

export const SUPPLIERS: SupplierDef[] = [
  {
    id: 'dist-iberia',
    name: 'Distribuciones Iberia',
    description: 'Distribuidor generalista de secos e higiene. Precios estándar y buen servicio.',
    priceFactor: 1.0,
    minOrderCents: 10_000,
    leadDays: 2,
    reliability: 0.92,
    catalog: byFilter((p) => p.storage === 'ambient'),
  },
  {
    id: 'frescor',
    name: 'Frescor Express',
    description: 'Especialista en frescos y refrigerados. Entrega en 24h, algo más caro.',
    priceFactor: 1.08,
    minOrderCents: 5_000,
    leadDays: 1,
    reliability: 0.96,
    catalog: byFilter(
      (p) => p.storage === 'chilled' || p.category === 'frutaverdura' || p.category === 'panaderia',
    ),
  },
  {
    id: 'polar',
    name: 'Polar Logística',
    description: 'Cadena de frío: congelados y refrigerados a buen precio.',
    priceFactor: 0.98,
    minOrderCents: 8_000,
    leadDays: 2,
    reliability: 0.9,
    catalog: byFilter((p) => p.storage === 'frozen' || p.storage === 'chilled'),
  },
  {
    id: 'mayorista-sur',
    name: 'Mayorista del Sur',
    description: 'Mayorista barato de todo el catálogo. Pedido mínimo alto y entregas lentas.',
    priceFactor: 0.86,
    minOrderCents: 60_000,
    leadDays: 4,
    reliability: 0.82,
    catalog: PRODUCTS.map((p) => p.id),
  },
];

export const SUPPLIER_MAP: Record<string, SupplierDef> = Object.fromEntries(
  SUPPLIERS.map((s) => [s.id, s]),
);

export function supplierDef(id: string): SupplierDef {
  const def = SUPPLIER_MAP[id];
  if (!def) throw new Error(`Proveedor desconocido: ${id}`);
  return def;
}
