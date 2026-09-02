import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Appointment } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import AppointmentRequestsTable from '../../components/assistant/AppointmentRequestsTable';
import DashboardHeader from '../../components/DashboardHeader';

export default function DoctorRequestsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/appointments/mine?status=PENDING&limit=50')
      .then((res) => setAppointments(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id: string, status: string, rejectionReason?: string) => {
    await api.patch(`/appointments/${id}/status`, { status, rejectionReason });
    setAppointments((list) => list.filter((a) => a.id !== id));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <DashboardHeader title="Demandes de rendez-vous" subtitle="Confirmez ou refusez les demandes de vos patients" />
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {appointments.length === 0 ? (
          <p className="text-slate-500">Aucune demande en attente.</p>
        ) : (
          <AppointmentRequestsTable appointments={appointments} onUpdate={updateStatus} />
        )}
      </div>
    </div>
  );
}
