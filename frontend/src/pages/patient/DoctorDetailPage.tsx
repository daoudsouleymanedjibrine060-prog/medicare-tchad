import { useEffect, useState } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { MapPin, Calendar, Phone, Stethoscope } from 'lucide-react';

import api from '../../services/api';

import type { Doctor } from '../../types';

import LoadingSpinner from '../../components/LoadingSpinner';

import BookingModal from '../../components/patient/BookingModal';



const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];



export default function DoctorDetailPage() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<Doctor & { user?: { firstName: string; lastName: string; phone?: string } } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);

  const [establishmentId, setEstablishmentId] = useState('');

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    api.get(`/doctors/${id}`).then(({ data }) => {

      setDoctor(data);

      if (data.establishments?.[0]) {

        setEstablishmentId(data.establishments[0].establishment.id);

      }

    }).finally(() => setLoading(false));

  }, [id]);



  const consultationDays = doctor?.schedules

    ? [...new Set(doctor.schedules.map((s) => s.dayOfWeek))].sort().map((d) => DAY_NAMES[d]).join(', ')

    : 'Lundi – Vendredi';



  if (loading) return <LoadingSpinner />;

  if (!doctor) return <p>Médecin introuvable</p>;



  const est = doctor.establishments?.[0]?.establishment;

  const displayPhone = est?.phone || doctor.user?.phone;



  return (

    <div>

      <div className="bg-white rounded-xl border p-6">

        <div className="flex items-start gap-4">

          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">

            {doctor.photoUrl ? (

              <img src={doctor.photoUrl} alt="" className="w-full h-full object-cover" />

            ) : (

              <Stethoscope className="w-10 h-10 text-primary-600" />

            )}

          </div>

          <div className="flex-1">

            <h1 className="text-2xl font-bold">Dr. {doctor.user?.firstName} {doctor.user?.lastName}</h1>

            <p className="text-primary-600 mt-1">{doctor.specialty?.nameFr}</p>

            {displayPhone && (

              <p className="text-sm text-slate-600 mt-2 flex items-center gap-1">

                <Phone className="w-4 h-4" /> {displayPhone}

              </p>

            )}

          </div>

        </div>

        {doctor.bio && <p className="text-slate-600 mt-4 text-sm">{doctor.bio}</p>}



        <p className="text-sm text-slate-500 mt-4">

          Jours de consultation : <span className="font-medium text-slate-700">{consultationDays}</span>

        </p>



        <div className="mt-4 space-y-2">

          {doctor.establishments?.map(({ establishment: e }) => (

            <div key={e.id} className="flex items-center gap-2 text-sm text-slate-600">

              <MapPin className="w-4 h-4 shrink-0" />

              {e.name} — {e.city?.name}

            </div>

          ))}

        </div>



        <button

          onClick={() => setModalOpen(true)}

          className="mt-6 inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-primary-700"

        >

          <Calendar className="w-4 h-4" />

          Prendre rendez-vous

        </button>

      </div>



      <BookingModal

        open={modalOpen}

        doctorId={id!}

        doctor={doctor}

        establishmentId={establishmentId}

        establishments={doctor.establishments}

        onEstablishmentChange={setEstablishmentId}

        onClose={() => setModalOpen(false)}

        onSuccess={() => {

          setModalOpen(false);

          navigate('/patient/rendez-vous');

        }}

      />

    </div>

  );

}

