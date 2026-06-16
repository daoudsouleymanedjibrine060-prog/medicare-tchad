import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { City } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/patients/profile'),
      api.get('/users/cities'),
    ]).then(([profRes, cityRes]) => {
      const p = profRes.data;
      setProfile({
        firstName: p.user.firstName,
        lastName: p.user.lastName,
        phone: p.user.phone || '+235',
        age: p.age != null ? String(p.age) : '',
        gender: p.gender || 'M',
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
        bloodGroup: p.bloodGroup || '',
        address: p.address || '',
        cityId: p.cityId || '',
      });
      setCities(cityRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/patients/profile', {
        ...profile,
        age: profile.age ? Number(profile.age) : undefined,
      });
      setMessage('Profil mis à jour');
    } catch {
      setMessage('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold">Paramètres</h1>
      <p className="text-slate-500 mt-1">Gérez votre profil patient</p>
      <form onSubmit={save} className="mt-6 bg-white rounded-xl border p-6 max-w-lg space-y-4">
        {message && <div className="text-sm text-emerald-600">{message}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Prénom</label>
            <input value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Âge</label>
            <input type="number" min={1} max={120} value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sexe</label>
            <select value={profile.gender} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Téléphone (+235)</label>
          <input required value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            placeholder="+235XXXXXXXX"
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date de naissance</label>
          <input type="date" value={profile.dateOfBirth} onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Groupe sanguin</label>
          <select value={profile.bloodGroup} onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">—</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ville</label>
          <select value={profile.cityId} onChange={(e) => setProfile({ ...profile, cityId: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">—</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={saving} className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
