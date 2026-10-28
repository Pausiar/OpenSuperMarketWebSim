const moneyFmt = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

export function money(cents: number): string {
  return moneyFmt.format(cents / 100);
}

export function pct(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function num(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value);
}

/** Margen bruto sobre el precio de venta. */
export function marginPct(costCents: number, sellCents: number): number {
  if (sellCents <= 0) return 0;
  return ((sellCents - costCents) / sellCents) * 100;
}
