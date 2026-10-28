import { onDutyAt } from '../domain/employees';
import { processDeliveries } from '../domain/orders';
import type { SimSystem } from './engine';

export const deliverySystem: SimSystem = {
  id: 'deliveries',

  onHour(ctx, hour) {
    if (hour !== 8) return;
    const warehouseOnDuty = onDutyAt(ctx.state, ctx.state.clock.timeMin).some(
      (e) => e.role === 'warehouse',
    );
    processDeliveries(ctx, warehouseOnDuty);
  },
};
