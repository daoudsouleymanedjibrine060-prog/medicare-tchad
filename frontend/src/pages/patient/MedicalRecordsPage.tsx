import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { MedicalRecord } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import DashboardHeader from '../../components/DashboardHeader';

export default function PatientMedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/medical-records?limit=50')
      .then((res) => setRecords(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <DashboardHeader title="Mon dossier médical" subtitle="Historique de vos consultations" />
      <div className="space-y-4">
        {records.length === 0 ? (
          <p className="text-slate-500">Aucun dossier médical disponible.</p>
        ) : records.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900">{r.title}</h3>
            <p className="text-sm text-slate-500">
              Dr. {r.doctor?.user?.firstName} {r.doctor?.user?.lastName} — {new Date(r.createdAt).toLocaleDateString('fr-FR')}
            </p>
            {r.diagnosis && <p className="mt-2 text-sm"><span className="font-medium">Diagnostic :</span> {r.diagnosis}</p>}
            {r.symptoms && <p className="text-sm text-slate-600">Symptômes : {r.symptoms}</p>}
            {r.bloodPressure && <p className="text-sm text-slate-600">Tension : {r.bloodPressure}</p>}
            {r.notes && <p className="text-sm text-slate-600 mt-1">{r.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
