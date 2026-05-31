import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  User,
  ChevronRight,
  ChevronDown,
  Star,
  Stethoscope,
  Heart,
  Brain,
  Eye,
  Baby,
  Sparkles,
  Bone,
  Wind,
  Activity,
  AlertCircle,
  Droplet,
  Scissors,
  ScanLine,
  Shield,
  Users,
  Search,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Calendar as CalendarPicker } from '../ui/calendar';
import { useAuth } from '../../../lib/auth';
import { appointmentsApi, doctorsApi, authApi, reviewsApi, servicesApi } from '../../../lib/services';
import { ApiRequestError } from '../../../lib/api';
import { DoctorProfile, AvailableSlot, Review, MedicalService } from '../../../lib/types';

interface BookAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBooked?: () => void;
}

// ─── Specialty UI ────────────────────────────────────────────────────
const SPECIALTY_ICON: Record<string, typeof Stethoscope> = {
  Cardiologie: Heart,
  Neurologie: Brain,
  Oftalmologie: Eye,
  Pediatrie: Baby,
  Dermatologie: Sparkles,
  Ortopedie: Bone,
  Pneumologie: Wind,
  Reumatologie: Activity,
  Nefrologie: Droplet,
  Hematologie: Droplet,
  Alergologie: AlertCircle,
  'Chirurgie Generală': Scissors,
  'Chirurgie Plastică': Scissors,
  Radiologie: ScanLine,
  'Medicină de Urgență': AlertCircle,
  'Boli Infecțioase': Shield,
  Geriatrie: Users,
};

function iconFor(specialty: string) {
  return SPECIALTY_ICON[specialty] || Stethoscope;
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          width={size}
          height={size}
          className={n <= filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

type Step = 1 | 2 | 3 | 4;

// ─── Component ───────────────────────────────────────────────────────
export function BookAppointmentModal({ isOpen, onClose, onBooked }: BookAppointmentModalProps) {
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [specialtySearch, setSpecialtySearch] = useState('');

  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const [services, setServices] = useState<MedicalService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [selectedService, setSelectedService] = useState<MedicalService | null>(null);

  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [expandedDoctorId, setExpandedDoctorId] = useState<string | null>(null);
  const [reviewsByDoctor, setReviewsByDoctor] = useState<Record<string, Review[]>>({});
  const [reviewsLoadingFor, setReviewsLoadingFor] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bounds for the calendar: tomorrow → 60 days out, weekdays only
  const calendarBounds = useMemo(() => {
    const min = new Date();
    min.setDate(min.getDate() + 1);
    min.setHours(0, 0, 0, 0);
    const max = new Date();
    max.setDate(max.getDate() + 60);
    max.setHours(23, 59, 59, 999);
    return { min, max };
  }, []);

  // Load all doctors when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setDoctorsLoading(true);
    setError(null);
    doctorsApi
      .list({ acceptsNewPatients: true, page: 1, limit: 200 })
      .then((res) => setDoctors(res.data))
      .catch(() => setError('Could not load doctors'))
      .finally(() => setDoctorsLoading(false));
  }, [isOpen]);

  // When a specialty is picked, load its services
  useEffect(() => {
    if (!selectedSpecialty) {
      setServices([]);
      return;
    }
    setServicesLoading(true);
    servicesApi
      .list({ specialty: selectedSpecialty })
      .then((res) => setServices(res.data))
      .catch(() => setServices([]))
      .finally(() => setServicesLoading(false));
  }, [selectedSpecialty]);

  // Slots for selected doctor + date
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setSlots([]);
      return;
    }
    setSelectedSlot(''); // changing date invalidates the previously chosen slot
    setSlotsLoading(true);
    appointmentsApi
      .availableSlots(selectedDoctor.userId, selectedDate)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedDoctor, selectedDate]);

  // Distinct specialties + count, filtered by search
  const specialties = useMemo(() => {
    const map = new Map<string, { count: number; topRating: number }>();
    for (const d of doctors) {
      const entry = map.get(d.specialty) ?? { count: 0, topRating: 0 };
      entry.count += 1;
      if ((d.avgRating ?? 0) > entry.topRating) entry.topRating = d.avgRating ?? 0;
      map.set(d.specialty, entry);
    }
    let list = Array.from(map.entries())
      .map(([name, info]) => ({ name, ...info }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const q = specialtySearch.trim().toLowerCase();
    if (q) list = list.filter((s) => s.name.toLowerCase().includes(q));
    return list;
  }, [doctors, specialtySearch]);

  const doctorsInSpecialty = useMemo(
    () => (selectedSpecialty ? doctors.filter((d) => d.specialty === selectedSpecialty) : []),
    [doctors, selectedSpecialty]
  );

  const reset = () => {
    setStep(1);
    setSpecialtySearch('');
    setSelectedSpecialty(null);
    setSelectedService(null);
    setServices([]);
    setSelectedDoctor(null);
    setExpandedDoctorId(null);
    setSelectedDate('');
    setSelectedSlot('');
    setReason('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const toggleExpanded = async (doctor: DoctorProfile) => {
    if (expandedDoctorId === doctor.id) {
      setExpandedDoctorId(null);
      return;
    }
    setExpandedDoctorId(doctor.id);
    if (!reviewsByDoctor[doctor.id]) {
      setReviewsLoadingFor(doctor.id);
      try {
        const res = await reviewsApi.byDoctor(doctor.id, { page: 1, limit: 20 });
        setReviewsByDoctor((prev) => ({ ...prev, [doctor.id]: res.data }));
      } catch {
        setReviewsByDoctor((prev) => ({ ...prev, [doctor.id]: [] }));
      } finally {
        setReviewsLoadingFor(null);
      }
    }
  };

  const handleBooking = async () => {
    if (!selectedDoctor || !selectedSlot || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const profile = await authApi.profile();
      const patientId = profile.patientProfile?.id;
      if (!patientId) {
        setError('Please complete your patient profile first.');
        setSubmitting(false);
        return;
      }
      await appointmentsApi.create({
        patientId,
        doctorId: selectedDoctor.userId,
        serviceId: selectedService?.id,
        scheduledAt: selectedSlot,
        duration: selectedService?.durationMin,
        reason: reason || undefined,
      });
      onBooked?.();
      handleClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Book Appointment</h2>
                <p className="text-white/80 text-sm mt-1">Step {step} of 4</p>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

              {/* ── Step 1: pick specialty ─────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Choose a specialty</h3>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search specialties..."
                      value={specialtySearch}
                      onChange={(e) => setSpecialtySearch(e.target.value)}
                      className="pl-10 rounded-xl border-gray-200"
                    />
                  </div>

                  {doctorsLoading && <p className="text-sm text-gray-500">Loading specialties...</p>}
                  {!doctorsLoading && specialties.length === 0 && (
                    <p className="text-sm text-gray-500">
                      {specialtySearch ? `No specialties match "${specialtySearch}".` : 'No specialties available right now.'}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {specialties.map((spec) => {
                      const Icon = iconFor(spec.name);
                      return (
                        <button
                          key={spec.name}
                          onClick={() => {
                            setSelectedSpecialty(spec.name);
                            setStep(2);
                          }}
                          className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 hover:border-[#3A7BD5] hover:bg-[#E6F0FA]/30 transition-all text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E6F0FA] to-[#E8F5E9] flex items-center justify-center">
                            <Icon className="w-6 h-6 text-[#3A7BD5]" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{spec.name}</p>
                            <p className="text-xs text-gray-500">
                              {spec.count} {spec.count === 1 ? 'doctor' : 'doctors'}
                              {spec.topRating > 0 && ` • top ★ ${spec.topRating.toFixed(1)}`}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 2: pick service ───────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setStep(1);
                      setSelectedService(null);
                    }}
                    className="text-[#3A7BD5] text-sm flex items-center gap-1"
                  >
                    ← Back to specialties
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900">Choose the type of service</h3>
                    <p className="text-xs text-gray-500">Specialty: {selectedSpecialty}</p>
                  </div>

                  {servicesLoading && <p className="text-sm text-gray-500">Loading services...</p>}
                  {!servicesLoading && services.length === 0 && (
                    <p className="text-sm text-gray-500">No services published for this specialty yet.</p>
                  )}

                  <div className="space-y-2">
                    {services.map((svc) => {
                      const isSelected = selectedService?.id === svc.id;
                      return (
                        <button
                          key={svc.id}
                          onClick={() => {
                            setSelectedService(svc);
                            setStep(3);
                          }}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                            isSelected
                              ? 'border-[#3A7BD5] bg-[#E6F0FA]'
                              : 'border-gray-200 hover:border-[#3A7BD5] hover:bg-[#E6F0FA]/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900">{svc.name}</h4>
                              {svc.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{svc.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {svc.durationMin} min
                                </span>
                                <span className="font-medium text-gray-700">
                                  {svc.basePrice} RON
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 3: pick doctor ────────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setStep(2);
                      setExpandedDoctorId(null);
                    }}
                    className="text-[#3A7BD5] text-sm flex items-center gap-1"
                  >
                    ← Back to services
                  </button>

                  <div className="bg-[#E6F0FA]/40 rounded-xl p-3 text-sm">
                    <p className="font-medium text-gray-800">{selectedSpecialty} · {selectedService?.name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selectedService?.durationMin} min · {selectedService?.basePrice} RON
                    </p>
                  </div>

                  <h3 className="font-semibold text-gray-900">
                    Choose a doctor ({doctorsInSpecialty.length})
                  </h3>

                  {doctorsInSpecialty.length === 0 && (
                    <p className="text-sm text-gray-500">No doctors available in this specialty.</p>
                  )}

                  <div className="space-y-3">
                    {doctorsInSpecialty.map((doctor) => {
                      const initials = `${doctor.user?.firstName?.[0] ?? 'D'}${doctor.user?.lastName?.[0] ?? ''}`;
                      const isExpanded = expandedDoctorId === doctor.id;
                      const reviews = reviewsByDoctor[doctor.id];
                      const isLoadingReviews = reviewsLoadingFor === doctor.id;

                      return (
                        <div
                          key={doctor.id}
                          className="rounded-2xl border-2 border-gray-200 hover:border-[#3A7BD5] transition-all"
                        >
                          <div className="p-4 flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900">
                                Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{doctor.specialty}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                {doctor.avgRating ? (
                                  <span className="flex items-center gap-1">
                                    <StarRow rating={doctor.avgRating} />
                                    <span className="font-medium text-gray-700">{doctor.avgRating.toFixed(1)}</span>
                                    <span>({doctor.totalReviews})</span>
                                  </span>
                                ) : (
                                  <span className="text-gray-400">No reviews yet</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <Button
                                onClick={() => {
                                  setSelectedDoctor(doctor);
                                  setStep(4);
                                }}
                                size="sm"
                                className="bg-[#3A7BD5] hover:bg-[#2E6BC4]"
                              >
                                Select
                              </Button>
                              <button
                                onClick={() => toggleExpanded(doctor)}
                                className="text-xs text-[#3A7BD5] hover:underline flex items-center gap-1"
                              >
                                See more
                                <ChevronDown
                                  className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                              </button>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-4">
                                  {doctor.bio && <p className="text-sm text-gray-600">{doctor.bio}</p>}
                                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    {doctor.yearsOfExperience !== null && doctor.yearsOfExperience !== undefined && (
                                      <div>
                                        <span className="text-gray-400">Experience:</span>{' '}
                                        <span className="font-medium text-gray-800">{doctor.yearsOfExperience} years</span>
                                      </div>
                                    )}
                                    {doctor.languages?.length > 0 && (
                                      <div>
                                        <span className="text-gray-400">Languages:</span>{' '}
                                        <span className="font-medium text-gray-800">{doctor.languages.join(', ')}</span>
                                      </div>
                                    )}
                                    {doctor.clinicAddress && (
                                      <div className="col-span-2">
                                        <span className="text-gray-400">Clinic:</span>{' '}
                                        <span className="font-medium text-gray-800">{doctor.clinicAddress}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div>
                                    <p className="text-sm font-semibold text-gray-800 mb-2">Patient reviews</p>
                                    {isLoadingReviews && <p className="text-xs text-gray-500">Loading reviews...</p>}
                                    {!isLoadingReviews && reviews && reviews.length === 0 && (
                                      <p className="text-xs text-gray-500">No reviews yet.</p>
                                    )}
                                    <div className="space-y-2 max-h-56 overflow-y-auto">
                                      {(reviews ?? []).map((review) => {
                                        const patientName = review.patient?.user
                                          ? `${review.patient.user.firstName} ${review.patient.user.lastName.charAt(0)}.`
                                          : 'Anonymous';
                                        return (
                                          <div key={review.id} className="bg-gray-50 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-medium text-gray-700">{patientName}</span>
                                              <StarRow rating={review.rating} />
                                            </div>
                                            {review.comment && (
                                              <p className="text-xs text-gray-600">{review.comment}</p>
                                            )}
                                            <p className="text-[10px] text-gray-400 mt-1">
                                              {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Step 4: pick date + time + confirm ─────────────────── */}
              {step === 4 && selectedDoctor && (
                <div className="space-y-5">
                  <button
                    onClick={() => setStep(3)}
                    className="text-[#3A7BD5] text-sm flex items-center gap-1"
                  >
                    ← Back to doctors
                  </button>

                  <div className="bg-[#E6F0FA]/40 rounded-xl p-3 text-sm">
                    <p className="font-medium text-gray-800">
                      Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName} · {selectedService?.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selectedService?.durationMin} min · {selectedService?.basePrice} RON
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Pick a date</h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Click a day to see its slots. Click another to compare.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-[auto,1fr] gap-4 items-start">
                      {/* ── Left: Calendar ─────────────────────── */}
                      <div className="border border-gray-200 rounded-2xl p-2 bg-gray-50/50 self-start">
                        <CalendarPicker
                          mode="single"
                          selected={selectedDate ? new Date(`${selectedDate}T00:00:00`) : undefined}
                          onSelect={(d) => {
                            if (!d) return;
                            setSelectedDate(d.toLocaleDateString('sv-SE'));
                          }}
                          disabled={(date) => {
                            const day = date.getDay();
                            if (day === 0 || day === 6) return true;
                            if (date < calendarBounds.min) return true;
                            if (date > calendarBounds.max) return true;
                            return false;
                          }}
                          fromDate={calendarBounds.min}
                          toDate={calendarBounds.max}
                        />
                      </div>

                      {/* ── Right: Slots panel — same height as calendar, scrollable ─── */}
                      <div className="min-w-0 flex flex-col h-[316px]">
                        <div className="flex items-center justify-between mb-2 flex-shrink-0">
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {selectedDate
                              ? `Slots — ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}`
                              : 'Available slots'}
                          </h3>
                          {selectedSlot && (
                            <button
                              onClick={() => setSelectedSlot('')}
                              className="text-xs text-gray-500 hover:underline"
                            >
                              Clear time
                            </button>
                          )}
                        </div>

                        {!selectedDate && (
                          <div className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center text-sm text-gray-500 flex items-center justify-center">
                            Pick a date in the calendar to see available slots.
                          </div>
                        )}

                        {selectedDate && (
                          <motion.div
                            key={selectedDate}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className="flex-1 overflow-y-auto pr-1 border border-gray-100 rounded-2xl p-2 bg-white"
                          >
                            {slotsLoading && <p className="text-sm text-gray-500 p-2">Loading slots...</p>}
                            {!slotsLoading && slots.length === 0 && (
                              <p className="text-sm text-gray-500 p-2">No slots available on this date.</p>
                            )}
                            <div className="grid grid-cols-3 gap-2">
                              {slots.map((slot) => (
                                <button
                                  key={slot.time}
                                  onClick={() => slot.available && setSelectedSlot(slot.time)}
                                  disabled={!slot.available}
                                  className={`p-2.5 rounded-xl border-2 transition-all ${
                                    selectedSlot === slot.time
                                      ? 'border-[#3A7BD5] bg-[#E6F0FA]'
                                      : slot.available
                                      ? 'border-gray-200 hover:border-gray-300'
                                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                                  }`}
                                >
                                  <Clock className="w-3.5 h-3.5 text-[#3A7BD5] mb-1 mx-auto" />
                                  <p className="font-medium text-xs text-gray-900">{formatTime(slot.time)}</p>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Reason (optional)</h3>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Briefly describe what you'd like to discuss"
                      className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-[#3A7BD5] outline-none"
                      rows={2}
                    />
                  </div>

                  {selectedSlot && (
                    <div className="bg-[#E6F0FA] rounded-2xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Appointment Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#3A7BD5]" />
                          <span className="text-gray-600">
                            Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName} — {selectedDoctor.specialty}
                          </span>
                        </div>
                        {selectedService && (
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-[#3A7BD5]" />
                            <span className="text-gray-600">{selectedService.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-[#3A7BD5]" />
                          <span className="text-gray-600">
                            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#3A7BD5]" />
                          <span className="text-gray-600">
                            {formatTime(selectedSlot)} · {selectedService?.durationMin ?? 30} min
                          </span>
                        </div>
                        <div className="text-gray-700 font-medium pt-1">
                          Fee: {selectedService?.basePrice ?? selectedDoctor.consultationFee} {selectedDoctor.currency}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSlot && (
                    <Button
                      onClick={handleBooking}
                      disabled={submitting}
                      className="w-full h-12 bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 rounded-xl"
                    >
                      {submitting ? 'Booking...' : 'Confirm Appointment'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
