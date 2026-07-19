import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home, User, Calendar, FileText, Users, Activity,
  LogOut, Heart, Shield
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const patientNav: NavItem[] = [
  { to: '/patient/dashboard', icon: <Home size={18} />, label: 'Dashboard' },
  { to: '/patient/profile', icon: <User size={18} />, label: 'My Profile' },
  { to: '/patient/appointments', icon: <Calendar size={18} />, label: 'Appointments' },
  { to: '/patient/records', icon: <FileText size={18} />, label: 'Health Records' },
];

const doctorNav: NavItem[] = [
  { to: '/doctor/dashboard', icon: <Home size={18} />, label: 'Dashboard' },
  { to: '/doctor/appointments', icon: <Calendar size={18} />, label: 'Appointments' },
  { to: '/doctor/patients', icon: <Users size={18} />, label: 'My Patients' },
];

const adminNav: NavItem[] = [
  { to: '/admin/dashboard', icon: <Shield size={18} />, label: 'Dashboard' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navItems =
    user?.role === 'patient' ? patientNav :
    user?.role === 'doctor' ? doctorNav :
    adminNav;

  const roleColor =
    user?.role === 'patient' ? 'bg-blue-600' :
    user?.role === 'doctor' ? 'bg-teal-600' :
    'bg-purple-600';

  const roleLabel =
    user?.role === 'patient' ? 'Patient' :
    user?.role === 'doctor' ? 'Doctor' :
    'Admin';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className={`${roleColor} p-4 flex items-center gap-3`}>
        <div className="bg-white bg-opacity-20 rounded-lg p-2">
          <Heart size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-none">HealthWallet</h1>
          <p className="text-blue-100 text-xs mt-0.5">{roleLabel} Portal</p>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Activity size={16} className="text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
