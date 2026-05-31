import { useEffect, useState } from 'react';
import { Shield, Activity, FileText } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { adminApi } from '../../../lib/services';
import { AuditLog } from '../../../lib/types';

export function AdminSettingsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .auditLogs({ page, limit: 20 })
      .then((res) => {
        if (cancelled) return;
        setLogs(res.data);
        setTotal(res.total);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">System Settings</h1>
        <p className="text-gray-500 mt-1">Compliance, audit trail, and configuration</p>
      </div>

      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[#F3E5F5] rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#9C27B0]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">GDPR / HIPAA Audit Logs</h2>
            <p className="text-sm text-gray-500">Total: {total} entries</p>
          </div>
        </div>

        {loading && <p className="text-sm text-gray-500">Loading...</p>}

        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-full bg-[#E6F0FA] flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-[#3A7BD5]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{log.action.replace(/_/g, ' ')}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{log.user ? `${log.user.firstName} ${log.user.lastName}` : log.userId.slice(0, 8)}</span>
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

        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </Card>

      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E6F0FA] rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#3A7BD5]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Configuration</h2>
            <p className="text-sm text-gray-500">Backend env, integrations, retention policies</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Configuration is managed through environment variables on the backend (see <code>backend/.env.example</code>).
        </p>
      </Card>
    </div>
  );
}
