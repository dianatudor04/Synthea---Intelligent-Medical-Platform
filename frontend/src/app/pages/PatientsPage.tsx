import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Search, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { patientsApi } from '../../lib/services';
import { PatientProfile } from '../../lib/types';

function ageFromDob(dob: string) {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function PatientsPage() {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<PatientProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(() => {
      patientsApi
        .list({ search: search || undefined, page: 1, limit: 50 })
        .then((res) => {
          if (cancelled) return;
          setItems(res.data);
          setTotal(res.total);
        })
        .catch(() => !cancelled && setError('Could not load patients'))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 lg:pb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">Patient Management</h1>
          <p className="text-gray-500 mt-1">{total} patients found</p>
        </div>
      </div>

      <Card className="p-4 lg:p-6 border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl border-gray-200"
            />
          </div>
        </div>
      </Card>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-4">
        {items.map((patient) => {
          const u = patient.user;
          const fullName = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
          const initials = `${u?.firstName?.[0] ?? '?'}${u?.lastName?.[0] ?? ''}`.toUpperCase();
          return (
            <Link key={patient.id} to={`/doctor/patients/${patient.id}`}>
              <Card className="p-5 lg:p-6 border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-[#3A7BD5] to-[#5B9BD5] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800 truncate">{fullName || 'Patient'}</h3>
                        <p className="text-sm text-gray-500">
                          {ageFromDob(patient.dateOfBirth)} years • {patient.gender.toLowerCase()}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {patient.bloodType && <span>Blood: {patient.bloodType}</span>}
                      {u?.email && <span className="truncate">{u.email}</span>}
                    </div>

                    {patient.allergies.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-gray-100">
                        <p className="text-xs text-[#3A7BD5]">Allergies: {patient.allergies.join(', ')}</p>
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
