import { useAuth } from '../../contexts/AuthContext';

export default function AdminSettingsPage() {
  const { user, refreshUser } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <p className="text-slate-500 mt-1">Profil administrateur</p>

      <div className="mt-6 bg-white rounded-xl border p-6 max-w-lg">
        <h2 className="font-semibold mb-4">Informations du compte</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Nom</dt><dd>{user?.firstName} {user?.lastName}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{user?.email}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Téléphone</dt><dd>{user?.phone}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Rôle</dt><dd>{user?.role}</dd></div>
        </dl>
        <button onClick={() => refreshUser()} className="mt-4 text-sm text-primary-600 hover:underline">
          Actualiser le profil
        </button>
      </div>
    </div>
  );
}
