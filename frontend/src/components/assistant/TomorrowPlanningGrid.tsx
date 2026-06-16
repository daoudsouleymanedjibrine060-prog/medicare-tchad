import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import api from '../../services/api';

export interface TomorrowSlot {
  time: string;
  available: boolean;
  hasAppointment?: boolean;
}

interface TomorrowPlanningGridProps {
  showHorairesLink?: boolean;
}

export default function TomorrowPlanningGrid({ showHorairesLink = true }: TomorrowPlanningGridProps) {
  const [tomorrow, setTomorrow] = useState<{ date: string; slots: TomorrowSlot[] } | null>(null);
  const [editedSlots, setEditedSlots] = useState<TomorrowSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/appointments/assistant/tomorrow-slots')
      .then(({ data }) => {
        setTomorrow(data);
        setEditedSlots(data.slots);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleSlot = (time: string) => {
    setEditedSlots((prev) => prev.map((s) => {
      if (s.time !== time || s.hasAppointment) return s;
      return { ...s, available: !s.available };
    }));
    setSaveMessage('');
  };

  const saveTomorrow = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      const { data } = await api.put('/appointments/assistant/tomorrow-slots', { slots: editedSlots });
      setTomorrow(data);
      setEditedSlots(data.slots);
      setSaveMessage('Planning enregistré');
    } catch {
      setSaveMessage('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Chargement du planning...</p>;
  }

  if (!tomorrow) return null;

  const hasChanges = JSON.stringify(editedSlots) !== JSON.stringify(tomorrow.slots);
  const dateLabel = new Date(tomorrow.date).toLocaleDateString('fr-FR');

  return (
    <div>
      <h2 className="font-semibold mb-2">Planning de demain ({dateLabel})</h2>
      <p className="text-xs text-slate-500 mb-4">
        Cochez les créneaux disponibles pour les patients. Les créneaux avec RDV patient sont verrouillés.
        Les créneaux décochés ne seront pas réservables par les patients.
      </p>

      {editedSlots.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            Aucun horaire configuré pour demain. Ajoutez des horaires récurrents pour ce jour.
          </p>
          {showHorairesLink && (
            <Link to="/assistant/horaires" className="inline-block mt-3 text-sm text-primary-600 hover:underline font-medium">
              Configurer les horaires récurrents
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {editedSlots.map((s) => (
              <label
                key={s.time}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                  s.hasAppointment
                    ? 'bg-red-50 border-red-200 cursor-not-allowed opacity-70'
                    : s.available
                      ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={s.available}
                  disabled={s.hasAppointment}
                  onChange={() => toggleSlot(s.time)}
                  className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-medium">{s.time}</span>
                {s.hasAppointment && <span className="text-xs text-red-600 ml-auto">RDV</span>}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button
              type="button"
              onClick={saveTomorrow}
              disabled={saving || !hasChanges}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            {saveMessage && <span className="text-sm text-primary-600">{saveMessage}</span>}
          </div>
        </>
      )}

      {showHorairesLink && editedSlots.length > 0 && (
        <Link to="/assistant/horaires" className="inline-block mt-4 text-sm text-primary-600 hover:underline">
          Gérer les horaires complets
        </Link>
      )}
    </div>
  );
}
