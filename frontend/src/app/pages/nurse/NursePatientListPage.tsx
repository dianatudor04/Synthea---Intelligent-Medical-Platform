import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Search, AlertCircle, Heart, Activity } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { patientsApi } from '../../../lib/services';
import { PatientProfile } from '../../../lib/types';

function ageFromDob(dob: string) {
  const d = new Date(dob);
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export function NursePatientListPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      patientsApi
        .list({ search: search || undefined, page: 1, limit: 50 })
        .then((res) => !cancelled && setItems(res.data))
        .catch(() => !cancelled && setItems([]))
        .finally(() => !cancelled && setLoading(false));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const stats = [
    { label: 'Total', value: items.length, color: 'text-[#3A7BD5]' },
    { label: 'With Allergies', value: items.filter((p) => p.allergies.length > 0).length, color: 'text-[#FF9800]' },
    { label: 'Active', value: items.length, color: 'text-[#4CAF50]' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <Card key={index} className="p-4 border-0 shadow-sm text-center">
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl border-gray-200"
          />
        </div>
      </Card>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      <div className="space-y-3">
        {items.map((p) => {
          const u = p.user;
          const fullName = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
          const initials = `${u?.firstName?.[0] ?? '?'}${u?.lastName?.[0] ?? ''}`.toUpperCase();
          const Icon = p.allergies.length > 0 ? AlertCircle : Heart;
          return (
            <Link key={p.id} to={`/doctor/patients/${p.id}`}>
              <Card className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-[#FF9800] to-[#FFB74D] text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{fullName || 'Patient'}</h3>
                        <p className="text-sm text-gray-500">
                          {ageFromDob(p.dateOfBirth)} years • {p.gender.toLowerCase()}
                        </p>
                      </div>
                      <Badge className="bg-[#FFF3E0] text-[#FF9800] border-0 text-xs">
                        <Activity className="w-3 h-3 mr-1" />
                        Patient
                      </Badge>
                    </div>
                    {p.allergies.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-[#F44336] mt-1">
                        <Icon className="w-4 h-4" />
                        Allergies: {p.allergies.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
