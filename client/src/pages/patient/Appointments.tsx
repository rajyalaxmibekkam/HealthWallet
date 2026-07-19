import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Calendar, Plus, X, Clock, User } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: number;
  doctor_name: string;
  specialization: string;
  appointment_date: string;
  type: string;
  status: string;
  notes: string;
}

interface Doctor {
  id: number;
  full_name: string;
  specialization: string;
  hospital_name: string;
  consultation_fee: number;
  experience_years: number;
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
  'no-show': 'bg-orange-100 text-orange-600',
};

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [showBook, setShowBook] = useState(false);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({ doctorId: '', appointmentDate: '', type: 'in-person', notes: '' });
  const [error, setError] = useState('');

  const load = async () => {
    const [appts, docs] = await Promise.all([
      api.get<Appointment[]>('/patients/appointments'),
      api.get<Doctor[]>('/doctors'),
    ]);
    setAppointments(appts);
    setDoctors(docs);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const book = async () => {
    if (!form.doctorId || !form.appointmentDate) { setError('Please fill all required fields'); return; }
    setBooking(true); setError('');
    try {
      await api.post('/appointments', {
        doctorId: parseInt(form.doctorId),
        appointmentDate: form.appointmentDate,
        type: form.type,
        notes: form.notes,
      });
      setShowBook(false);
      setForm({ doctorId: '', appointmentDate: '', type: 'in-person', notes: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book');
    } finally {
      setBooking(false);
    }
  };

  const cancel = async (id: number) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your consultations</p>
        </div>
        <button onClick={() => setShowBook(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Book Appointment
        </button>
      </div>

      {/* Book Modal */}
      {showBook && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Book Appointment</h2>
              <button onClick={() => setShowBook(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="label">Select Doctor *</label>
                <select className="input" value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))}>
                  <option value="">Choose a doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} — {d.specialization || 'General'} {d.consultation_fee ? `(₹${d.consultation_fee})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date & Time *</label>
                <input type="datetime-local" className="input" value={form.appointmentDate} onChange={e => setForm(f => ({ ...f, appointmentDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="in-person">In-Person</option>
                  <option value="telemedicine">Telemedicine</option>
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Describe your symptoms or reason for visit" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowBook(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={book} className="btn-primary flex-1" disabled={booking}>
                {booking ? 'Booking…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No appointments yet</p>
          <button onClick={() => setShowBook(true)} className="mt-4 btn-primary">Book your first appointment</button>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(a => (
            <div key={a.id} className="card flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl flex-shrink-0">
                <Clock size={20} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{a.doctor_name}</p>
                    <p className="text-sm text-gray-500">{a.specialization} · {a.type}</p>
                    <p className="text-sm text-gray-600 mt-1">{format(new Date(a.appointment_date), 'PPp')}</p>
                    {a.notes && <p className="text-xs text-gray-500 mt-1">{a.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge ${STATUS_COLORS[a.status] || 'bg-gray-100 text-gray-600'}`}>{a.status}</span>
                    {a.status === 'scheduled' && (
                      <button onClick={() => cancel(a.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Cancel">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
