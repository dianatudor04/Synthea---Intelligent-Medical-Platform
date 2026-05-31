import { useEffect, useState } from 'react';
import { Users, Search, Filter, Mail, Calendar, UserCheck, UserX } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { adminApi } from '../../../lib/services';
import { AdminUser } from '../../../lib/types';

const getStatusColor = (active: boolean) =>
  active ? 'bg-[#E8F5E9] text-[#4CAF50]' : 'bg-gray-100 text-gray-600';

const getRoleColor = (role: string) => {
  switch (role) {
    case 'DOCTOR':
      return 'bg-[#E6F0FA] text-[#3A7BD5]';
    case 'ADMIN':
      return 'bg-[#FFF3E0] text-[#FF9800]';
    default:
      return 'bg-[#F3E5F5] text-[#9C27B0]';
  }
};

export function AdminStaffPage() {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'DOCTOR' | 'ADMIN' | 'PATIENT'>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    adminApi
      .users({ role: filterRole === 'all' ? undefined : filterRole, page: 1, limit: 100 })
      .then((res) => !cancelled && setUsers(res.data))
      .catch(() => !cancelled && setError('Could not load users'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filterRole, version]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    return (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-[#3A7BD5]', bg: 'bg-[#E6F0FA]' },
    { label: 'Active', value: users.filter((u) => u.isActive).length, icon: UserCheck, color: 'text-[#4CAF50]', bg: 'bg-[#E8F5E9]' },
    { label: 'Doctors', value: users.filter((u) => u.role === 'DOCTOR').length, icon: Users, color: 'text-[#FF9800]', bg: 'bg-[#FFF3E0]' },
    { label: 'Inactive', value: users.filter((u) => !u.isActive).length, icon: UserX, color: 'text-gray-500', bg: 'bg-gray-100' },
  ];

  const toggleActive = async (u: AdminUser) => {
    setBusyId(u.id);
    try {
      if (u.isActive) {
        await adminApi.deactivate(u.id);
      } else {
        await adminApi.updateUser(u.id, { isActive: true });
      }
      setVersion((v) => v + 1);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800">Staff & Users</h1>
          <p className="text-gray-500 mt-1">Manage all platform users</p>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-4 lg:p-6 border-0 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A7BD5] bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3A7BD5] bg-white"
            >
              <option value="all">All Roles</option>
              <option value="DOCTOR">Doctor</option>
              <option value="ADMIN">Admin</option>
              <option value="PATIENT">Patient</option>
            </select>
          </div>
        </div>
      </Card>

      {loading && <p className="text-sm text-gray-500">Loading users...</p>}

      <div className="grid gap-4">
        {filtered.map((member) => {
          const initials = `${member.firstName?.[0] ?? '?'}${member.lastName?.[0] ?? ''}`;
          return (
            <Card key={member.id} className="p-4 lg:p-6 border-0 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3A7BD5] to-[#4CAF50] flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-800">
                        {member.firstName} {member.lastName}
                      </h3>
                      <Badge className={`${getRoleColor(member.role)} border-0 text-xs`}>{member.role}</Badge>
                      <Badge className={`${getStatusColor(member.isActive)} border-0 text-xs`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {member.doctorProfile?.specialty && (
                      <p className="text-sm text-gray-500">{member.doctorProfile.specialty}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 lg:min-w-[280px]">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(member)}
                    disabled={busyId === member.id}
                    className="border-gray-200 hover:bg-gray-50"
                  >
                    {busyId === member.id ? '...' : member.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
