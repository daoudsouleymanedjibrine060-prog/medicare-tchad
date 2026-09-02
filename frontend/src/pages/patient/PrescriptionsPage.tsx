import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Prescription } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import DashboardHeader from '../../components/DashboardHeader';

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/prescriptions?limit=50')
      .then((res) => setPrescriptions(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <DashboardHeader title="Mes ordonnances" subtitle="Prescriptions délivrées par vos médecins" />
      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <p className="text-slate-500">Aucune ordonnance disponible.</p>
        ) : prescriptions.map((rx) => (
          <div key={rx.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="font-semibold text-slate-900">
              Dr. {rx.doctor?.user?.firstName} {rx.doctor?.user?.lastName}
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
