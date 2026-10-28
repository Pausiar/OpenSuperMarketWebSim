import { dayOf } from '../core/time';
import {
  BLACKOUT_AFTER_OVERDUE_DAYS,
  LATE_FEE_RATE,
  LOAN_OFFER_MAP,
  monthlyPaymentCents,
} from './data/loans';
import { newId, type GameState, type SimCtx } from './state';

export type TxKind = 'income' | 'expense';

export type TxCategory =
  | 'ventas'
  | 'proveedores'
  | 'salarios'
  | 'electricidad'
  | 'agua'
  | 'calefaccion'
  | 'alquiler'
  | 'impuestos'
  | 'prestamos'
  | 'marketing'
  | 'equipamiento'
  | 'mantenimiento'
  | 'multas'
  | 'ampliacion'
  | 'otros';

export const TX_CATEGORY_NAMES: Record<TxCategory, string> = {
  ventas: 'Ventas',
  proveedores: 'Proveedores',
  salarios: 'Salarios',
  electricidad: 'Electricidad',
  agua: 'Agua',
  calefaccion: 'Climatización',
  alquiler: 'Alquiler',
  impuestos: 'Impuestos',
  prestamos: 'Préstamos',
  marketing: 'Marketing',
  equipamiento: 'Equipamiento',
  mantenimiento: 'Mantenimiento',
  multas: 'Multas',
  ampliacion: 'Ampliación',
  otros: 'Otros',
};

export interface Transaction {
  id: string;
  kind: TxKind;
  category: TxCategory;
  amountCents: number;
  timeMin: number;
  description: string;
  reference?: string;
}

/**
 * Única puerta de entrada al dinero del jugador. Nunca se modifica el balance
 * directamente: toda operación queda registrada como transacción.
 */
export function record(
  state: GameState,
  tx: {
    kind: TxKind;
    category: TxCategory;
    amountCents: number;
    description: string;
    reference?: string;
  },
): Transaction {
  if (!Number.isFinite(tx.amountCents) || tx.amountCents < 0) {
    throw new Error(`Importe de transacción inválido: ${tx.amountCents}`);
  }
  const t: Transaction = { id: newId(state, 'tx'), timeMin: state.clock.timeMin, ...tx };
  state.ledger.balanceCents += t.kind === 'income' ? t.amountCents : -t.amountCents;
  state.ledger.transactions.push(t);
  if (state.ledger.transactions.length > 6000) state.ledger.transactions.splice(0, 1000);
  return t;
}

// ---------------- Facturas ----------------

export type BillStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';
export type BillCategory = 'electricidad' | 'agua' | 'calefaccion' | 'impuestos';

export interface Bill {
  id: string;
  category: BillCategory;
  label: string;
  periodLabel: string;
  lines: string[];
  totalCents: number;
  issuedDay: number;
  dueDay: number;
  status: BillStatus;
  lateFeeApplied: boolean;
}

export function createBill(
  state: GameState,
  bill: Omit<Bill, 'id' | 'status' | 'lateFeeApplied'>,
): Bill {
  const b: Bill = { id: newId(state, 'bill'), status: 'pending', lateFeeApplied: false, ...bill };
  state.bills.push(b);
  if (state.bills.length > 120) {
    // conserva las no resueltas y las 60 resueltas más recientes
    const open = state.bills.filter((x) => x.status === 'pending' || x.status === 'overdue');
    const closed = state.bills.filter((x) => x.status === 'paid' || x.status === 'cancelled');
    state.bills = [...closed.slice(-60), ...open];
  }
  return b;
}

export function payBill(ctx: SimCtx, billId: string): string | null {
  const { state } = ctx;
  const bill = state.bills.find((b) => b.id === billId);
  if (!bill) return 'Factura no encontrada.';
  if (bill.status !== 'pending' && bill.status !== 'overdue') return 'La factura ya está resuelta.';
  if (state.ledger.balanceCents < bill.totalCents)
    return 'Saldo insuficiente para pagar la factura.';
  record(state, {
    kind: 'expense',
    category: bill.category,
    amountCents: bill.totalCents,
    description: `${bill.label} (${bill.periodLabel})`,
    reference: bill.id,
  });
  bill.status = 'paid';
  if (bill.category === 'electricidad' && state.flags.blackout) {
    const stillOverdue = state.bills.some(
      (b) => b.category === 'electricidad' && b.status === 'overdue',
    );
    if (!stillOverdue) {
      state.flags.blackout = false;
      ctx.notify('info', 'Suministro eléctrico restablecido.');
    }
  }
  return null;
}

/** Se ejecuta al inicio de cada día: vencimientos, recargos y corte de luz. */
export function processBillsDaily(ctx: SimCtx): void {
  const { state } = ctx;
  const today = dayOf(state.clock.timeMin);
  for (const bill of state.bills) {
    if (bill.status === 'pending' && today > bill.dueDay) {
      bill.status = 'overdue';
      if (!bill.lateFeeApplied) {
        bill.totalCents = Math.round(bill.totalCents * (1 + LATE_FEE_RATE));
        bill.lateFeeApplied = true;
      }
      ctx.notify(
        'warn',
        `Factura vencida: ${bill.label} (${bill.periodLabel}). Recargo del 5% aplicado.`,
      );
    }
    if (
      bill.status === 'overdue' &&
      bill.category === 'electricidad' &&
      today - bill.dueDay >= BLACKOUT_AFTER_OVERDUE_DAYS &&
      !state.flags.blackout
    ) {
      state.flags.blackout = true;
      ctx.notify(
        'error',
        'Corte de suministro eléctrico por impago. El supermercado no puede abrir hasta pagar la factura.',
      );
    }
  }
}

// ---------------- Préstamos ----------------

export interface Loan {
  id: string;
  offerId: string;
  name: string;
  principalCents: number;
  monthlyCents: number;
  remainingMonths: number;
  startedDay: number;
}

export function takeLoan(ctx: SimCtx, offerId: string): string | null {
  const { state } = ctx;
  const offer = LOAN_OFFER_MAP[offerId];
  if (!offer) return 'Oferta de préstamo desconocida.';
  if (state.loans.length >= 2) return 'No puedes tener más de 2 préstamos activos.';
  if (state.loans.some((l) => l.offerId === offerId)) return 'Ya tienes un préstamo de este tipo.';
  const loan: Loan = {
    id: newId(state, 'loan'),
    offerId,
    name: offer.name,
    principalCents: offer.principalCents,
    monthlyCents: monthlyPaymentCents(offer),
    remainingMonths: offer.months,
    startedDay: dayOf(state.clock.timeMin),
  };
  state.loans.push(loan);
  record(state, {
    kind: 'income',
    category: 'prestamos',
    amountCents: offer.principalCents,
    description: `Concesión de ${offer.name}`,
    reference: loan.id,
  });
  ctx.notify(
    'info',
    `${offer.name} concedido: cuota mensual de ${(loan.monthlyCents / 100).toFixed(2)} €.`,
  );
  return null;
}

/** Cobro de cuotas al inicio de mes. El banco cobra aunque deje el saldo en negativo. */
export function processLoansMonthly(ctx: SimCtx): void {
  const { state } = ctx;
  for (const loan of [...state.loans]) {
    record(state, {
      kind: 'expense',
      category: 'prestamos',
      amountCents: loan.monthlyCents,
      description: `Cuota de ${loan.name} (${loan.remainingMonths} restantes)`,
      reference: loan.id,
    });
    loan.remainingMonths -= 1;
    if (loan.remainingMonths <= 0) {
      state.loans = state.loans.filter((l) => l.id !== loan.id);
      ctx.notify('info', `${loan.name} amortizado por completo.`);
    }
  }
}

export function repayLoanEarly(ctx: SimCtx, loanId: string): string | null {
  const { state } = ctx;
  const loan = state.loans.find((l) => l.id === loanId);
  if (!loan) return 'Préstamo no encontrado.';
  const cost = Math.round(loan.monthlyCents * loan.remainingMonths * 0.97);
  if (state.ledger.balanceCents < cost) return 'Saldo insuficiente para amortizar el préstamo.';
  record(state, {
    kind: 'expense',
    category: 'prestamos',
    amountCents: cost,
    description: `Amortización anticipada de ${loan.name}`,
    reference: loan.id,
  });
  state.loans = state.loans.filter((l) => l.id !== loanId);
  ctx.notify('info', `${loan.name} amortizado anticipadamente.`);
  return null;
}
