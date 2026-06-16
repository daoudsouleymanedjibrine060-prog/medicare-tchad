import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Schedule } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ dayOfWeek: 1, startTime: '08:00', endTime: '12:00', slotDuration: 30 });
  const [editId, setEditId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    api.get('/schedules').then(({ data }) => setSchedules(data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (s: Schedule) => {
    setEditId(s.id);
    setForm({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, slotDuration: s.slotDuration });
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.patch(`/schedules/${editId}`, form);
      } else {
        await api.post('/schedules', form);
      }
      setModalOpen(false);
      setEditId(null);
      setForm({ dayOfWeek: 1, startTime: '08:00', endTime: '12:00', slotDuration: 30 });
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Supprimer cet horaire ?')) return;
    try {
      await api.delete(`/schedules/${id}`);
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Horaires de consultation</h1>
      <p className="text-slate-500 mt-1">Gérer les créneaux récurrents du médecin</p>

      <button
        onClick={() => { setEditId(null); setForm({ dayOfWeek: 1, startTime: '08:00', endTime: '12:00', slotDuration: 30 }); setModalOpen(true); }}
        className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700"
      >
        Ajouter un horaire
      </button>

      <div className="mt-6 bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left p-4">Jour</th>
              <th className="text-left p-4">Horaires</th>
              <th className="text-left p-4">Créneau</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-4">{DAYS[s.dayOfWeek]}</td>
                <td className="p-4">{s.startTime} — {s.endTime}</td>
                <td className="p-4">{s.slotDuration} min</td>
                <td className="p-4 space-x-2">
                  <button onClick={() => openEdit(s)} className="text-primary-600 text-xs hover:underline">Modifier</button>
                  <button onClick={() => remove(s.id)} className="text-red-600 text-xs hover:underline">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} title={editId ? 'Modifier l\'horaire' : 'Ajouter un horaire'} onClose={() => setModalOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-sm mb-1">Jour</label>
            <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Début</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm mb-1">Fin</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Durée (min)</label>
            <input type="number" value={form.slotDuration} onChange={(e) => setForm({ ...form, slotDuration: Number(e.target.value) })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm hover:bg-primary-700">
            Enregistrer
          </button>
        </form>
      </Modal>
    </div>
  );
}
