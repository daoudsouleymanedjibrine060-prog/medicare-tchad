import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  PATIENT: 'Patient',
  ASSISTANT: 'Assistant',
  DOCTOR: 'Médecin',
  ADMIN: 'Administrateur',
  SUPER_ADMIN: 'Super administrateur',
};

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function DashboardHeader({ title, subtitle, action }: DashboardHeaderProps) {
  const { user } = useAuth();
  const initial = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?';

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 ml-auto">
        {action}
        {user && (
          <div className="flex items-center gap-3 bg-white rounded-xl border px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center text-sm font-semibold">
              {initial}
            </div>
            <div>
              <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user.role] || user.role}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
