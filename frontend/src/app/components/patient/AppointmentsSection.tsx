import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, Video, Star, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../../lib/auth';
import { appointmentsApi, authApi } from '../../../lib/services';
import { Appointment } from '../../../lib/types';

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

function statusBadge(status: Appointment['status']) {
  if (status === 'NO_SHOW' || status === 'CANCELLED') {
    return (
      <Badge className="bg-red-50 text-red-600 border-red-200 border">
        {status === 'NO_SHOW' ? 'Missed' : 'Cancelled'}
      </Badge>
    );
  }
  if (status === 'COMPLETED') {
    return <Badge className="bg-green-50 text-green-600 border-green-200 border">Finalized</Badge>;
  }
  return <Badge className="bg-blue-50 text-[#3A7BD5] border-blue-200 border">Upcoming</Badge>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function AppointmentsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Appointment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const profile = await authApi.profile();
        const patientId = profile.patientProfile?.id;
        if (!patientId) {
          if (!cancelled) setItems([]);
          return;
        }
        // Fetch a wider window so the frontend can group + sort.
        const res = await appointmentsApi.list({ patientId, page: 1, limit: 50 });

        // Group order: 0 = Upcoming (PENDING/CONFIRMED), 1 = Finalized (COMPLETED), 2 = Cancelled/No-show
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
          // Upcoming: soonest first (asc); Finalized/Cancelled: most recent first (desc)
          return ga === 0 ? ta - tb : tb - ta;
        });

        if (!cancelled) {
          setItems(sorted.slice(0, 5));
          setTotalCount(res.total);
        }
      } catch (e) {
        if (!cancelled) setError('Could not load appointments');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const hasMore = totalCount > items.length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Recent Appointments</h3>
        {totalCount > 0 && (
          <span className="text-sm text-gray-500">
            Showing {items.length} of {totalCount}
          </span>
        )}
      </div>

      {loading && <p className="text-sm text-gray-500">Loading appointments...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-500 text-sm">
          No appointments yet. Book one to get started.
        </div>
      )}

      <div className="space-y-3">
        {items.map((appointment, index) => {
          const doctor = appointment.doctor;
          const initials = `${doctor?.firstName?.[0] ?? 'D'}${doctor?.lastName?.[0] ?? ''}`;
          const canReview = appointment.status === 'COMPLETED' && !appointment.review;
          const doctorName = `Dr. ${doctor?.firstName ?? ''} ${doctor?.lastName ?? ''}`.trim();
          return (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow border border-gray-100"
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
                      {appointment.doctor?.doctorProfile?.specialty && (
                        <p className="text-xs text-gray-500">{appointment.doctor.doctorProfile.specialty}</p>
                      )}
                      {appointment.reason && (
                        <p className="text-sm text-gray-500 mt-0.5">{appointment.reason}</p>
                      )}
                    </div>
                    {statusBadge(appointment.status)}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(appointment.scheduledAt)}</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(appointment.scheduledAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {appointment.roomNumber ? (
                        <>
                          <MapPin className="w-4 h-4" />
                          <span>Room {appointment.roomNumber}</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" />
                          <span>Online consultation</span>
                        </>
                      )}
                    </div>
                  </div>

                  {(canReview || appointment.review) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {canReview && appointment.doctor?.doctorProfile?.id && (
                        <Button
                          onClick={() =>
                            navigate(
                              `/patient/doctors/${appointment.doctor!.doctorProfile!.id}?reviewAppointmentId=${appointment.id}`
                            )
                          }
                          size="sm"
                          className="bg-gradient-to-r from-[#3A7BD5] to-[#4CAF50] hover:opacity-90 gap-1.5"
                        >
                          <Star className="w-4 h-4" />
                          Leave a review
                        </Button>
                      )}
                      {appointment.review && appointment.doctor?.doctorProfile?.id && (
                        <Link
                          to={`/patient/doctors/${appointment.doctor.doctorProfile.id}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#3A7BD5]"
                        >
                          <span className="text-xs text-gray-500">Your review:</span>
                          <StarRow rating={appointment.review.rating} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {hasMore && (
        <Link to="/patient/appointments" className="block">
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl border-gray-200 hover:bg-gray-50 gap-2 text-[#3A7BD5]"
          >
            See all appointments ({totalCount})
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      )}

    </motion.div>
  );
}
