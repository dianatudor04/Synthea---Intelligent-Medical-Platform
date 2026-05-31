import { useEffect, useState } from 'react';
import { Users, DollarSign, Calendar, Activity, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { adminApi } from '../../../lib/services';
import { AuditLog, DashboardStats } from '../../../lib/types';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.dashboard(), adminApi.auditLogs({ page: 1, limit: 8 })])
      .then(([s, logs]) => {
        if (cancelled) return;
        setStats(s);
        setAuditLogs(logs.data);
      })
      .catch(() => !cancelled && setError('Could not load admin data'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const kpis = [
    {
      label: 'Total Patients',
      value: stats?.totalPatients ?? '—',
      icon: Users,
      color: 'text-[#3A7BD5]',
      bg: 'bg-[#E6F0FA]',
    },
    {
      label: 'Total Revenue',
      value: stats ? `${stats.totalRevenue.toLocaleString()} RON` : '—',
      icon: DollarSign,
      color: 'text-[#4CAF50]',
      bg: 'bg-[#E8F5E9]',
    },
    {
      label: 'Appointments',
      value: stats?.totalAppointments ?? '—',
      icon: Calendar,
      color: 'text-[#FF9800]',
      bg: 'bg-[#FFF3E0]',
    },
    {
      label: 'Pending Invoices',
      value: stats?.pendingInvoices ?? '—',
      icon: AlertCircle,
      color: 'text-[#9C27B0]',
      bg: 'bg-[#F3E5F5]',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">System Overview</h1>
        <p className="text-gray-500 mt-1">Live monitoring across the platform</p>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="p-4 lg:p-6 border-0 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className={`${kpi.bg} ${kpi.color} p-2 lg:p-3 rounded-xl`}>
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-semibold text-gray-800">{kpi.value}</p>
              <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6 border-0 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#9C27B0]" />
          Recent Audit Logs (GDPR/HIPAA)
        </h3>
        {auditLogs.length === 0 && !loading && (
          <p className="text-sm text-gray-500">No audit logs yet.</p>
        )}
        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
              <div className="w-8 h-8 rounded-full bg-[#E6F0FA] flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-[#3A7BD5]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{log.action.replace(/_/g, ' ')}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId.slice(0, 8)}
                  </span>
                  <span>•</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                  {log.ipAddress && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">{log.ipAddress}</Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 border-0 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Today's Schedule</h4>
          <p className="text-3xl font-semibold text-[#3A7BD5]">{stats?.todayAppointments ?? '—'}</p>
          <p className="text-sm text-gray-500 mt-1">appointments scheduled today</p>
        </Card>
        <Card className="p-5 border-0 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-3">Database</h4>
          <Badge className="bg-[#E8F5E9] text-[#4CAF50] border-0">Healthy</Badge>
        </Card>
        <Card className="p-5 border-0 shadow-sm">
          <h4 className="text-sm font-medium text-gray-600 mb-3">API</h4>
          <Badge className="bg-[#E8F5E9] text-[#4CAF50] border-0">Operational</Badge>
        </Card>
      </div>
    </div>
  );
}
