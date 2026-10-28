export type StorageType = 'ambient' | 'chilled' | 'frozen';

export type ProductCategory =
  | 'lacteos'
  | 'carne'
  | 'panaderia'
  | 'frutaverdura'
  | 'despensa'
  | 'bebidas'
  | 'congelados'
  | 'higiene';

export const CATEGORY_NAMES: Record<ProductCategory, string> = {
  lacteos: 'Lácteos',
  carne: 'Carne y charcutería',
  panaderia: 'Panadería',
  frutaverdura: 'Fruta y verdura',
  despensa: 'Despensa',
  bebidas: 'Bebidas',
  congelados: 'Congelados',
  higiene: 'Higiene y hogar',
};

export interface ProductDef {
  id: string;
  name: string;
  category: ProductCategory;
  storage: StorageType;
  /** Coste base de compra por unidad (céntimos). Los proveedores aplican su factor. */
  baseCostCents: number;
  /** Precio de venta recomendado (céntimos). El jugador puede cambiarlo. */
  baseSellCents: number;
  /** Días hasta caducar desde la entrega. null = no perecedero. */
  expirationDays: number | null;
  /** Peso relativo en la demanda (más alto = más pedido por los clientes). */
  popularity: number;
}

export const PRODUCTS: ProductDef[] = [
  // Lácteos (refrigerado)
  {
    id: 'leche',
    name: 'Leche entera 1L',
    category: 'lacteos',
    storage: 'chilled',
    baseCostCents: 62,
    baseSellCents: 95,
    expirationDays: 9,
    popularity: 10,
  },
  {
    id: 'yogur',
    name: 'Yogur natural x4',
    category: 'lacteos',
    storage: 'chilled',
    baseCostCents: 85,
    baseSellCents: 135,
    expirationDays: 14,
    popularity: 7,
  },
  {
    id: 'queso',
    name: 'Queso curado 250g',
    category: 'lacteos',
    storage: 'chilled',
    baseCostCents: 210,
    baseSellCents: 320,
    expirationDays: 30,
    popularity: 5,
  },
  {
    id: 'mantequilla',
    name: 'Mantequilla 250g',
    category: 'lacteos',
    storage: 'chilled',
    baseCostCents: 140,
    baseSellCents: 215,
    expirationDays: 40,
    popularity: 3,
  },
  // Carne (refrigerado)
  {
    id: 'pollo',
    name: 'Pechuga de pollo 500g',
    category: 'carne',
    storage: 'chilled',
    baseCostCents: 280,
    baseSellCents: 420,
    expirationDays: 4,
    popularity: 8,
  },
  {
    id: 'picada',
    name: 'Carne picada 400g',
    category: 'carne',
    storage: 'chilled',
    baseCostCents: 260,
    baseSellCents: 395,
    expirationDays: 4,
    popularity: 6,
  },
  {
    id: 'jamon',
    name: 'Jamón cocido 200g',
    category: 'carne',
    storage: 'chilled',
    baseCostCents: 165,
    baseSellCents: 250,
    expirationDays: 12,
    popularity: 6,
  },
  // Panadería
  {
    id: 'pan',
    name: 'Pan de barra',
    category: 'panaderia',
    storage: 'ambient',
    baseCostCents: 38,
    baseSellCents: 65,
    expirationDays: 2,
    popularity: 12,
  },
  {
    id: 'galletas',
    name: 'Galletas María',
    category: 'panaderia',
    storage: 'ambient',
    baseCostCents: 78,
    baseSellCents: 125,
    expirationDays: 180,
    popularity: 5,
  },
  // Fruta y verdura
  {
    id: 'manzanas',
    name: 'Manzanas 1kg',
    category: 'frutaverdura',
    storage: 'ambient',
    baseCostCents: 110,
    baseSellCents: 179,
    expirationDays: 8,
    popularity: 7,
  },
  {
    id: 'platanos',
    name: 'Plátanos 1kg',
    category: 'frutaverdura',
    storage: 'ambient',
    baseCostCents: 95,
    baseSellCents: 155,
    expirationDays: 5,
    popularity: 8,
  },
  {
    id: 'tomates',
    name: 'Tomates 1kg',
    category: 'frutaverdura',
    storage: 'ambient',
    baseCostCents: 120,
    baseSellCents: 195,
    expirationDays: 6,
    popularity: 6,
  },
  {
    id: 'patatas',
    name: 'Patatas 2kg',
    category: 'frutaverdura',
    storage: 'ambient',
    baseCostCents: 145,
    baseSellCents: 225,
    expirationDays: 25,
    popularity: 6,
  },
  // Despensa
  {
    id: 'pasta',
    name: 'Pasta 500g',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 55,
    baseSellCents: 92,
    expirationDays: null,
    popularity: 8,
  },
  {
    id: 'arroz',
    name: 'Arroz 1kg',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 92,
    baseSellCents: 145,
    expirationDays: null,
    popularity: 7,
  },
  {
    id: 'aceite',
    name: 'Aceite de oliva 1L',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 420,
    baseSellCents: 599,
    expirationDays: null,
    popularity: 5,
  },
  {
    id: 'huevos',
    name: 'Huevos docena',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 155,
    baseSellCents: 235,
    expirationDays: 21,
    popularity: 8,
  },
  {
    id: 'cafe',
    name: 'Café molido 250g',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 240,
    baseSellCents: 365,
    expirationDays: null,
    popularity: 5,
  },
  {
    id: 'chocolate',
    name: 'Chocolate 100g',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 88,
    baseSellCents: 140,
    expirationDays: 240,
    popularity: 5,
  },
  // Bebidas
  {
    id: 'agua',
    name: 'Agua 6x1.5L',
    category: 'bebidas',
    storage: 'ambient',
    baseCostCents: 135,
    baseSellCents: 210,
    expirationDays: null,
    popularity: 9,
  },
  {
    id: 'refresco',
    name: 'Refresco cola 2L',
    category: 'bebidas',
    storage: 'ambient',
    baseCostCents: 105,
    baseSellCents: 169,
    expirationDays: null,
    popularity: 7,
  },
  {
    id: 'cerveza',
    name: 'Cerveza pack 6',
    category: 'bebidas',
    storage: 'ambient',
    baseCostCents: 265,
    baseSellCents: 399,
    expirationDays: 300,
    popularity: 6,
  },
  {
    id: 'vino',
    name: 'Vino tinto 75cl',
    category: 'bebidas',
    storage: 'ambient',
    baseCostCents: 310,
    baseSellCents: 495,
    expirationDays: null,
    popularity: 4,
  },
  // Congelados
  {
    id: 'pizza',
    name: 'Pizza congelada',
    category: 'congelados',
    storage: 'frozen',
    baseCostCents: 195,
    baseSellCents: 299,
    expirationDays: 180,
    popularity: 6,
  },
  {
    id: 'helado',
    name: 'Helado 1L',
    category: 'congelados',
    storage: 'frozen',
    baseCostCents: 225,
    baseSellCents: 345,
    expirationDays: 240,
    popularity: 5,
  },
  {
    id: 'verdura-cong',
    name: 'Verduras congeladas 1kg',
    category: 'congelados',
    storage: 'frozen',
    baseCostCents: 148,
    baseSellCents: 229,
    expirationDays: 360,
    popularity: 4,
  },
  {
    id: 'pescado-cong',
    name: 'Merluza congelada 500g',
    category: 'congelados',
    storage: 'frozen',
    baseCostCents: 340,
    baseSellCents: 495,
    expirationDays: 270,
    popularity: 4,
  },
  // Higiene y hogar
  {
    id: 'papel',
    name: 'Papel higiénico x12',
    category: 'higiene',
    storage: 'ambient',
    baseCostCents: 320,
    baseSellCents: 469,
    expirationDays: null,
    popularity: 6,
  },
  {
    id: 'detergente',
    name: 'Detergente 3L',
    category: 'higiene',
    storage: 'ambient',
    baseCostCents: 465,
    baseSellCents: 675,
    expirationDays: null,
    popularity: 4,
  },
  {
    id: 'champu',
    name: 'Champú 400ml',
    category: 'higiene',
    storage: 'ambient',
    baseCostCents: 185,
    baseSellCents: 289,
    expirationDays: null,
    popularity: 4,
  },
];

export const PRODUCT_MAP: Record<string, ProductDef> = Object.fromEntries(
  PRODUCTS.map((p) => [p.id, p]),
);

export function productDef(id: string): ProductDef {
  const def = PRODUCT_MAP[id];
  if (!def) throw new Error(`Producto desconocido: ${id}`);
  return def;
}
