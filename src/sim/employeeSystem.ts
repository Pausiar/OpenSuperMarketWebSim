import { CLOSE_HOUR } from '../core/time';
import { dailyEmployeeUpkeep, onDutyAt, refreshApplicants } from '../domain/employees';
import type { SimSystem } from './engine';

export const employeeSystem: SimSystem = {
  id: 'employees',

  onDayStart(ctx, day) {
    dailyEmployeeUpkeep(ctx);
    // Nuevos candidatos cada lunes.
    if (day % 7 === 0) refreshApplicants(ctx.state, ctx.rng);
  },

  onHour(ctx, hour) {
    if (hour < 7 || hour >= CLOSE_HOUR) return;
    const onDuty = onDutyAt(ctx.state, ctx.state.clock.timeMin);
    const cleaners = onDuty.filter((e) => e.role === 'cleaner').length;
    if (cleaners > 0) {
      const s = ctx.state.store;
      s.cleanliness = Math.min(100, s.cleanliness + cleaners * 2);
    }
  },
};
