import { processPayrollMonthly } from '../domain/employees';
import type { SimSystem } from './engine';

export const payrollSystem: SimSystem = {
  id: 'payroll',
  onMonthStart(ctx, monthAbs) {
    if (monthAbs === 0) return;
    processPayrollMonthly(ctx);
  },
};
