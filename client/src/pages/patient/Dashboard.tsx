import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Calendar, FileText, Activity, Heart, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: number;
  doctor_name: string;
  specialization: string;
  appointment_date: string;
  type: string;
  status: string;
}

interface Vital {
  id: number;
  recorded_at: string;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
  heart_rate: number;
  weight: number;
}

interface Profile {
  full_name: string;
  blood_group: string;
  chronic_conditions: string;
  allergies: string;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
    'no-show': 'bg-orange-100 text-orange-600',
  };
  return <span className={`badge ${colors[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Appointment[]>('/patients/appointments'),
      api.get<Vital[]>('/patients/vitals'),
      api.get<Profile>('/patients/profile'),
    ]).then(([appts, vs, prof]) => {
      setAppointments(appts);
      setVitals(vs);
      setProfile(prof);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const upcoming = appointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).slice(0, 3);
  const latestVital = vitals[0];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.fullName?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Here's your health overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg"><Calendar size={20} className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg"><FileText size={20} className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{appointments.filter(a => a.status === 'completed').length}</p>
              <p className="text-sm text-gray-500">Completed visits</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 rounded-lg"><Heart size={20} className="text-red-500" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{profile?.blood_group || '—'}</p>
              <p className="text-sm text-gray-500">Blood group</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 rounded-lg"><Activity size={20} className="text-purple-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{latestVital?.heart_rate || '—'}</p>
              <p className="text-sm text-gray-500">Heart rate (bpm)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Upcoming Appointments</h2>
            <Link to="/patient/appointments" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No upcoming appointments</p>
              <Link to="/patient/appointments" className="mt-2 inline-block text-sm text-blue-600">Book one →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <Clock size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{a.doctor_name}</p>
                    <p className="text-xs text-gray-500">{a.specialization} · {a.type}</p>
                    <p className="text-xs text-gray-600 mt-1">{format(new Date(a.appointment_date), 'PPp')}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Snapshot */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Health Snapshot</h2>
            <Link to="/patient/records" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Records <ChevronRight size={14} />
            </Link>
          </div>
          {latestVital ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Blood Pressure', value: `${latestVital.blood_pressure_systolic || '—'}/${latestVital.blood_pressure_diastolic || '—'} mmHg` },
                { label: 'Heart Rate', value: latestVital.heart_rate ? `${latestVital.heart_rate} bpm` : '—' },
                { label: 'Weight', value: latestVital.weight ? `${latestVital.weight} kg` : '—' },
                { label: 'Recorded', value: format(new Date(latestVital.recorded_at), 'PP') },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No vitals recorded yet</p>
              <Link to="/patient/records" className="mt-2 inline-block text-sm text-blue-600">Add vitals →</Link>
            </div>
          )}

          {/* Conditions */}
          {profile?.chronic_conditions && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-700">Chronic conditions</p>
                  <p className="text-xs text-amber-600 mt-0.5">{profile.chronic_conditions}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
