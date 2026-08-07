import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function AdminSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (newPassword !== confirmPassword) {
      setMessage('Erreur : les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      setMessage('Erreur : le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setMessage('Mot de passe mis à jour');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } };
      setMessage(`Erreur : ${apiErr.response?.data?.error || 'impossible de changer le mot de passe'}`);
    } finally {
      setSaving(false);
    }
  };

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
        <button type="button" onClick={() => refreshUser()} className="mt-4 text-sm text-primary-600 hover:underline">
          Actualiser le profil
        </button>
      </div>

      <form onSubmit={changePassword} className="mt-6 bg-white rounded-xl border p-6 max-w-lg space-y-4">
        <h2 className="font-semibold">Changer le mot de passe</h2>
        {message && (
          <p className={`text-sm ${message.startsWith('Erreur') ? 'text-red-600' : 'text-emerald-600'}`}>{message}</p>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Mot de passe actuel</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Confirmer</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
