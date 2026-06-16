import { Fragment, useState } from 'react';
import type { Appointment } from '../../types';
import StatusBadge from '../StatusBadge';

interface AppointmentRequestsTableProps {
  appointments: Appointment[];
  onUpdate: (id: string, status: string, rejectionReason?: string) => Promise<void>;
  compact?: boolean;
}

export default function AppointmentRequestsTable({
  appointments,
  onUpdate,
  compact = false,
}: AppointmentRequestsTableProps) {
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const handleAction = async (id: string, status: string, rejectionReason?: string) => {
    setProcessing(id);
    try {
      await onUpdate(id, status, rejectionReason);
      setRejectId(null);
      setRejectReason('');
    } finally {
      setProcessing(null);
    }
  };

  if (appointments.length === 0) {
    return <p className="text-sm text-slate-500">Aucune demande en attente</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-primary-600 text-white">
            <th className="text-left px-3 py-2.5 font-medium rounded-tl-lg">Patient</th>
            <th className="text-left px-3 py-2.5 font-medium">Coordonnées</th>
            <th className="text-left px-3 py-2.5 font-medium">Adresse</th>
            <th className="text-left px-3 py-2.5 font-medium">Date demandée</th>
            <th className="text-left px-3 py-2.5 font-medium">Heure</th>
            {!compact && <th className="text-left px-3 py-2.5 font-medium">Notes</th>}
            <th className="text-left px-3 py-2.5 font-medium rounded-tr-lg">Action</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <Fragment key={a.id}>
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-3 font-medium">
                  {a.patient?.user?.firstName} {a.patient?.user?.lastName}
                </td>
                <td className="px-3 py-3 text-slate-600">{a.patient?.user?.phone || '—'}</td>
                <td className="px-3 py-3 text-slate-600">{a.patient?.address || 'N/Djamena'}</td>
                <td className="px-3 py-3">{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                <td className="px-3 py-3">{a.startTime}</td>
                {!compact && (
                  <td className="px-3 py-3 text-slate-600 max-w-[160px] truncate" title={a.reason}>
                    {a.reason || '—'}
                  </td>
                )}
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={a.status} />
                    <button
                      type="button"
                      disabled={processing === a.id}
                      onClick={() => handleAction(a.id, 'CONFIRMED')}
                      className="bg-emerald-600 text-white px-2.5 py-1 rounded text-xs hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      disabled={processing === a.id}
                      onClick={() => setRejectId(rejectId === a.id ? null : a.id)}
                      className="bg-red-600 text-white px-2.5 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                    >
                      Refuser
                    </button>
                  </div>
                </td>
              </tr>
              {rejectId === a.id && (
                <tr key={`${a.id}-reject`} className="bg-red-50">
                  <td colSpan={compact ? 6 : 7} className="px-3 py-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Motif du refus (optionnel)"
                        className="flex-1 min-w-[200px] border rounded-lg px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleAction(a.id, 'REJECTED', rejectReason)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
                      >
                        Confirmer le refus
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
