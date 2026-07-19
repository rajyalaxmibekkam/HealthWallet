import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: number;
  patient_name: string;
  appointment_date: string;
  type: string;
  status: string;
  notes: string;
  blood_group: string;
  date_of_birth: string;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
};

const STATUSES = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get<Appointment[]>('/doctors/appointments')
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/doctors/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  };

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your patient consultations</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'scheduled', 'confirmed', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No appointments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="card">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-teal-50 rounded-xl flex-shrink-0">
                  <Clock size={18} className="text-teal-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{a.patient_name}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(a.appointment_date), 'PPp')} · {a.type}
                        {a.blood_group ? ` · Blood: ${a.blood_group}` : ''}
                      </p>
                      {a.notes && <p className="text-sm text-gray-600 mt-1">{a.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                    </div>
                  </div>
                  {(a.status === 'scheduled' || a.status === 'confirmed') && (
                    <div className="flex gap-2 mt-3">
                      {STATUSES.filter(s => s !== a.status && s !== 'all').map(s => (
                        <button key={s} onClick={() => updateStatus(a.id, s)}
                          className="text-xs px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 capitalize transition-colors">
                          Mark {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
