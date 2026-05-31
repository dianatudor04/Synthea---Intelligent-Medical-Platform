import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Calendar, Clock, Stethoscope, Plus, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { useAuth } from '../../../lib/auth';
import { appointmentsApi, authApi } from '../../../lib/services';
import { Appointment } from '../../../lib/types';
import { BookAppointmentModal } from '../../components/patient/BookAppointmentModal';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function statusBadge(status: Appointment['status']) {
  if (status === 'CANCELLED' || status === 'NO_SHOW')
    return (
      <Badge className="bg-red-50 text-red-600 border-red-200 border">
        {status === 'NO_SHOW' ? 'Missed' : 'Cancelled'}
      </Badge>
    );
  if (status === 'COMPLETED')
    return <Badge className="bg-green-50 text-green-600 border-green-200 border">Finalized</Badge>;
  return <Badge className="bg-blue-50 text-[#3A7BD5] border-blue-200 border">Upcoming</Badge>;
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

export function PatientAppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBook, setShowBook] = useState(false);
  const [version, setVersion] = useState(0);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const profile = await authApi.profile();
        const patientId = profile.patientProfile?.id;
        if (!patientId) {
          if (!cancelled) setItems([]);
          return;
        }
        const res = await appointmentsApi.list({ patientId, page: 1, limit: 100 });

        // Same ordering as the home dashboard:
        // upcoming (soonest first) → finalized (most recent first) → cancelled/no-show.
        const groupOf = (s: Appointment['status']) => {
          if (s === 'PENDING' || s === 'CONFIRMED') return 0;
          if (s === 'COMPLETED') return 1;
          return 2;
        };
        const sorted = [...res.data].sort((a, b) => {
          const ga = groupOf(a.status);
          const gb = groupOf(b.status);
          if (ga !== gb) return ga - gb;
          const ta = new Date(a.scheduledAt).getTime();
          const tb = new Date(b.scheduledAt).getTime();
          return ga === 0 ? ta - tb : tb - ta;
        });

        if (!cancelled) setItems(sorted);
      } catch {
        if (!cancelled) setError('Could not load appointments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, version]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await appointmentsApi.cancel(id);
      setVersion((v) => v + 1);
    } catch {
      alert('Could not cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E6F0FA]/30 via-white to-[#E8F5E9]/30">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <button
            onClick={() => navigate('/patient')}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#3A7BD5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to dashboard
          </button>

          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-gray-600">Upcoming and past visits</p>
            </div>
            <Button
              onClick={() => setShowBook(true)}
              className="bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 gap-2"
            >
              <Plus className="w-4 h-4" />
              Book new
            </Button>
          </div>
        </motion.div>

        {loading && <p className="text-sm text-gray-500">Loading...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && items.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center text-gray-500">
            No appointments yet.
          </div>
        )}

        <div className="space-y-3">
          {items.map((appt) => {
            const initials = `${appt.doctor?.firstName?.[0] ?? 'D'}${appt.doctor?.lastName?.[0] ?? ''}`;
            const isUpcoming = appt.status === 'PENDING' || appt.status === 'CONFIRMED';
            const canReview = appt.status === 'COMPLETED' && !appt.review;
            const doctorName = `Dr. ${appt.doctor?.firstName ?? ''} ${appt.doctor?.lastName ?? ''}`.trim();

            return (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{doctorName}</h4>
                        {appt.doctor?.doctorProfile?.specialty && (
                          <p className="text-xs text-gray-500">{appt.doctor.doctorProfile.specialty}</p>
                        )}
                        {appt.reason && <p className="text-sm text-gray-500 mt-1">{appt.reason}</p>}
                      </div>
                      {statusBadge(appt.status)}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(appt.scheduledAt)}</span>
                        <span>•</span>
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(appt.scheduledAt)}</span>
                      </div>
                      {appt.feeAtBooking && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Stethoscope className="w-4 h-4" />
                          <span>Fee: {appt.feeAtBooking} RON</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {isUpcoming && (
                        <Button
                          onClick={() => handleCancel(appt.id)}
                          disabled={cancellingId === appt.id}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {cancellingId === appt.id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                      {canReview && appt.doctor?.doctorProfile?.id && (
                        <Button
                          onClick={() =>
                            navigate(
                              `/patient/doctors/${appt.doctor!.doctorProfile!.id}?reviewAppointmentId=${appt.id}`
                            )
                          }
                          size="sm"
                          className="bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 gap-1.5"
                        >
                          <Star className="w-4 h-4" />
                          Leave a review
                        </Button>
                      )}
                      {appt.review && appt.doctor?.doctorProfile?.id && (
                        <Link
                          to={`/patient/doctors/${appt.doctor.doctorProfile.id}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#3A7BD5]"
                        >
                          <span className="text-xs text-gray-500">Your review:</span>
                          <StarRow rating={appt.review.rating} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <BookAppointmentModal
        isOpen={showBook}
        onClose={() => setShowBook(false)}
        onBooked={() => setVersion((v) => v + 1)}
      />
    </div>
  );
}
