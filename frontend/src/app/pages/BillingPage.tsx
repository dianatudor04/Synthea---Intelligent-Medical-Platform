import { useEffect, useState } from 'react';
import { DollarSign, Search, TrendingUp, Calendar } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../../lib/auth';
import { billingApi } from '../../lib/services';
import { Invoice } from '../../lib/types';
import { ApiRequestError } from '../../lib/api';

const statusColors: Record<string, string> = {
  PAID: 'bg-[#E8F5E9] text-[#4CAF50]',
  ISSUED: 'bg-[#FFF3E0] text-[#FF9800]',
  DRAFT: 'bg-gray-100 text-gray-600',
  OVERDUE: 'bg-[#FFEBEE] text-[#F44336]',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export function BillingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PAID' | 'ISSUED' | 'OVERDUE' | 'DRAFT'>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    billingApi
      .list({
        page: 1,
        limit: 100,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      .then((res) => !cancelled && setInvoices(res.data))
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.status === 403) {
          setError('Only administrators can view all invoices.');
        } else {
          setError('Could not load invoices');
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [statusFilter, version]);

  const filtered = invoices.filter((inv) => {
    if (!search) return true;
    const name = inv.patient?.user ? `${inv.patient.user.firstName} ${inv.patient.user.lastName}` : '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const sumByStatus = (s: string) => invoices.filter((i) => i.status === s).reduce((acc, i) => acc + i.amount, 0);

  const stats = [
    { label: 'Total Revenue', value: `${sumByStatus('PAID').toLocaleString()} RON`, icon: DollarSign, color: 'text-[#4CAF50]', bg: 'bg-[#E8F5E9]' },
    { label: 'Pending', value: `${sumByStatus('ISSUED').toLocaleString()} RON`, icon: TrendingUp, color: 'text-[#FF9800]', bg: 'bg-[#FFF3E0]' },
    { label: 'Overdue', value: `${sumByStatus('OVERDUE').toLocaleString()} RON`, icon: Calendar, color: 'text-[#F44336]', bg: 'bg-[#FFEBEE]' },
  ];

  const handlePay = async (id: string) => {
    setPaying(id);
    try {
      await billingApi.pay(id, 'card_demo');
      setVersion((v) => v + 1);
    } catch {
      alert('Could not process payment');
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">Billing & Invoices</h1>
          <p className="text-gray-500 mt-1">{filtered.length} invoices found</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-amber-50 text-amber-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-5 lg:p-6 border-0 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl lg:text-3xl font-semibold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 lg:p-6 border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-gray-200"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {(['all', 'PAID', 'ISSUED', 'OVERDUE', 'DRAFT'] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                onClick={() => setStatusFilter(s)}
                className={`rounded-xl whitespace-nowrap ${statusFilter === s ? 'bg-[#3A7BD5] hover:bg-[#2E6BC4]' : ''}`}
              >
                {s === 'all' ? 'All' : s.toLowerCase()}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {loading && <p className="text-sm text-gray-500">Loading invoices...</p>}

      <div className="space-y-3">
        {filtered.map((invoice) => {
          const u = invoice.patient?.user;
          const fullName = u ? `${u.firstName} ${u.lastName}` : 'Patient';
          return (
            <Card key={invoice.id} className="p-5 border-0 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{invoice.id.slice(0, 8)}</p>
                  <h3 className="font-semibold text-gray-800">{fullName}</h3>
                  <p className="text-xs text-gray-500">{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {invoice.lineItems?.slice(0, 3).map((item, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {item.description}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-xl font-semibold text-gray-800">
                    {invoice.amount} {invoice.currency}
                  </p>
                  <Badge className={`${statusColors[invoice.status]} border-0`}>{invoice.status.toLowerCase()}</Badge>
                  {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                    <Button
                      onClick={() => handlePay(invoice.id)}
                      disabled={paying === invoice.id}
                      size="sm"
                      className="bg-[#4CAF50] hover:bg-[#43A047] text-white"
                    >
                      {paying === invoice.id ? 'Processing...' : 'Pay'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!isAdmin && !error && (
        <p className="text-xs text-gray-500">Tip: ADMIN accounts can view all invoices and run reports.</p>
      )}
    </div>
  );
}
