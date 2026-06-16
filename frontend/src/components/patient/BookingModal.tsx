import { useEffect, useState } from 'react';
import { Check, Stethoscope, X } from 'lucide-react';
import api from '../../services/api';
import type { Doctor } from '../../types';

export type SlotStatus = 'available' | 'booked' | 'unavailable';

export interface SlotDetail {
  time: string;
  status: SlotStatus;
}

interface BookingModalProps {
  open: boolean;
  doctorId: string;
  doctor: Doctor & { user?: { firstName: string; lastName: string } };
  establishmentId: string;
  establishments?: { establishment: { id: string; name: string } }[];
  onEstablishmentChange?: (id: string) => void;
  onClose: () => void;
  onSuccess: () => void;
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatLocalDate(tomorrow);
}

function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  return dow === 0 || dow === 6;
}

const SLOT_STYLES: Record<SlotStatus, string> = {
  available: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 cursor-pointer',
  booked: 'bg-red-100 text-red-700 border-red-200 cursor-not-allowed opacity-80',
  unavailable: 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed',
};

export default function BookingModal({
  open,
  doctorId,
  doctor,
  establishmentId,
  establishments,
  onEstablishmentChange,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const minDate = getTomorrow();
  const [date, setDate] = useState(minDate);
  const [slotDetails, setSlotDetails] = useState<SlotDetail[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    setDate(minDate);
    setSelectedSlot('');
    setReason('');
    setMessage('');
    setSlotDetails([]);
  }, [open, minDate]);

  useEffect(() => {
    if (!open || !date || !doctorId || isWeekend(date)) {
      setSlotDetails([]);
      return;
    }

    setLoadingSlots(true);
    setSelectedSlot('');
    api.get(`/doctors/${doctorId}/slots?date=${date}`)
      .then(({ data }) => setSlotDetails(data.slotDetails || []))
      .catch(() => setSlotDetails([]))
      .finally(() => setLoadingSlots(false));
  }, [open, date, doctorId]);

  const availableCount = slotDetails.filter((s) => s.status === 'available').length;

  const book = async () => {
    if (!selectedSlot || !establishmentId || !date) return;
    setBooking(true);
    setMessage('');
    try {
      await api.post('/appointments', {
        doctorId,
        establishmentId,
        date,
        startTime: selectedSlot,
        reason,
      });
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setMessage(msg || 'Erreur lors de la réservation');
    } finally {
      setBooking(false);
    }
  };

  if (!open) return null;

  const canConfirm = !booking && !!selectedSlot && !!date && !isWeekend(date);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Prendre rendez-vous</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {message && (
            <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{message}</div>
          )}

          <div className="bg-primary-50 rounded-xl p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0 overflow-hidden">
              {doctor.photoUrl ? (
                <img src={doctor.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Stethoscope className="w-7 h-7 text-primary-600" />
              )}
            </div>
            <div>
              <p className="font-semibold">Dr. {doctor.user?.firstName} {doctor.user?.lastName}</p>
              <p className="text-sm text-primary-700">{doctor.specialty?.nameFr}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date du rendez-vous</label>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Consultations du lundi au vendredi.</p>
          </div>

          {date && isWeekend(date) && (
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
              Ce jour n&apos;est pas ouvré. Sélectionnez un jour du lundi au vendredi.
            </p>
          )}

          {date && !isWeekend(date) && (
            <div>
              <label className="block text-sm font-medium mb-2">Sélectionner un créneau</label>
              <div className="flex flex-wrap gap-3 text-xs mb-3">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-400" /> Disponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-400" /> Réservé
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-300" /> Indisponible
                </span>
              </div>

              {loadingSlots ? (
                <p className="text-sm text-slate-500">Chargement des créneaux…</p>
              ) : slotDetails.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                  Aucun créneau pour cette date. L&apos;assistant n&apos;a pas encore configuré le planning.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slotDetails.map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      disabled={s.status !== 'available'}
                      onClick={() => s.status === 'available' && setSelectedSlot(s.time)}
                      className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-colors ${
                        selectedSlot === s.time
                          ? 'ring-2 ring-primary-500 ring-offset-1 ' + SLOT_STYLES[s.status]
                          : SLOT_STYLES[s.status]
                      }`}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}

              {!loadingSlots && slotDetails.length > 0 && availableCount === 0 && (
                <p className="text-sm text-amber-700 mt-2">
                  Aucun créneau disponible pour cette date. Choisissez une autre date ouvrée.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Notes (optionnel)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Décrivez le motif de votre consultation..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {establishments && establishments.length > 1 && onEstablishmentChange && (
            <div>
              <label className="block text-sm font-medium mb-1">Établissement</label>
              <select
                value={establishmentId}
                onChange={(e) => onEstablishmentChange(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {establishments.map(({ establishment: e }) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-red-300 text-red-600 py-2.5 rounded-lg text-sm hover:bg-red-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={book}
              disabled={!canConfirm}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 text-white py-2.5 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {booking ? 'Envoi...' : 'Confirmer la réservation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
