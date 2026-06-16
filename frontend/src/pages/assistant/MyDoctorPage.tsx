import { useEffect, useState } from 'react';
import { MapPin, Stethoscope, Clock } from 'lucide-react';
import api from '../../services/api';
import type { Doctor, Schedule } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function MyDoctorPage() {
  const [doctor, setDoctor] = useState<(Doctor & { user?: { firstName: string; lastName: string; email: string; phone: string }; schedules?: Schedule[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/assistant/my-doctor').then(({ data }) => setDoctor(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!doctor) return <p className="text-slate-500">Médecin non assigné</p>;

  const est = doctor.establishments?.[0]?.establishment;

  return (
    <div>
      <h1 className="text-2xl font-bold">Mon médecin</h1>
      <p className="text-slate-500 mt-1">Informations sur le médecin assigné</p>

      <div className="mt-6 bg-white rounded-xl border p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            {doctor.photoUrl ? (
              <img src={doctor.photoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <Stethoscope className="w-8 h-8 text-primary-600" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">Dr. {doctor.user?.firstName} {doctor.user?.lastName}</h2>
            <p className="text-primary-600">{doctor.specialty?.nameFr}</p>
            {doctor.licenseNumber && <p className="text-sm text-slate-500 mt-1">Licence : {doctor.licenseNumber}</p>}
            {doctor.bio && <p className="text-sm text-slate-600 mt-2">{doctor.bio}</p>}
          </div>
        </div>

        {est && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h3 className="font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Établissement</h3>
            <p className="text-sm mt-1">{est.name}</p>
            <p className="text-sm text-slate-500">{est.address} — {est.city?.name}</p>
            <p className="text-sm text-slate-500">{est.phone}</p>
          </div>
        )}

        {doctor.schedules && doctor.schedules.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium flex items-center gap-2 mb-3"><Clock className="w-4 h-4" /> Horaires de consultation</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {doctor.schedules.map((s) => (
                <div key={s.id} className="text-sm border rounded-lg px-3 py-2">
                  <span className="font-medium">{DAYS[s.dayOfWeek]}</span>
                  <span className="text-slate-500"> — {s.startTime} à {s.endTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
