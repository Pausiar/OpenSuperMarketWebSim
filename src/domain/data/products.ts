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
    baseSellCents: 109,
    expirationDays: 9,
    popularity: 10,
  },
  {
    id: 'yogur',
    name: 'Yogur natural x4',
    category: 'lacteos',
    storage: 'chilled',
    baseCostCents: 85,
    baseSellCents: 155,
    expirationDays: 14,
    popularity: 7,
  },
  {
    id: 'queso',
    name: 'Queso curado 250g',
    category: 'lacteos',
    storage: 'chilled',
    baseCostCents: 210,
    baseSellCents: 368,
    expirationDays: 30,
    popularity: 5,
  },
  {
    id: 'mantequilla',
    name: 'Mantequilla 250g',
    category: 'lacteos',
    storage: 'chilled',
    baseCostCents: 140,
    baseSellCents: 247,
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
    baseSellCents: 483,
    expirationDays: 4,
    popularity: 8,
  },
  {
    id: 'picada',
    name: 'Carne picada 400g',
    category: 'carne',
    storage: 'chilled',
    baseCostCents: 260,
    baseSellCents: 454,
    expirationDays: 4,
    popularity: 6,
  },
  {
    id: 'jamon',
    name: 'Jamón cocido 200g',
    category: 'carne',
    storage: 'chilled',
    baseCostCents: 165,
    baseSellCents: 288,
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
    baseSellCents: 75,
    expirationDays: 2,
    popularity: 12,
  },
  {
    id: 'galletas',
    name: 'Galletas María',
    category: 'panaderia',
    storage: 'ambient',
    baseCostCents: 78,
    baseSellCents: 144,
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
    baseSellCents: 206,
    expirationDays: 8,
    popularity: 7,
  },
  {
    id: 'platanos',
    name: 'Plátanos 1kg',
    category: 'frutaverdura',
    storage: 'ambient',
    baseCostCents: 95,
    baseSellCents: 178,
    expirationDays: 5,
    popularity: 8,
  },
  {
    id: 'tomates',
    name: 'Tomates 1kg',
    category: 'frutaverdura',
    storage: 'ambient',
    baseCostCents: 120,
    baseSellCents: 224,
    expirationDays: 6,
    popularity: 6,
  },
  {
    id: 'patatas',
    name: 'Patatas 2kg',
    category: 'frutaverdura',
    storage: 'ambient',
    baseCostCents: 145,
    baseSellCents: 259,
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
    baseSellCents: 106,
    expirationDays: null,
    popularity: 8,
  },
  {
    id: 'arroz',
    name: 'Arroz 1kg',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 92,
    baseSellCents: 167,
    expirationDays: null,
    popularity: 7,
  },
  {
    id: 'aceite',
    name: 'Aceite de oliva 1L',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 420,
    baseSellCents: 689,
    expirationDays: null,
    popularity: 5,
  },
  {
    id: 'huevos',
    name: 'Huevos docena',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 155,
    baseSellCents: 270,
    expirationDays: 21,
    popularity: 8,
  },
  {
    id: 'cafe',
    name: 'Café molido 250g',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 240,
    baseSellCents: 420,
    expirationDays: null,
    popularity: 5,
  },
  {
    id: 'chocolate',
    name: 'Chocolate 100g',
    category: 'despensa',
    storage: 'ambient',
    baseCostCents: 88,
    baseSellCents: 161,
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
    baseSellCents: 241,
    expirationDays: null,
    popularity: 9,
  },
  {
    id: 'refresco',
    name: 'Refresco cola 2L',
    category: 'bebidas',
    storage: 'ambient',
    baseCostCents: 105,
    baseSellCents: 194,
    expirationDays: null,
    popularity: 7,
  },
  {
    id: 'cerveza',
    name: 'Cerveza pack 6',
    category: 'bebidas',
    storage: 'ambient',
    baseCostCents: 265,
    baseSellCents: 459,
    expirationDays: 300,
    popularity: 6,
  },
  {
    id: 'vino',
    name: 'Vino tinto 75cl',
    category: 'bebidas',
    storage: 'ambient',
    baseCostCents: 310,
    baseSellCents: 569,
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
    baseSellCents: 344,
    expirationDays: 180,
    popularity: 6,
  },
  {
    id: 'helado',
    name: 'Helado 1L',
    category: 'congelados',
    storage: 'frozen',
    baseCostCents: 225,
    baseSellCents: 397,
    expirationDays: 240,
    popularity: 5,
  },
  {
    id: 'verdura-cong',
    name: 'Verduras congeladas 1kg',
    category: 'congelados',
    storage: 'frozen',
    baseCostCents: 148,
    baseSellCents: 263,
    expirationDays: 360,
    popularity: 4,
  },
  {
    id: 'pescado-cong',
    name: 'Merluza congelada 500g',
    category: 'congelados',
    storage: 'frozen',
    baseCostCents: 340,
    baseSellCents: 569,
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
    baseSellCents: 539,
    expirationDays: null,
    popularity: 6,
  },
  {
    id: 'detergente',
    name: 'Detergente 3L',
    category: 'higiene',
    storage: 'ambient',
    baseCostCents: 465,
    baseSellCents: 776,
    expirationDays: null,
    popularity: 4,
  },
  {
    id: 'champu',
    name: 'Champú 400ml',
    category: 'higiene',
    storage: 'ambient',
    baseCostCents: 185,
    baseSellCents: 332,
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
