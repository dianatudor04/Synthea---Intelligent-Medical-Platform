import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../../lib/auth';
import { appointmentsApi } from '../../lib/services';
import { Appointment } from '../../lib/types';

const statusColors: Record<string, string> = {
  PENDING: 'bg-[#E6F0FA] text-[#3A7BD5] border-[#3A7BD5]',
  CONFIRMED: 'bg-[#E6F0FA] text-[#3A7BD5] border-[#3A7BD5]',
  COMPLETED: 'bg-[#E8F5E9] text-[#4CAF50] border-[#4CAF50]',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-400',
  NO_SHOW: 'bg-[#FFEBEE] text-[#F44336] border-[#F44336]',
};

const HOUR_SLOTS = Array.from({ length: 11 }, (_, i) => `${(i + 8).toString().padStart(2, '0')}:00`);

export function SchedulePage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadDay = async (date: Date) => {
    if (!user) return;
    setLoading(true);
    try {
      const params: { date: string; doctorId?: string; limit: number } = {
        date: date.toISOString().split('T')[0],
        limit: 50,
      };
      if (user.role === 'DOCTOR') params.doctorId = user.id;
      const res = await appointmentsApi.list(params);
      setAppointments(res.data);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDay(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, user]);

  const navigate = (direction: 'prev' | 'next') => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + (direction === 'next' ? 1 : -1));
    setCurrentDate(next);
  };

  const updateStatus = async (id: string, status: Appointment['status']) => {
    setUpdating(id);
    try {
      await appointmentsApi.update(id, { status });
      await loadDay(currentDate);
    } finally {
      setUpdating(null);
    }
  };

  const findAt = (slot: string) =>
    appointments.find((a) => {
      const t = new Date(a.scheduledAt);
      const h = t.getHours().toString().padStart(2, '0');
      return `${h}:00` === slot;
    });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">Schedule</h1>
          <p className="text-gray-500 mt-1">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <Card className="p-4 lg:p-6 border-0 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')} className="rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="rounded-xl px-6">
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate('next')} className="rounded-xl">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {loading && <p className="text-sm text-gray-500">Loading schedule...</p>}
        {!loading &&
          HOUR_SLOTS.map((slot) => {
            const appt = findAt(slot);
            return (
              <Card
                key={slot}
                className={`p-4 lg:p-5 border-0 shadow-sm transition-all ${appt ? 'hover:shadow-md' : 'bg-gray-50/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 lg:w-20 text-sm font-medium text-gray-500 flex-shrink-0">{slot}</div>
                  {appt ? (
                    <div className="flex-1 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-1 h-16 lg:h-12 rounded-full ${
                            appt.status === 'CONFIRMED' || appt.status === 'PENDING'
                              ? 'bg-[#3A7BD5]'
                              : appt.status === 'COMPLETED'
                              ? 'bg-[#4CAF50]'
                              : 'bg-gray-400'
                          }`}
                        />
                        <div>
                          <h4 className="font-semibold text-gray-800">
                            {appt.patient?.user?.firstName} {appt.patient?.user?.lastName}
                          </h4>
                          {appt.reason && <p className="text-sm text-gray-500">{appt.reason}</p>}
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{appt.duration} minutes</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${statusColors[appt.status] ?? ''} border text-xs`}>
                          {appt.status.toLowerCase().replace('_', ' ')}
                        </Badge>
                        {appt.status === 'PENDING' && (
                          <Button
                            size="sm"
                            disabled={updating === appt.id}
                            onClick={() => updateStatus(appt.id, 'CONFIRMED')}
                            className="bg-[#3A7BD5] hover:bg-[#2E6BC4] text-white"
                          >
                            Confirm
                          </Button>
                        )}
                        {(appt.status === 'CONFIRMED' || appt.status === 'PENDING') && (
                          <Button
                            size="sm"
                            disabled={updating === appt.id}
                            onClick={() => updateStatus(appt.id, 'COMPLETED')}
                            variant="outline"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-gray-400">Available</div>
                  )}
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
