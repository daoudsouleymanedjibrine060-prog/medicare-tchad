import { MapPin, Phone, FlaskConical } from 'lucide-react';
import type { Establishment } from '../types';

const TYPE_LABELS: Record<string, string> = {
  HOPITAL: 'Hôpital',
  CLINIQUE: 'Clinique',
  CABINET: 'Cabinet',
  CENTRE_SANTE: 'Centre de santé',
  LABORATOIRE: 'Laboratoire',
};

interface EstablishmentListProps {
  items: Establishment[];
  emptyMessage?: string;
}

export default function EstablishmentList({ items, emptyMessage = 'Aucun établissement trouvé' }: EstablishmentListProps) {
  if (items.length === 0) {
    return <p className="text-center text-slate-500 py-12">{emptyMessage}</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((e) => (
        <div key={e.id} className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-50 rounded-lg">
              <FlaskConical className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900">{e.name}</h3>
              <p className="text-xs text-primary-600 mt-0.5">{TYPE_LABELS[e.type] || e.type}</p>
              <p className="text-sm text-slate-500 mt-2 flex items-start gap-1">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{e.address}{e.city ? ` — ${e.city.name}` : ''}</span>
              </p>
              <p className="text-sm text-slate-600 mt-1 flex items-center gap-1">
                <Phone className="w-4 h-4" />
                <a href={`tel:${e.phone}`} className="hover:text-primary-600">{e.phone}</a>
              </p>
              <a
                href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-xs text-primary-600 hover:underline"
              >
                Ouvrir dans Google Maps
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
