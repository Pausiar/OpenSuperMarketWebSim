export type Role = 'cashier' | 'stocker' | 'cleaner' | 'security' | 'warehouse' | 'manager';

export interface RoleDef {
  id: Role;
  name: string;
  /** Salario mensual base en céntimos para experiencia media. */
  baseSalaryCents: number;
  description: string;
}

export const ROLES: RoleDef[] = [
  {
    id: 'cashier',
    name: 'Cajero/a',
    baseSalaryCents: 132_000,
    description: 'Atiende las cajas. Sin cajeros no hay ventas.',
  },
  {
    id: 'stocker',
    name: 'Reponedor/a',
    baseSalaryCents: 126_000,
    description: 'Repone estanterías. Mejora la disponibilidad de producto.',
  },
  {
    id: 'cleaner',
    name: 'Limpieza',
    baseSalaryCents: 116_000,
    description: 'Mantiene la limpieza. Afecta a la satisfacción y a inspecciones.',
  },
  {
    id: 'security',
    name: 'Seguridad',
    baseSalaryCents: 142_000,
    description: 'Reduce robos y pérdidas desconocidas.',
  },
  {
    id: 'warehouse',
    name: 'Almacén',
    baseSalaryCents: 128_000,
    description: 'Gestiona recepciones. Evita daños en las entregas.',
  },
  {
    id: 'manager',
    name: 'Encargado/a',
    baseSalaryCents: 195_000,
    description: 'Mejora productividad y motivación del equipo en su turno.',
  },
];

export const ROLE_MAP: Record<Role, RoleDef> = Object.fromEntries(
  ROLES.map((r) => [r.id, r]),
) as Record<Role, RoleDef>;
