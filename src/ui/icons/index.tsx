import type { ComponentType, ReactNode, SVGAttributes } from 'react';
import type { ScreenId } from '../../state/gameStore';

/**
 * Conjunto de iconos SVG propio. Todo es trazo (stroke) con currentColor,
 * viewBox 24x24, trazo de 2px y extremos/uniones redondeados.
 */

export interface IconProps extends Omit<SVGAttributes<SVGSVGElement>, 'children' | 'title'> {
  /** Lado en px (ancho y alto). Por defecto 20. */
  size?: number;
  /** Si se indica, el icono se expone como imagen accesible (role="img"). */
  title?: string;
}

interface IconBaseProps extends IconProps {
  children: ReactNode;
}

/** Base compartida por todos los iconos. */
export function Icon({ size = 20, title, children, ...rest }: IconBaseProps) {
  const a11y = title
    ? { role: 'img' as const, 'aria-label': title }
    : { 'aria-hidden': true as const, focusable: false as const };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...a11y}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
  );
}

export function FinanceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
      <path d="M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </Icon>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12V4.5A1.5 1.5 0 0 1 4.5 3H12l8.4 8.4a1.5 1.5 0 0 1 0 2.1l-6.8 6.8a1.5 1.5 0 0 1-2.1 0L3 12z" />
      <circle cx="7.5" cy="7.5" r="1.25" />
    </Icon>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </Icon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="1.5" y="6" width="12" height="10" rx="1.5" />
      <path d="M13.5 10h4l3 3.2V16h-7" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Icon>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18.5 14.7c2 .9 3 2.9 3 5.3" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </Icon>
  );
}

export function StoreIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4h18l1 6H2l1-6z" />
      <path d="M4 10v10h16V10" />
      <path d="M10 20v-5h4v5" />
    </Icon>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 5-6" />
    </Icon>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2.5l1.7 2.6 3.1-.6.6 3.1 2.6 1.7-1.5 2.8 1.5 2.8-2.6 1.7-.6 3.1-3.1-.6L12 21.5l-1.7-2.6-3.1.6-.6-3.1-2.6-1.7 1.5-2.8-1.5-2.8 2.6-1.7.6-3.1 3.1.6z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2 3h3l2.6 11.2a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </Icon>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </Icon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6.5 4.8v14.4a1 1 0 0 0 1.5.86l11.5-7.2a1 1 0 0 0 0-1.72L8 3.94a1 1 0 0 0-1.5.86z" />
    </Icon>
  );
}

export function FastForwardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 5.5v13a1 1 0 0 0 1.6.8l7-6.5a1 1 0 0 0 0-1.6l-7-6.5a1 1 0 0 0-1.6.8z" />
      <path d="M12.5 5.5v13a1 1 0 0 0 1.6.8l7-6.5a1 1 0 0 0 0-1.6l-7-6.5a1 1 0 0 0-1.6.8z" />
    </Icon>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13 2.5L4.5 13.5H11L10 21.5l8.5-11H12l1-8z" />
    </Icon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12.5l5 5L20 6.5" />
    </Icon>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Icon>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.3 4.2L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17.5v.01" />
    </Icon>
  );
}

export function BlockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </Icon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Icon>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Icon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </Icon>
  );
}

/** Icono por pantalla, indexado por ScreenId de src/state/gameStore.ts. */
export const ScreenIcons: Record<ScreenId, ComponentType<IconProps>> = {
  dashboard: DashboardIcon,
  finance: FinanceIcon,
  products: TagIcon,
  inventory: BoxIcon,
  suppliers: TruckIcon,
  employees: PeopleIcon,
  schedule: CalendarIcon,
  store: StoreIcon,
  reports: ChartIcon,
  settings: GearIcon,
};
