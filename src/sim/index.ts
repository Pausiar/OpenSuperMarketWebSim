import { accountingSystem } from './accountingSystem';
import { billingSystem } from './billingSystem';
import { customerSystem } from './customerSystem';
import { deliverySystem } from './deliverySystem';
import { employeeSystem } from './employeeSystem';
import { eventSystem } from './eventSystem';
import { inventorySystem } from './inventorySystem';
import { payrollSystem } from './payrollSystem';
import type { SimSystem } from './engine';

/**
 * Orden de ejecución (importa): el cierre contable archiva el día/mes ANTES de
 * que facturación use el informe mensual; los eventos se lanzan antes de
 * procesar vencimientos; las entregas llegan antes de que entren clientes.
 */
export function createSystems(): SimSystem[] {
  return [
    accountingSystem,
    employeeSystem,
    inventorySystem,
    eventSystem,
    billingSystem,
    payrollSystem,
    deliverySystem,
    customerSystem,
  ];
}

export { GameEngine } from './engine';
