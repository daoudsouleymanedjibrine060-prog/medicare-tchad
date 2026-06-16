import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import { Clock, CheckCircle, Users } from 'lucide-react';

import api from '../../services/api';

import type { Appointment, Doctor } from '../../types';

import LoadingSpinner from '../../components/LoadingSpinner';

import TomorrowPlanningGrid from '../../components/assistant/TomorrowPlanningGrid';

import AppointmentRequestsTable from '../../components/assistant/AppointmentRequestsTable';

import DashboardHeader from '../../components/DashboardHeader';



export default function AssistantDashboard() {

  const [stats, setStats] = useState({ pending: 0, confirmed: 0, totalPatients: 0 });

  const [pendingList, setPendingList] = useState<Appointment[]>([]);

  const [doctor, setDoctor] = useState<(Doctor & { user?: { firstName: string; lastName: string } }) | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    Promise.all([

      api.get('/appointments/assistant/stats'),

      api.get('/appointments/mine'),

      api.get('/users/assistant/my-doctor'),

    ]).then(([statsRes, apptRes, doctorRes]) => {

      setStats(statsRes.data);

      setPendingList(apptRes.data.data.filter((a: Appointment) => a.status === 'PENDING').slice(0, 5));

      setDoctor(doctorRes.data);

    }).finally(() => setLoading(false));

  }, []);



  const updateStatus = async (id: string, status: string, rejectionReason?: string) => {

    await api.patch(`/appointments/${id}/status`, { status, rejectionReason });

    setPendingList((list) => list.filter((a) => a.id !== id));

    const statsRes = await api.get('/appointments/assistant/stats');

    setStats(statsRes.data);

  };



  if (loading) return <LoadingSpinner />;



  const doctorName = doctor?.user

    ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`

    : 'médecin assigné';



  return (

    <div>

      <DashboardHeader

        title="Tableau de bord Assistant"

        subtitle={`Gestion des rendez-vous du ${doctorName}`}

      />



      <div className="grid sm:grid-cols-3 gap-4 mt-6">

        <div className="bg-white rounded-xl border p-5">

          <Clock className="w-8 h-8 text-amber-500 mb-2" />

          <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>

          <p className="text-sm text-slate-500">Demandes en attente</p>

        </div>

        <div className="bg-white rounded-xl border p-5">

          <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />

          <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>

          <p className="text-sm text-slate-500">RDV confirmés</p>

        </div>

        <div className="bg-white rounded-xl border p-5">

          <Users className="w-8 h-8 text-blue-500 mb-2" />

          <p className="text-2xl font-bold text-blue-600">{stats.totalPatients}</p>

          <p className="text-sm text-slate-500">Patients total</p>

        </div>

      </div>



      <div className="mt-8 bg-white rounded-xl border p-5">

        <TomorrowPlanningGrid />

      </div>



      <div className="mt-8 bg-white rounded-xl border p-5">

        <div className="flex justify-between items-center mb-4">

          <h2 className="font-semibold">Demandes de rendez-vous</h2>

          <Link to="/assistant/demandes" className="text-sm text-primary-600">Voir tout</Link>

        </div>

        <AppointmentRequestsTable

          appointments={pendingList}

          onUpdate={updateStatus}

          compact

        />

      </div>

    </div>

  );

}

