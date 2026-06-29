import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Appointment } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import AppointmentRequestsTable from '../../components/assistant/AppointmentRequestsTable';

export default function RequestsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/appointments/mine?status=PENDING')
      .then(({ data }) => setAppointments(data.data))
      .catch(() => setError('Impossible de charger les demandes'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string, rejectionReason?: string) => {
    try {
      await api.patch(`/appointments/${id}/status`, { status, rejectionReason });
      setAppointments((a) => a.filter((apt) => apt.id !== id));
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Demandes de rendez-vous</h1>
      <p className="text-slate-500 mt-1">Valider ou refuser les demandes des patients</p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 bg-white rounded-xl border p-5">
        <AppointmentRequestsTable appointments={appointments} onUpdate={updateStatus} />
      </div>
    </div>
  );
}
