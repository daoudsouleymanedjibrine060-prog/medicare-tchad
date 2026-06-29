import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import type { DashboardStats } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

const QUICK_ACTIONS = [
  { label: 'Gérer les RDV', to: '/admin/rendez-vous' },
  { label: 'Gérer les médecins', to: '/admin/medecins' },
  { label: 'Gérer les patients', to: '/admin/patients' },
  { label: 'Gérer les cabinets', to: '/admin/cabinets' },
  { label: 'Gérer les assistants', to: '/admin/assistants' },
  { label: 'Gérer les laboratoires', to: '/admin/laboratoires' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Impossible de charger les statistiques'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!stats) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord Admin</h1>
        <p className="mt-4 text-sm text-red-600">{error || 'Données indisponibles'}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Tableau de bord Admin</h1>
      <p className="text-slate-500 mt-1">Vue d'ensemble — MediCare Tchad</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Médecins', value: stats.totalDoctors },
          { label: 'Patients', value: stats.totalPatients },
          { label: 'Cabinets médicaux', value: stats.totalCabinets },
          { label: 'Laboratoires', value: stats.totalLaboratories },
          { label: 'Assistants', value: stats.totalAssistants },
          { label: 'Rendez-vous', value: stats.totalAppointments },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border p-5">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Statistiques plateforme</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.entityOverview || []}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Actions rapides</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="block w-full text-left px-4 py-2.5 rounded-lg border border-slate-200 text-sm hover:bg-primary-50 hover:border-primary-200"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
