import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import type { DashboardStats, User } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

const QUICK_ACTIONS = [
  { label: 'Gérer les admins', to: '/super-admin/admins' },
  { label: 'Gérer les RDV', to: '/admin/rendez-vous' },
  { label: 'Gérer les médecins', to: '/admin/medecins' },
  { label: 'Gérer les patients', to: '/admin/patients' },
  { label: 'Gérer les cabinets', to: '/admin/cabinets' },
  { label: 'Gérer les laboratoires', to: '/admin/laboratoires' },
  { label: 'Gérer les assistants', to: '/admin/assistants' },
];

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/users?role=ADMIN'),
    ]).then(([statsRes, adminsRes]) => {
      setStats(statsRes.data);
      setAdmins(adminsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const exportCsv = async () => {
    const token = localStorage.getItem('accessToken');
    const base = import.meta.env.VITE_API_URL || '/api/v1';
    try {
      const res = await fetch(`${base}/dashboard/export/appointments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export échoué');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rendez-vous.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Impossible d\'exporter le fichier CSV');
    }
  };

  if (loading) return <LoadingSpinner />;

  const pendingActions = (stats?.pendingAppointments || 0) + (stats?.inactiveAdmins || 0);

  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">LedControl — Super Administration</h1>
          <p className="text-slate-500 mt-1">Supervision nationale MediCare Tchad</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700">
          <Download className="w-4 h-4" /> Exporter CSV
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Administrateurs', value: stats?.totalAdmins ?? admins.length },
          { label: 'Médecins', value: stats?.totalDoctors ?? 0 },
          { label: 'Patients', value: stats?.totalPatients ?? 0 },
          { label: 'Cabinets', value: stats?.totalCabinets ?? 0 },
          { label: 'Laboratoires', value: stats?.totalLaboratories ?? 0 },
          { label: 'Assistants', value: stats?.totalAssistants ?? 0 },
          { label: 'RDV en attente', value: stats?.pendingAppointments ?? 0 },
          { label: 'Actions en attente', value: pendingActions },
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
          {stats?.entityOverview && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.entityOverview}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold mb-4">Actions rapides</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.to} to={a.to} className="block px-4 py-2.5 rounded-lg border text-sm hover:bg-primary-50">
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
