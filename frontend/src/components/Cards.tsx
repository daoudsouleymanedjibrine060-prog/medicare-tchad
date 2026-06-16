import { Link } from 'react-router-dom';
import { MapPin, Stethoscope, Phone, Calendar } from 'lucide-react';
import type { Doctor, Establishment } from '../types';

export function DoctorCard({
  doctor,
  publicView = false,
}: {
  doctor: Doctor & { user?: { firstName: string; lastName: string; phone?: string } };
  publicView?: boolean;
}) {
  const est = doctor.establishments?.[0]?.establishment as Establishment | undefined;
  const cityName = est?.city?.name;
  const phone = est?.phone || doctor.user?.phone;
  const detailPath = publicView
    ? `/connexion?redirect=${encodeURIComponent(`/patient/medecins/${doctor.id}`)}`
    : `/patient/medecins/${doctor.id}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-primary-200 transition-all">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
          {doctor.photoUrl ? (
            <img src={doctor.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Stethoscope className="w-7 h-7 text-primary-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900">
            Dr. {doctor.user?.firstName} {doctor.user?.lastName}
          </h3>
          <p className="text-sm text-primary-600">{doctor.specialty?.nameFr}</p>
          {cityName && (
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {cityName}
              {est?.name && <span className="text-slate-400"> — {est.name}</span>}
            </p>
          )}
          {phone && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {phone}
            </p>
          )}
          <Link
            to={detailPath}
            className="inline-flex items-center gap-1 mt-3 text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
          >
            <Calendar className="w-3.5 h-3.5" />
            Prendre rendez-vous
          </Link>
        </div>
      </div>
    </div>
  );
}

export function EstablishmentCard({ est }: { est: Establishment }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="font-medium text-slate-900">{est.name}</h3>
      <p className="text-xs text-primary-600 uppercase mt-1">{est.type.replace('_', ' ')}</p>
      <p className="text-sm text-slate-500 mt-2">{est.address}</p>
      <p className="text-sm text-slate-500">{est.city?.name} — {est.phone}</p>
    </div>
  );
}
