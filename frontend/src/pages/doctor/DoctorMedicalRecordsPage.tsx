import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { MedicalRecord } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import DashboardHeader from '../../components/DashboardHeader';

const emptyForm = {
  patientId: '',
  title: '',
  diagnosis: '',
  symptoms: '',
  notes: '',
  bloodPressure: '',
  heartRate: '',
  temperature: '',
  weight: '',
};

export default function DoctorMedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<{ id: string; label: string }[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    Promise.all([
      api.get('/medical-records?limit=50'),
      api.get('/appointments/mine?limit=100'),
    ]).then(([recordsRes, apptRes]) => {
      setRecords(recordsRes.data.data);
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
      await api.post('/medical-records', {
        patientId: form.patientId,
        title: form.title,
        diagnosis: form.diagnosis || undefined,
        symptoms: form.symptoms || undefined,
        notes: form.notes || undefined,
        bloodPressure: form.bloodPressure || undefined,
        heartRate: form.heartRate ? Number(form.heartRate) : undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
      });
      setForm(emptyForm);
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
        title="Dossiers médicaux"
        subtitle="Consultations et notes cliniques"
        action={(
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-500"
          >
            {showForm ? 'Annuler' : 'Nouveau dossier'}
          </button>
        )}
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
            <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2">
              <option value="">Sélectionner</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titre</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Diagnostic" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input placeholder="Symptômes" value={form.symptoms} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input placeholder="Tension (ex. 120/80)" value={form.bloodPressure} onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input type="number" min={30} max={250} placeholder="Fréquence cardiaque" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input type="number" step="0.1" min={30} max={45} placeholder="Température (°C)" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
            <input type="number" step="0.1" min={0} max={300} placeholder="Poids (kg)" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="border border-slate-300 rounded-lg px-3 py-2" />
          </div>
          <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2" rows={3} />
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {records.length === 0 ? (
          <p className="text-slate-500">Aucun dossier médical.</p>
        ) : records.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">{r.title}</h3>
                <p className="text-sm text-slate-500">
                  {r.patient?.user ? `${r.patient.user.firstName} ${r.patient.user.lastName}` : 'Patient'} — {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            {r.diagnosis && <p className="mt-2 text-sm"><span className="font-medium">Diagnostic :</span> {r.diagnosis}</p>}
            {r.symptoms && <p className="text-sm text-slate-600">Symptômes : {r.symptoms}</p>}
            {r.notes && <p className="text-sm text-slate-600 mt-1">{r.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
