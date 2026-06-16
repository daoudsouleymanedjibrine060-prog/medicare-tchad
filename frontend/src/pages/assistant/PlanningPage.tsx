import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Appointment } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import TomorrowPlanningGrid from '../../components/assistant/TomorrowPlanningGrid';

export default function PlanningPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/appointments/mine?upcoming=true&limit=50')
      .then(({ data }) => setAppointments(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const planned = [...appointments]
    .filter((a) => ['CONFIRMED', 'PENDING'].includes(a.status))
    .sort((a, b) => {
      const dateCmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCmp !== 0) return dateCmp;
      return a.startTime.localeCompare(b.startTime);
    });

  return (
    <div>
      <h1 className="text-2xl font-bold">Planning du médecin</h1>
      <p className="text-slate-500 mt-1">Créneaux de demain et rendez-vous planifiés</p>

      <div className="mt-6 bg-white rounded-xl border p-5">
        <TomorrowPlanningGrid />
      </div>

      <div className="mt-8 bg-white rounded-xl border overflow-hidden">
        <h2 className="font-semibold p-5 border-b">Rendez-vous planifiés</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-4">Date</th>
              <th className="text-left p-4">Heure</th>
              <th className="text-left p-4">Patient</th>
              <th className="text-left p-4">Statut</th>
            </tr>
          </thead>
          <tbody>
            {planned.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-4">{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                <td className="p-4">{a.startTime} – {a.endTime}</td>
                <td className="p-4">{a.patient?.user?.firstName} {a.patient?.user?.lastName}</td>
                <td className="p-4"><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {planned.length === 0 && (
          <p className="text-center py-8 text-slate-500">Aucun rendez-vous planifié</p>
        )}
      </div>
    </div>
  );
}
