import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle, Users, FileText, Pill } from 'lucide-react';
import api from '../../services/api';
import type { Appointment } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import AppointmentRequestsTable from '../../components/assistant/AppointmentRequestsTable';
import DashboardHeader from '../../components/DashboardHeader';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, totalPatients: 0 });
  const [pendingList, setPendingList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/appointments/assistant/stats'),
      api.get('/appointments/mine?status=PENDING&limit=5'),
    ]).then(([statsRes, apptRes]) => {
      setStats(statsRes.data);
      setPendingList(apptRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string, rejectionReason?: string) => {
    await api.patch(`/appointments/${id}/status`, { status, rejectionReason });
    setPendingList((list) => list.filter((a) => a.id !== id));
    const statsRes = await api.get('/appointments/assistant/stats');
    setStats(statsRes.data);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Tableau de bord médecin"
        subtitle="Gérez vos rendez-vous, dossiers et ordonnances"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg"><Clock className="w-6 h-6 text-amber-600" /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
            <p className="text-sm text-slate-500">Demandes en attente</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.confirmed}</p>
            <p className="text-sm text-slate-500">RDV confirmés</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalPatients}</p>
            <p className="text-sm text-slate-500">Patients suivis</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/doctor/dossiers" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary-300 transition-colors flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary-600" />
          <span className="font-medium text-slate-800">Dossiers médicaux</span>
        </Link>
        <Link to="/doctor/ordonnances" className="bg-white rounded-xl border border-slate-200 p-5 hover:border-primary-300 transition-colors flex items-center gap-3">
          <Pill className="w-5 h-5 text-primary-600" />
          <span className="font-medium text-slate-800">Ordonnances</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Demandes récentes</h2>
        {pendingList.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune demande en attente.</p>
        ) : (
          <AppointmentRequestsTable appointments={pendingList} onUpdate={updateStatus} />
        )}
        <div className="mt-4 text-right">
          <Link to="/doctor/demandes" className="text-sm text-primary-600 hover:underline">Voir toutes les demandes</Link>
        </div>
      </div>
    </div>
  );
}
