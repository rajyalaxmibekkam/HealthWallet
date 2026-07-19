import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Users, Search, Heart, Calendar } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';

interface Patient {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  phone: string;
  chronic_conditions: string;
  allergies: string;
  last_visit: string;
}

export default function DoctorPatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Patient[]>('/doctors/patients')
      .then(setPatients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.chronic_conditions || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Patients</h1>
        <p className="text-gray-500 text-sm mt-1">{patients.length} patients under your care</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input pl-9" placeholder="Search patients by name or condition…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">{search ? 'No matching patients' : 'No patients yet'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(p => {
            const age = p.date_of_birth ? differenceInYears(new Date(), new Date(p.date_of_birth)) : null;
            return (
              <div key={p.id} className="card">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-700 font-semibold text-sm">{p.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{p.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {age ? `${age} yrs` : ''}{p.gender ? ` · ${p.gender}` : ''}{p.blood_group ? ` · ${p.blood_group}` : ''}
                    </p>
                  </div>
                  {p.blood_group && (
                    <div className="flex items-center gap-1 text-red-500 flex-shrink-0">
                      <Heart size={12} fill="currentColor" />
                      <span className="text-xs font-medium">{p.blood_group}</span>
                    </div>
                  )}
                </div>

                {(p.chronic_conditions || p.allergies) && (
                  <div className="space-y-1.5 mb-3">
                    {p.chronic_conditions && (
                      <div className="bg-amber-50 rounded-lg px-2.5 py-1.5 text-xs">
                        <span className="font-medium text-amber-700">Conditions: </span>
                        <span className="text-amber-600">{p.chronic_conditions}</span>
                      </div>
                    )}
                    {p.allergies && (
                      <div className="bg-red-50 rounded-lg px-2.5 py-1.5 text-xs">
                        <span className="font-medium text-red-600">Allergies: </span>
                        <span className="text-red-500">{p.allergies}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <Calendar size={11} />
                  <span>Last visit: {p.last_visit ? format(new Date(p.last_visit), 'PP') : 'N/A'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
