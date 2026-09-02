import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Prescription } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import DashboardHeader from '../../components/DashboardHeader';

const emptyItem = { medication: '', dosage: '', frequency: '', duration: '' };

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<{ id: string; label: string }[]>([]);
  const [patientId, setPatientId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([
      api.get('/prescriptions?limit=50'),
      api.get('/appointments/mine?limit=100'),
    ]).then(([rxRes, apptRes]) => {
      setPrescriptions(rxRes.data.data);
      const seen = new Set<string>();
      const list: { id: string; label: string }[] = [];
      for (const appt of apptRes.data.data as { patient?: { id: string; user?: { firstName: string; lastName: string } } }[]) {
        if (appt.patient && !seen.has(appt.patient.id)) {
          seen.add(appt.patient.id);
          list.push({
            id: appt.patient.id,
            label: `${appt.patient.user?.firstName ?? ''} ${appt.patient.user?.lastName ?? ''}`.trim(),
          });
        }
      }
      setPatients(list);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/prescriptions', {
        patientId,
        instructions: instructions || undefined,
        items: items.filter((i) => i.medication.trim()).map((i) => ({
          medication: i.medication,
          dosage: i.dosage,
          frequency: i.frequency,
          duration: i.duration || undefined,
        })),
      });
      setPatientId('');
      setInstructions('');
      setItems([{ ...emptyItem }]);
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Ordonnances"
        subtitle="Prescriptions pour vos patients"
        action={(
          <button type="button" onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-500">
            {showForm ? 'Annuler' : 'Nouvelle ordonnance'}
          </button>
        )}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <select required value={patientId} onChange={(e) => setPatientId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2">
            <option value="">Patient</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <textarea placeholder="Instructions générales" value={instructions} onChange={(e) => setInstructions(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" rows={2} />
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input required placeholder="Médicament" value={item.medication} onChange={(e) => { const next = [...items]; next[idx].medication = e.target.value; setItems(next); }} className="border border-slate-300 rounded-lg px-3 py-2" />
              <input required placeholder="Dosage" value={item.dosage} onChange={(e) => { const next = [...items]; next[idx].dosage = e.target.value; setItems(next); }} className="border border-slate-300 rounded-lg px-3 py-2" />
              <input required placeholder="Fréquence" value={item.frequency} onChange={(e) => { const next = [...items]; next[idx].frequency = e.target.value; setItems(next); }} className="border border-slate-300 rounded-lg px-3 py-2" />
              <input placeholder="Durée" value={item.duration} onChange={(e) => { const next = [...items]; next[idx].duration = e.target.value; setItems(next); }} className="border border-slate-300 rounded-lg px-3 py-2" />
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, { ...emptyItem }])} className="text-sm text-primary-600">+ Ajouter un médicament</button>
          <button type="submit" disabled={saving} className="block px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Créer l\'ordonnance'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <p className="text-slate-500">Aucune ordonnance.</p>
        ) : prescriptions.map((rx) => (
          <div key={rx.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="font-semibold text-slate-900">
              {rx.patient?.user ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}` : 'Patient'}
              <span className="text-sm font-normal text-slate-500 ml-2">{new Date(rx.createdAt).toLocaleDateString('fr-FR')}</span>
            </p>
            {rx.instructions && <p className="text-sm text-slate-600 mt-1">{rx.instructions}</p>}
            <ul className="mt-3 space-y-1">
              {rx.items?.map((item) => (
                <li key={item.id} className="text-sm text-slate-700">
                  <span className="font-medium">{item.medication}</span> — {item.dosage}, {item.frequency}{item.duration ? ` (${item.duration})` : ''}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
