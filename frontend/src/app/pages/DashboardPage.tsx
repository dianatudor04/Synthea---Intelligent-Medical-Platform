import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Calendar, Users, Activity, AlertCircle, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../../lib/auth';
import { adminApi, appointmentsApi } from '../../lib/services';
import { Appointment, DashboardStats } from '../../lib/types';

const statusColors: Record<string, string> = {
  PENDING: 'bg-[#E6F0FA] text-[#3A7BD5]',
  CONFIRMED: 'bg-[#E6F0FA] text-[#3A7BD5]',
  COMPLETED: 'bg-[#E8F5E9] text-[#4CAF50]',
  CANCELLED: 'bg-gray-100 text-gray-600',
  NO_SHOW: 'bg-[#FFEBEE] text-[#F44336]',
};

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [today, setToday] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      const todayDate = new Date().toISOString().split('T')[0];
      try {
        const apptParams: { date: string; doctorId?: string; limit: number } = { date: todayDate, limit: 20 };
        if (user.role === 'DOCTOR') apptParams.doctorId = user.id;
        // Both ADMIN and DOCTOR can read dashboard KPIs.
        const [appointmentsRes, statsRes] = await Promise.all([
          appointmentsApi.list(apptParams),
          adminApi.dashboard().catch(() => null),
        ]);
        if (cancelled) return;
        setToday(appointmentsRes.data);
        if (statsRes) setStats(statsRes);
      } catch {
        // ignore — empty state will render
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const inProgress = today.filter((a) => a.status === 'CONFIRMED').length;
  const greetingName = user?.role === 'DOCTOR' ? `Dr. ${user.lastName}` : user?.firstName ?? '';

  const summary = [
    {
      label: "Today's Appointments",
      value: today.length,
      icon: Calendar,
      color: 'text-[#3A7BD5]',
      bg: 'bg-[#E6F0FA]',
    },
    {
      label: 'Active Patients',
      value: stats?.totalPatients ?? '—',
      icon: Users,
      color: 'text-[#4CAF50]',
      bg: 'bg-[#E8F5E9]',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Activity,
      color: 'text-[#FF9800]',
      bg: 'bg-[#FFF3E0]',
    },
    {
      label: 'Pending Invoices',
      value: stats?.pendingInvoices ?? '—',
      icon: AlertCircle,
      color: 'text-[#F44336]',
      bg: 'bg-[#FFEBEE]',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      <div className="space-y-2">
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">Good day, {greetingName}</h1>
        <p className="text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4 lg:p-6 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl lg:text-3xl font-semibold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.bg} ${stat.color} p-2 lg:p-3 rounded-xl`}>
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Today's Appointments</h2>
            <Link to="/doctor/schedule">
              <Button variant="ghost" size="sm" className="text-[#3A7BD5]">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {loading && <p className="text-sm text-gray-500">Loading appointments...</p>}
          {!loading && today.length === 0 && (
            <Card className="p-8 border-0 shadow-sm text-center text-gray-500">No appointments today.</Card>
          )}

          <div className="space-y-3">
            {today.map((appointment) => {
              const time = new Date(appointment.scheduledAt);
              const hour = time.getHours();
              const display = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const patientName = appointment.patient?.user
                ? `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`
                : 'Patient';
              return (
                <Card key={appointment.id} className="p-4 lg:p-5 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-[#3A7BD5] to-[#5B9BD5] flex flex-col items-center justify-center text-white">
                        <span className="text-xs font-medium">{display.split(' ')[0]}</span>
                        <span className="text-xs opacity-80">{hour >= 12 ? 'PM' : 'AM'}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-gray-800 truncate">{patientName}</h3>
                        <Badge className={`${statusColors[appointment.status] ?? ''} border-0 text-xs shrink-0`}>
                          {appointment.status.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </div>
                      {appointment.reason && <p className="text-sm text-gray-500">{appointment.reason}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appointment.duration} min
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-[#3A7BD5] to-[#5B9BD5] text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">This Week</h3>
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-semibold">{stats?.totalAppointments ?? '—'}</p>
                <p className="text-sm opacity-90">Appointments tracked</p>
              </div>
              <div className="pt-3 border-t border-white/20">
                <p className="text-2xl font-semibold">{stats ? stats.totalRevenue.toLocaleString() : '—'} RON</p>
                <p className="text-sm opacity-90">Total revenue</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
