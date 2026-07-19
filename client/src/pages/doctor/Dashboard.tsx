import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Calendar, Users, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: number;
  patient_name: string;
  appointment_date: string;
  type: string;
  status: string;
  notes: string;
  blood_group: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Appointment[]>('/doctors/appointments')
      .then(setAppointments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = appointments.filter(a => {
    const d = new Date(a.appointment_date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const upcoming = appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status));
  const completed = appointments.filter(a => a.status === 'completed');

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/doctors/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Good day, {user?.fullName?.split(' ').slice(-1)[0]} 👨‍⚕️</h1>
        <p className="text-gray-500 text-sm mt-1">Here's your practice overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-50 rounded-lg"><Calendar size={20} className="text-teal-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{today.length}</p><p className="text-sm text-gray-500">Today's appointments</p></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg"><Users size={20} className="text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{upcoming.length}</p><p className="text-sm text-gray-500">Pending</p></div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg"><CheckCircle size={20} className="text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{completed.length}</p><p className="text-sm text-gray-500">Completed</p></div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Today's Schedule</h2>
          <Link to="/doctor/appointments" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            All appointments <ChevronRight size={14} />
          </Link>
        </div>
        {today.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No appointments today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {today.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{a.patient_name}</p>
                  <p className="text-xs text-gray-500">{format(new Date(a.appointment_date), 'p')} · {a.type} {a.blood_group ? `· ${a.blood_group}` : ''}</p>
                  {a.notes && <p className="text-xs text-gray-500 mt-0.5">{a.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${a.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                  {a.status === 'scheduled' && (
                    <button onClick={() => updateStatus(a.id, 'completed')} className="text-xs text-green-600 hover:text-green-700 font-medium">
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
