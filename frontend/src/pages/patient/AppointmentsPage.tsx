import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Appointment } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

type Tab = 'upcoming' | 'history';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [loading, setLoading] = useState(true);
  const limit = 10;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tab === 'upcoming') params.set('upcoming', 'true');
    else params.set('history', 'true');
    api.get(`/appointments/mine?${params}`)
      .then(({ data }) => {
        setAppointments(data.data);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, tab]);

  const cancel = async (id: string) => {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    await api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' });
    load();
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <h1 className="text-2xl font-bold">Mes rendez-vous</h1>
      <p className="text-slate-500 mt-1">Historique et rendez-vous à venir</p>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => { setTab('upcoming'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm ${tab === 'upcoming' ? 'bg-primary-600 text-white' : 'bg-white border'}`}
        >
          À venir
        </button>
        <button
          onClick={() => { setTab('history'); setPage(1); }}
          className={`px-4 py-2 rounded-lg text-sm ${tab === 'history' ? 'bg-primary-600 text-white' : 'bg-white border'}`}
        >
          Historique
        </button>
      </div>

      <div className="mt-6 bg-white rounded-xl border overflow-hidden">
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Date / Heure</th>
                  <th className="text-left p-4 font-medium">Médecin</th>
                  <th className="text-left p-4 font-medium">Établissement</th>
                  <th className="text-left p-4 font-medium">Motif</th>
                  <th className="text-left p-4 font-medium">Motif refus</th>
                  <th className="text-left p-4 font-medium">Statut</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="p-4">
                      {new Date(a.date).toLocaleDateString('fr-FR')}
                      <span className="block text-xs text-slate-500">{a.startTime} – {a.endTime}</span>
                    </td>
                    <td className="p-4">Dr. {a.doctor?.user?.firstName} {a.doctor?.user?.lastName}</td>
                    <td className="p-4">
                      {a.establishment?.name}
                      {a.establishment?.city && (
                        <span className="block text-xs text-slate-500">{a.establishment.city.name}</span>
                      )}
                    </td>
                    <td className="p-4 max-w-[160px]">
                      <span className="line-clamp-2">{a.reason || '—'}</span>
                    </td>
                    <td className="p-4 max-w-[160px] text-red-600">
                      {a.status === 'REJECTED' ? (a.rejectionReason || '—') : '—'}
                    </td>
                    <td className="p-4"><StatusBadge status={a.status} /></td>
                    <td className="p-4">
                      {['PENDING', 'CONFIRMED'].includes(a.status) && (
                        <button onClick={() => cancel(a.id)} className="text-red-600 text-xs hover:underline">Annuler</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {appointments.length === 0 && <p className="text-center py-8 text-slate-500">Aucun rendez-vous</p>}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Précédent</button>
          <span className="text-sm text-slate-500 py-1">Page {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Suivant</button>
        </div>
      )}
    </div>
  );
}
