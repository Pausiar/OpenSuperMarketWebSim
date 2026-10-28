export interface LoanOfferDef {
  id: string;
  name: string;
  principalCents: number;
  /** Interés anual simple. */
  annualRate: number;
  months: number;
}

export const LOAN_OFFERS: LoanOfferDef[] = [
  { id: 'micro', name: 'Microcrédito', principalCents: 1_000_000, annualRate: 0.06, months: 12 },
  { id: 'medio', name: 'Préstamo PYME', principalCents: 3_000_000, annualRate: 0.075, months: 24 },
  {
    id: 'grande',
    name: 'Préstamo expansión',
    principalCents: 8_000_000,
    annualRate: 0.09,
    months: 36,
  },
];

export const LOAN_OFFER_MAP: Record<string, LoanOfferDef> = Object.fromEntries(
  LOAN_OFFERS.map((l) => [l.id, l]),
);

/** Cuota mensual con interés simple sobre el principal. */
export function monthlyPaymentCents(offer: LoanOfferDef): number {
  const total = offer.principalCents * (1 + (offer.annualRate * offer.months) / 12);
  return Math.round(total / offer.months);
}

/** Tipo impositivo mensual sobre beneficios positivos. */
export const TAX_RATE = 0.15;
/** Precio base del kWh en céntimos. */
export const KWH_PRICE_CENTS = 19;
/** Recargo por factura vencida. */
export const LATE_FEE_RATE = 0.05;
/** Días de gracia antes del corte de luz por factura de electricidad vencida. */
export const BLACKOUT_AFTER_OVERDUE_DAYS = 7;
