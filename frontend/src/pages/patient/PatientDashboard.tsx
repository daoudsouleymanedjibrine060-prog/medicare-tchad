import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import { Calendar, Clock, MessageSquare, CalendarCheck } from 'lucide-react';

import api from '../../services/api';

import { useAuth } from '../../contexts/AuthContext';

import type { Appointment, Notification, Establishment } from '../../types';

import { EstablishmentCard } from '../../components/Cards';

import StatusBadge from '../../components/StatusBadge';

import LoadingSpinner from '../../components/LoadingSpinner';

import DashboardHeader from '../../components/DashboardHeader';



export default function PatientDashboard() {

  const { user } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [cabinets, setCabinets] = useState<Establishment[]>([]);

  const [loading, setLoading] = useState(true);

  const [cancelling, setCancelling] = useState<string | null>(null);



  const load = () => {

    Promise.all([

      api.get('/appointments/mine?limit=10'),

      api.get('/notifications'),

      api.get('/establishments?type=CABINET'),

    ]).then(([aptRes, notifRes, estRes]) => {

      setAppointments(aptRes.data.data);

      setNotifications(notifRes.data.notifications);

      const all = estRes.data as Establishment[];

      setCabinets(all.filter((e) => ['CABINET', 'CLINIQUE'].includes(e.type)).slice(0, 6));

    }).finally(() => setLoading(false));

  };



  useEffect(() => { load(); }, []);



  const today = new Date();

  today.setHours(0, 0, 0, 0);



  const upcoming = appointments.filter((a) => {

    if (a.status !== 'CONFIRMED') return false;

    const d = new Date(a.date);

    d.setHours(0, 0, 0, 0);

    return d >= today;

  });



  const pending = appointments.filter((a) => a.status === 'PENDING');

  const unreadMessages = notifications.filter((n) => !n.isRead).length;



  const cancelAppointment = async (id: string) => {

    if (!confirm('Annuler ce rendez-vous ?')) return;

    setCancelling(id);

    try {

      await api.patch(`/appointments/${id}/status`, { status: 'CANCELLED' });

      load();

    } finally {

      setCancelling(null);

    }

  };



  if (loading) return <LoadingSpinner />;



  const firstName = user?.firstName || 'Patient';



  return (

    <div>

      <DashboardHeader

        title={`Bienvenue, ${firstName}`}

        subtitle="Votre espace patient — MediCare Tchad"

      />



      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">

        <div className="bg-white rounded-xl border p-5">

          <Calendar className="w-8 h-8 text-primary-600 mb-2" />

          <p className="text-2xl font-bold">{appointments.length}</p>

          <p className="text-sm text-slate-500">Total rendez-vous</p>

        </div>

        <div className="bg-white rounded-xl border p-5">

          <CalendarCheck className="w-8 h-8 text-emerald-600 mb-2" />

          <p className="text-2xl font-bold">{upcoming.length}</p>

          <p className="text-sm text-slate-500">À venir</p>

        </div>

        <div className="bg-white rounded-xl border p-5">

          <Clock className="w-8 h-8 text-amber-600 mb-2" />

          <p className="text-2xl font-bold">{pending.length}</p>

          <p className="text-sm text-slate-500">En attente</p>

        </div>

        <div className="bg-white rounded-xl border p-5">

          <MessageSquare className="w-8 h-8 text-blue-600 mb-2" />

          <p className="text-2xl font-bold">{unreadMessages}</p>

          <p className="text-sm text-slate-500">Messages non lus</p>

        </div>

      </div>



      <div className="mt-8 bg-white rounded-xl border overflow-hidden">

        <div className="flex justify-between items-center p-5 pb-0">

          <h2 className="font-semibold">Mes rendez-vous</h2>

          <Link to="/patient/rendez-vous" className="text-sm text-primary-600">Voir tout</Link>

        </div>

        {appointments.length === 0 ? (

          <p className="text-sm text-slate-500 p-5">Aucun rendez-vous</p>

        ) : (

          <div className="overflow-x-auto mt-4">

            <table className="w-full text-sm">

              <thead>

                <tr className="bg-primary-600 text-white">

                  <th className="text-left px-4 py-2.5 font-medium">Médecin</th>

                  <th className="text-left px-4 py-2.5 font-medium">Spécialité</th>

                  <th className="text-left px-4 py-2.5 font-medium">Date</th>

                  <th className="text-left px-4 py-2.5 font-medium">Heure</th>

                  <th className="text-left px-4 py-2.5 font-medium">Statut</th>

                  <th className="text-left px-4 py-2.5 font-medium">Action</th>

                </tr>

              </thead>

              <tbody>

                {appointments.slice(0, 10).map((a) => (

                  <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">

                    <td className="px-4 py-3">

                      <div className="flex items-center gap-2">

                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-semibold text-primary-700">

                          {a.doctor?.user?.firstName?.[0]}{a.doctor?.user?.lastName?.[0]}

                        </div>

                        <span className="font-medium">

                          Dr. {a.doctor?.user?.firstName} {a.doctor?.user?.lastName}

                        </span>

                      </div>

                    </td>

                    <td className="px-4 py-3 text-slate-600">{a.doctor?.specialty?.nameFr || '—'}</td>

                    <td className="px-4 py-3">{new Date(a.date).toLocaleDateString('fr-FR')}</td>

                    <td className="px-4 py-3">{a.startTime}</td>

                    <td className="px-4 py-3"><StatusBadge status={a.status} /></td>

                    <td className="px-4 py-3">

                      {['PENDING', 'CONFIRMED'].includes(a.status) ? (

                        <button

                          type="button"

                          disabled={cancelling === a.id}

                          onClick={() => cancelAppointment(a.id)}

                          className="text-xs text-red-600 border border-red-300 px-2.5 py-1 rounded hover:bg-red-50 disabled:opacity-50"

                        >

                          Annuler

                        </button>

                      ) : (

                        <span className="text-slate-400">—</span>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>



      <div className="mt-8">

        <div className="flex justify-between items-center mb-4">

          <h2 className="font-semibold">Cabinets disponibles</h2>

          <Link to="/patient/carte" className="text-sm text-primary-600">Voir sur la carte</Link>

        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {cabinets.map((c) => <EstablishmentCard key={c.id} est={c} />)}

        </div>

      </div>

    </div>

  );

}

