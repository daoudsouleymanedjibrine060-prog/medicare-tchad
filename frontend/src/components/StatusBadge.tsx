import clsx from 'clsx';

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: 'Confirmé', className: 'bg-emerald-100 text-emerald-800' },
  REJECTED: { label: 'Refusé', className: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Annulé', className: 'bg-slate-100 text-slate-600' },
  COMPLETED: { label: 'Terminé', className: 'bg-blue-100 text-blue-800' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={clsx('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}
