import { prisma } from '../config/database';
import { env } from '../config/env';
import { appointmentService } from './appointment.service';

// A discounted off-peak slot the AI assistant can proactively offer a patient,
// to help fill a gap in a doctor's schedule.
export interface GapOffer {
  doctorId: string; // User.id of the doctor (what booking expects as doctorId)
  doctorName: string;
  specialty: string;
  slot: string; // ISO datetime of the open late slot
  durationMin: number;
  currency: string;
  originalFee: number;
  discountPct: number;
  discountedFee: number;
}

// Next working day (skip Saturday/Sunday), at local midnight.
function nextWorkingDay(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

// Doctors to consider, in priority order: ones the patient has seen before
// (continuity of care), then any doctor accepting new patients.
async function candidateDoctorUserIds(patientProfileId: string): Promise<string[]> {
  const past = await prisma.appointment.findMany({
    where: { patientId: patientProfileId },
    orderBy: { scheduledAt: 'desc' },
    select: { doctorId: true },
    take: 20,
  });
  const ordered: string[] = [];
  for (const a of past) if (!ordered.includes(a.doctorId)) ordered.push(a.doctorId);

  const others = await prisma.doctorProfile.findMany({
    where: { acceptsNewPatients: true },
    select: { userId: true },
    take: 25,
  });
  for (const d of others) if (!ordered.includes(d.userId)) ordered.push(d.userId);

  return ordered;
}

/**
 * Find a discounted gap-fill offer for a patient: the earliest open slot at/after
 * SLOT_GAP_START_HOUR on the next working day, for the highest-priority doctor
 * who has such a gap. Returns null when discounts are disabled or no gap exists.
 */
export async function findGapOfferForPatient(patientProfileId: string): Promise<GapOffer | null> {
  const pct = env.SLOT_GAP_DISCOUNT_PCT;
  if (pct <= 0) return null;

  const day = nextWorkingDay(new Date());
  const candidates = await candidateDoctorUserIds(patientProfileId);

  for (const doctorUserId of candidates) {
    const slots = await appointmentService.getAvailableSlots(doctorUserId, day);
    const lateOpen = slots.find(
      (s) => s.available && new Date(s.time).getHours() >= env.SLOT_GAP_START_HOUR,
    );
    if (!lateOpen) continue;

    const doctor = await prisma.user.findUnique({
      where: { id: doctorUserId },
      select: {
        firstName: true,
        lastName: true,
        doctorProfile: { select: { specialty: true, consultationFee: true, currency: true } },
      },
    });
    if (!doctor?.doctorProfile) continue;

    const originalFee = doctor.doctorProfile.consultationFee;
    const discountedFee = Math.round(originalFee * (1 - pct / 100) * 100) / 100;

    return {
      doctorId: doctorUserId,
      doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      specialty: doctor.doctorProfile.specialty,
      slot: lateOpen.time,
      durationMin: 30,
      currency: doctor.doctorProfile.currency,
      originalFee,
      discountPct: pct,
      discountedFee,
    };
  }

  return null;
}
