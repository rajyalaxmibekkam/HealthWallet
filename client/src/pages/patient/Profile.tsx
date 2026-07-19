import { useEffect, useState, FormEvent } from 'react';
import api from '../../lib/api';
import { Save, User, AlertCircle, CheckCircle } from 'lucide-react';

interface Profile {
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  abha_id: string;
  phone: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  allergies: string;
  chronic_conditions: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function PatientProfile() {
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get<Profile>('/patients/profile')
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const update = (k: keyof Profile, v: string) => setProfile(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const updated = await api.put<Profile>('/patients/profile', {
        fullName: profile.full_name,
        dateOfBirth: profile.date_of_birth,
        gender: profile.gender,
        bloodGroup: profile.blood_group,
        abhaId: profile.abha_id,
        phone: profile.phone,
        address: profile.address,
        emergencyContactName: profile.emergency_contact_name,
        emergencyContactPhone: profile.emergency_contact_phone,
        allergies: profile.allergies,
        chronicConditions: profile.chronic_conditions,
      });
      setProfile(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-50 rounded-xl"><User size={22} className="text-blue-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 text-sm">Manage your health information</p>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={profile.full_name || ''} onChange={e => update('full_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" value={profile.date_of_birth?.split('T')[0] || ''} onChange={e => update('date_of_birth', e.target.value)} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input" value={profile.gender || ''} onChange={e => update('gender', e.target.value)}>
                <option value="">Select gender</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select className="input" value={profile.blood_group || ''} onChange={e => update('blood_group', e.target.value)}>
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={profile.phone || ''} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="label">ABHA ID</label>
              <input className="input" value={profile.abha_id || ''} onChange={e => update('abha_id', e.target.value)} placeholder="14-digit ABHA number" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <textarea className="input" rows={2} value={profile.address || ''} onChange={e => update('address', e.target.value)} placeholder="Your full address" />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Emergency Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Name</label>
              <input className="input" value={profile.emergency_contact_name || ''} onChange={e => update('emergency_contact_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Contact Phone</label>
              <input className="input" value={profile.emergency_contact_phone || ''} onChange={e => update('emergency_contact_phone', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Medical History</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Allergies</label>
              <textarea className="input" rows={2} value={profile.allergies || ''} onChange={e => update('allergies', e.target.value)} placeholder="e.g. Penicillin, peanuts, dust mites" />
            </div>
            <div>
              <label className="label">Chronic Conditions</label>
              <textarea className="input" rows={2} value={profile.chronic_conditions || ''} onChange={e => update('chronic_conditions', e.target.value)} placeholder="e.g. Diabetes Type 2, Hypertension" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
