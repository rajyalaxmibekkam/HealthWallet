import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { FileText, Activity, Pill, Plus, X } from 'lucide-react';
import { format } from 'date-fns';

interface MedicalRecord {
  id: number;
  doctor_name: string;
  specialization: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  notes: string;
  created_at: string;
}

interface Prescription {
  id: number;
  doctor_name: string;
  medicines: Array<{ name: string; dosage: string; frequency: string; duration: string }>;
  instructions: string;
  status: string;
  valid_until: string;
  created_at: string;
}

interface VitalForm {
  bpSystolic: string; bpDiastolic: string; heartRate: string;
  temperature: string; weight: string; height: string; bloodSugar: string; notes: string;
}

export default function PatientRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [tab, setTab] = useState<'records' | 'prescriptions' | 'vitals'>('records');
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [vitalForm, setVitalForm] = useState<VitalForm>({ bpSystolic: '', bpDiastolic: '', heartRate: '', temperature: '', weight: '', height: '', bloodSugar: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [vitals, setVitals] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [recs, presc, vs] = await Promise.all([
      api.get<MedicalRecord[]>('/patients/records'),
      api.get<Prescription[]>('/patients/prescriptions'),
      api.get<unknown[]>('/patients/vitals'),
    ]);
    setRecords(recs); setPrescriptions(presc); setVitals(vs);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const saveVital = async () => {
    setSaving(true);
    try {
      await api.post('/patients/vitals', {
        bpSystolic: vitalForm.bpSystolic ? parseInt(vitalForm.bpSystolic) : null,
        bpDiastolic: vitalForm.bpDiastolic ? parseInt(vitalForm.bpDiastolic) : null,
        heartRate: vitalForm.heartRate ? parseInt(vitalForm.heartRate) : null,
        temperature: vitalForm.temperature ? parseFloat(vitalForm.temperature) : null,
        weight: vitalForm.weight ? parseFloat(vitalForm.weight) : null,
        height: vitalForm.height ? parseFloat(vitalForm.height) : null,
        bloodSugar: vitalForm.bloodSugar ? parseFloat(vitalForm.bloodSugar) : null,
        notes: vitalForm.notes || null,
      });
      setShowVitalForm(false);
      setVitalForm({ bpSystolic: '', bpDiastolic: '', heartRate: '', temperature: '', weight: '', height: '', bloodSugar: '', notes: '' });
      await load();
    } catch (err) { alert(err instanceof Error ? err.message : 'Failed to save'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Health Records</h1>
        <p className="text-gray-500 text-sm mt-1">Your complete medical history</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['records', 'prescriptions', 'vitals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Records */}
      {tab === 'records' && (
        <div className="space-y-3">
          {records.length === 0 ? (
            <div className="card text-center py-12">
              <FileText size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No medical records yet</p>
            </div>
          ) : records.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{r.diagnosis || 'General consultation'}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">Dr. {r.doctor_name} · {r.specialization} · {format(new Date(r.created_at), 'PP')}</p>
                  {r.symptoms && <p className="text-sm text-gray-700"><span className="font-medium">Symptoms:</span> {r.symptoms}</p>}
                  {r.treatment && <p className="text-sm text-gray-700 mt-1"><span className="font-medium">Treatment:</span> {r.treatment}</p>}
                  {r.notes && <p className="text-sm text-gray-500 mt-1">{r.notes}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescriptions */}
      {tab === 'prescriptions' && (
        <div className="space-y-3">
          {prescriptions.length === 0 ? (
            <div className="card text-center py-12">
              <Pill size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No prescriptions yet</p>
            </div>
          ) : prescriptions.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900">Prescription</p>
                  <p className="text-sm text-gray-500">Dr. {p.doctor_name} · {format(new Date(p.created_at), 'PP')}</p>
                </div>
                <span className={`badge ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{p.status}</span>
              </div>
              {Array.isArray(p.medicines) && p.medicines.length > 0 && (
                <div className="space-y-2">
                  {p.medicines.map((m, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{m.name}</span>
                      {m.dosage && <span className="text-gray-500"> · {m.dosage}</span>}
                      {m.frequency && <span className="text-gray-500"> · {m.frequency}</span>}
                      {m.duration && <span className="text-gray-500"> · {m.duration}</span>}
                    </div>
                  ))}
                </div>
              )}
              {p.instructions && <p className="text-sm text-gray-600 mt-2">{p.instructions}</p>}
              {p.valid_until && <p className="text-xs text-gray-400 mt-2">Valid until: {format(new Date(p.valid_until), 'PP')}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Vitals */}
      {tab === 'vitals' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowVitalForm(true)} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Log Vitals
            </button>
          </div>

          {showVitalForm && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Log Vitals</h2>
                  <button onClick={() => setShowVitalForm(false)}><X size={20} className="text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'BP Systolic (mmHg)', key: 'bpSystolic' },
                    { label: 'BP Diastolic (mmHg)', key: 'bpDiastolic' },
                    { label: 'Heart Rate (bpm)', key: 'heartRate' },
                    { label: 'Temperature (°C)', key: 'temperature' },
                    { label: 'Weight (kg)', key: 'weight' },
                    { label: 'Height (cm)', key: 'height' },
                    { label: 'Blood Sugar (mg/dL)', key: 'bloodSugar' },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="label text-xs">{label}</label>
                      <input type="number" className="input text-sm" value={(vitalForm as unknown as { [k: string]: string })[key]}
                        onChange={e => setVitalForm(f => ({ ...f, [key]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="label text-xs">Notes</label>
                    <input className="input text-sm" value={vitalForm.notes} onChange={e => setVitalForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setShowVitalForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button onClick={saveVital} className="btn-primary flex-1" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {vitals.length === 0 ? (
            <div className="card text-center py-12">
              <Activity size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No vitals recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(vitals as Record<string, string | number>[]).map((v, i) => (
                <div key={i} className="card">
                  <p className="text-sm font-medium text-gray-500 mb-3">{format(new Date(v.recorded_at as string), 'PPp')}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {v.blood_pressure_systolic && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">BP</p><p className="font-semibold text-sm">{v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</p></div>}
                    {v.heart_rate && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Heart Rate</p><p className="font-semibold text-sm">{v.heart_rate} bpm</p></div>}
                    {v.weight && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Weight</p><p className="font-semibold text-sm">{v.weight} kg</p></div>}
                    {v.blood_sugar && <div className="bg-gray-50 rounded-lg p-2 text-center"><p className="text-xs text-gray-500">Blood Sugar</p><p className="font-semibold text-sm">{v.blood_sugar} mg/dL</p></div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
