import { prisma } from '../config/database';
import { logger } from '../config/logger';

// ─────────────────────────────────────────────────────────
//  Appointment Service — ML Scheduling Optimization Stubs
// ─────────────────────────────────────────────────────────

const SLOT_DURATION_MINUTES = 30;
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 18;

class AppointmentService {
  /**
   * Get available time slots for a doctor on a given date
   */
  async getAvailableSlots(doctorId: string, date: Date): Promise<Array<{ time: string; available: boolean }>> {
    const dayStart = new Date(date);
    dayStart.setHours(WORK_START_HOUR, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    const booked = await prisma.appointment.findMany({
      where: {
        doctorId,
        scheduledAt: { gte: dayStart, lte: dayEnd },
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      select: { scheduledAt: true, duration: true },
    });

    const slots: Array<{ time: string; available: boolean }> = [];
    const current = new Date(dayStart);

    while (current < dayEnd) {
      const slotTime = current.toISOString();
      const isBooked = booked.some(b => {
        const start = b.scheduledAt.getTime();
        const end = start + b.duration * 60000;
        return current.getTime() >= start && current.getTime() < end;
      });

      slots.push({ time: slotTime, available: !isBooked });
      current.setMinutes(current.getMinutes() + SLOT_DURATION_MINUTES);
    }

    return slots;
  }

  /**
   * AI-powered schedule optimization
   * TODO: Implement ML model for workload balancing and peak detection
   */
  async getOptimizedSchedule(
    doctorId: string | undefined,
    date: string | undefined
  ): Promise<Record<string, unknown>> {
    logger.info(`[ML] Optimized schedule requested for doctor: ${doctorId}, date: ${date}`);

    // TODO: Replace with real ML optimization
    // - Detect peak hours from historical data
    // - Balance appointment distribution
    // - Predict no-show probability (classification model)
    // - Recommend optimal slot allocation

    const appointments = await prisma.appointment.findMany({
      where: doctorId ? { doctorId } : {},
      orderBy: { scheduledAt: 'asc' },
      take: 50,
    });

    return {
      appointments,
      optimization: {
        peakHours: ['09:00-11:00', '14:00-16:00'], // STUB
        recommendedBreaks: ['13:00-14:00'],         // STUB
        predictedNoShows: 2,                        // STUB
        utilizationRate: 0.78,                      // STUB
        note: '[STUB] ML optimization - va fi înlocuit cu model antrenat pe date istorice',
      },
    };
  }
}

export const appointmentService = new AppointmentService();
