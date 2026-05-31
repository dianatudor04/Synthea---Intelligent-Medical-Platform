import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { useAuth } from '../../../lib/auth';
import { appointmentsApi, authApi } from '../../../lib/services';
import { Appointment } from '../../../lib/types';
import { Badge } from '../ui/badge';

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function statusBadge(status: Appointment['status']) {
  if (status === 'CANCELLED' || status === 'NO_SHOW') {
    return (
      <Badge className="bg-red-50 text-red-600 border-red-200 border text-xs">
        {status === 'NO_SHOW' ? 'Missed' : 'Cancelled'}
      </Badge>
    );
  }
  if (status === 'COMPLETED') {
    return <Badge className="bg-green-50 text-green-600 border-green-200 border text-xs">Finalized</Badge>;
  }
  return <Badge className="bg-blue-50 text-[#3A7BD5] border-blue-200 border text-xs">Upcoming</Badge>;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function CalendarSection() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      try {
        const profile = await authApi.profile();
        const patientId = profile.patientProfile?.id;
        if (!patientId) return;
        const res = await appointmentsApi.list({ patientId, page: 1, limit: 100 });
        if (cancelled) return;
        setAppointments(res.data);
      } catch {
        // ignore — calendar simply renders without events
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Index appointments by YYYY-MM-DD for fast day-cell lookups.
  const apptsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const k = dateKey(new Date(a.scheduledAt));
      const list = map.get(k) ?? [];
      list.push(a);
      map.set(k, list);
    }
    // Sort within each day by time (asc)
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [appointments]);

  const days = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) list.push(null);
    for (let i = 1; i <= daysInMonth; i++) list.push(i);
    return list;
  }, [currentMonth]);

  const dateKeyForDay = (day: number) =>
    `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const handleDayClick = (day: number | null) => {
    if (!day) return;
    const key = dateKeyForDay(day);
    setSelectedDate(selectedDate === key ? null : key);
  };

  const selectedAppts = selectedDate ? apptsByDate.get(selectedDate) ?? [] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E6F0FA] to-[#E8F5E9] rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-[#3A7BD5]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Your Calendar</h3>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h4>
          <div className="flex gap-2">
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
              }
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const key = day ? dateKeyForDay(day) : null;
            const hasAppts = key ? apptsByDate.has(key) : false;
            const isSelected = key && selectedDate === key;
            const today = isToday(day);
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleDayClick(day)}
                disabled={!day}
                className={`aspect-square flex items-center justify-center rounded-xl text-sm relative transition-all ${
                  !day
                    ? 'cursor-default'
                    : isSelected
                    ? 'ring-2 ring-[#3A7BD5] bg-[#E6F0FA] text-[#3A7BD5] font-semibold'
                    : today
                    ? 'bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] text-white font-semibold'
                    : hasAppts
                    ? 'bg-[#E8F5E9] text-[#4CAF50] font-medium hover:bg-[#D6EFD9]'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {day}
                {hasAppts && !isSelected && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Appointments for the selected day ───────────────────────── */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100 pt-4 mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-semibold text-gray-800">
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h5>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close day details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedAppts.length === 0 ? (
              <p className="text-sm text-gray-500">No appointments on this day.</p>
            ) : (
              <div className="space-y-2">
                {selectedAppts.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-col items-center w-12 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-[#3A7BD5] mb-0.5" />
                      <span className="text-xs font-medium text-gray-800">
                        {formatTime(appt.scheduledAt)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}
                        </p>
                        {statusBadge(appt.status)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {appt.doctor?.doctorProfile?.specialty}
                        {appt.service?.name && ` · ${appt.service.name}`}
                      </p>
                      {appt.reason && (
                        <p className="text-xs text-gray-600 mt-1 italic">"{appt.reason}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] rounded-full" />
          <span className="text-sm text-gray-600">Today</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#E8F5E9] rounded-full border border-[#4CAF50]" />
          <span className="text-sm text-gray-600">Has appointments</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#E6F0FA] rounded-full ring-2 ring-[#3A7BD5]/40" />
          <span className="text-sm text-gray-600">Selected day</span>
        </div>
      </div>
    </motion.div>
  );
}
