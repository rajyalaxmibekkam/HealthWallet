import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Users, Activity, FileText, Pill, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';

interface Stats {
  users: Array<{ role: string; count: string }>;
  appointments: Array<{ status: string; count: string }>;
  totalRecords: string;
  totalPrescriptions: string;
}

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  full_name: string;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  patient: 'bg-blue-100 text-blue-700',
  doctor: 'bg-teal-100 text-teal-700',
  admin: 'bg-purple-100 text-purple-700',
  lab: 'bg-orange-100 text-orange-700',
  pharmacy: 'bg-green-100 text-green-700',
  hospital: 'bg-pink-100 text-pink-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [s, u] = await Promise.all([
      api.get<Stats>('/admin/stats'),
      api.get<User[]>('/admin/users'),
    ]);
    setStats(s); setUsers(u);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const toggle = async (id: number) => {
    try {
      const updated = await api.patch<{ id: number; is_active: boolean }>(`/admin/users/${id}/toggle`);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: updated.is_active } : u));
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  };

  const totalUsers = stats?.users.reduce((sum, u) => sum + parseInt(u.count), 0) || 0;
  const totalAppts = stats?.appointments.reduce((sum, a) => sum + parseInt(a.count), 0) || 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-purple-50 rounded-xl"><Shield size={22} className="text-purple-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Platform overview and user management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><Users size={16} className="text-blue-600" /><span className="text-sm text-gray-500">Total Users</span></div>
          <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><Activity size={16} className="text-teal-600" /><span className="text-sm text-gray-500">Appointments</span></div>
          <p className="text-3xl font-bold text-gray-900">{totalAppts}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><FileText size={16} className="text-orange-600" /><span className="text-sm text-gray-500">Medical Records</span></div>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalRecords || 0}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1"><Pill size={16} className="text-green-600" /><span className="text-sm text-gray-500">Prescriptions</span></div>
          <p className="text-3xl font-bold text-gray-900">{stats?.totalPrescriptions || 0}</p>
        </div>
      </div>

      {/* Users by role */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Users by Role</h2>
          <div className="space-y-2">
            {stats?.users.map(u => (
              <div key={u.role} className="flex items-center justify-between">
                <span className={`badge ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'} capitalize`}>{u.role}</span>
                <span className="font-semibold text-gray-700">{u.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-3">Appointments by Status</h2>
          <div className="space-y-2">
            {stats?.appointments.map(a => (
              <div key={a.status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-gray-600">{a.status}</span>
                <span className="font-semibold text-gray-700">{a.count}</span>
              </div>
            ))}
            {(!stats?.appointments || stats.appointments.length === 0) && (
              <p className="text-sm text-gray-400">No appointments yet</p>
            )}
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Name</th>
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Email</th>
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Role</th>
                <th className="text-left py-2 pr-4 text-gray-500 font-medium">Joined</th>
                <th className="text-left py-2 text-gray-500 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-900">{u.full_name || '—'}</td>
                  <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'} capitalize`}>{u.role}</span>
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{format(new Date(u.created_at), 'PP')}</td>
                  <td className="py-3">
                    <button onClick={() => toggle(u.id)} className={`flex items-center gap-1 text-sm ${u.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {u.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
