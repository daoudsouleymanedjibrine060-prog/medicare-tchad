import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { User, Establishment, Appointment, City, Specialty, Role } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';

type Tab = 'patients' | 'doctors' | 'assistants' | 'establishments' | 'appointments' | 'admins';
export type AdminSection = Tab | 'cabinets' | 'laboratoires';

const SECTION_TITLES: Record<AdminSection, string> = {
  patients: 'Gestion des patients',
  doctors: 'Gestion des médecins',
  assistants: 'Gestion des assistants',
  establishments: 'Gestion des établissements',
  cabinets: 'Gestion des cabinets médicaux',
  laboratoires: 'Gestion des laboratoires',
  appointments: 'Gestion des rendez-vous',
  admins: 'Gestion des administrateurs',
};

const emptyUserForm = {
  email: '', phone: '+235', password: '', firstName: '', lastName: '',
  role: 'PATIENT' as Role, specialtyId: '', doctorId: '', scope: '',
};

const emptyEstForm = {
  name: '', type: 'CABINET', address: '', phone: '+235', cityId: '', latitude: 12.13, longitude: 15.05,
  parentEstablishmentId: '',
};

export default function AdminManagementPage({ section }: { section?: AdminSection }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const resolvedTab: Tab =
    section === 'cabinets' || section === 'laboratoires' ? 'establishments' :
    section === 'admins' ? 'admins' :
    (section as Tab) || 'patients';
  const [tab, setTab] = useState<Tab>(resolvedTab);
  const [users, setUsers] = useState<User[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userModal, setUserModal] = useState(false);
  const [estModal, setEstModal] = useState(false);
  const [editingEstId, setEditingEstId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [parentEstablishments, setParentEstablishments] = useState<Establishment[]>([]);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [estForm, setEstForm] = useState(emptyEstForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (section) setTab(resolvedTab); }, [section, resolvedTab]);

  const filterEstablishments = (data: Establishment[]) => {
    if (section === 'cabinets') return data.filter((e) => ['CABINET', 'CLINIQUE'].includes(e.type));
    if (section === 'laboratoires') return data.filter((e) => e.type === 'LABORATOIRE');
    return data;
  };

  const load = () => {
    setLoading(true);
    if (tab === 'establishments') {
      api.get('/establishments').then(({ data }) => setEstablishments(filterEstablishments(data))).finally(() => setLoading(false));
    } else if (tab === 'appointments') {
      api.get('/appointments').then(({ data }) => setAppointments(data.data)).finally(() => setLoading(false));
    } else if (tab === 'admins') {
      api.get('/users?role=ADMIN').then(({ data }) => setUsers(data)).finally(() => setLoading(false));
    } else {
      const roleMap: Record<string, string> = { patients: 'PATIENT', doctors: 'DOCTOR', assistants: 'ASSISTANT' };
      api.get(`/users?role=${roleMap[tab]}`).then(({ data }) => setUsers(data)).finally(() => setLoading(false));
    }
  };

  useEffect(() => { load(); }, [tab, section]);

  useEffect(() => {
    Promise.all([
      api.get('/users/cities'),
      api.get('/doctors/specialties/list'),
      api.get('/users?role=DOCTOR'),
      api.get('/establishments'),
    ]).then(([c, s, d, est]) => {
      setCities(c.data);
      setSpecialties(s.data);
      setDoctors(d.data);
      setParentEstablishments(est.data.filter((e: Establishment) => e.type !== 'LABORATOIRE'));
    });
  }, []);

  const saveEstablishment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...estForm,
        latitude: Number(estForm.latitude),
        longitude: Number(estForm.longitude),
        parentEstablishmentId: estForm.parentEstablishmentId || null,
      };
      if (editingEstId) {
        await api.patch(`/establishments/${editingEstId}`, payload);
      } else {
        await api.post('/establishments', payload);
      }
      setEstModal(false);
      setEditingEstId(null);
      setEstForm(emptyEstForm);
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const deleteEstablishment = async (id: string) => {
    if (!confirm('Supprimer cet établissement ?')) return;
    try {
      await api.delete(`/establishments/${id}`);
      load();
    } catch {
      alert('Suppression impossible (réservée au super-admin ou établissement lié)');
    }
  };

  const openEditEstablishment = (e: Establishment) => {
    setEditingEstId(e.id);
    setEstForm({
      name: e.name,
      type: e.type,
      address: e.address,
      phone: e.phone,
      cityId: (e as Establishment & { cityId?: string }).cityId || cities.find((c) => c.name === e.city?.name)?.id || '',
      latitude: e.latitude,
      longitude: e.longitude,
      parentEstablishmentId: e.parentEstablishmentId || '',
    });
    setEstModal(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingUserId) {
        await api.patch(`/users/${editingUserId}`, {
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          email: userForm.email,
          phone: userForm.phone,
        });
      } else {
        await api.post('/users', userForm);
      }
      setUserModal(false);
      setEditingUserId(null);
      setUserForm(emptyUserForm);
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const openEditUser = (u: User) => {
    setEditingUserId(u.id);
    setUserForm({
      email: u.email,
      phone: u.phone,
      password: '',
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      specialtyId: '',
      doctorId: '',
      scope: u.admin?.scope || '',
    });
    setUserModal(true);
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    let rejectionReason: string | undefined;
    if (status === 'REJECTED') {
      const reason = prompt('Motif du refus :');
      if (!reason?.trim()) return;
      rejectionReason = reason.trim();
    }
    try {
      await api.patch(`/appointments/${id}/status`, { status, ...(rejectionReason && { rejectionReason }) });
      load();
    } catch (err: unknown) {
      alert((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur');
    }
  };

  const toggleUser = async (id: string) => {
    await api.patch(`/users/${id}/toggle`);
    load();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'patients', label: 'Patients' },
    { id: 'doctors', label: 'Médecins' },
    { id: 'assistants', label: 'Assistants' },
    { id: 'establishments', label: 'Établissements' },
    { id: 'appointments', label: 'Rendez-vous' },
  ];

  const defaultRoleForTab = (): Role => {
    if (tab === 'doctors') return 'DOCTOR';
    if (tab === 'assistants') return 'ASSISTANT';
    return 'PATIENT';
  };

  const pageTitle = section ? SECTION_TITLES[section] : 'Gestion';

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        {tab !== 'appointments' && (
          <button
            onClick={() => {
              setError('');
              if (tab === 'establishments') {
                setEditingEstId(null);
                setEstForm({
                  ...emptyEstForm,
                  type: section === 'laboratoires' ? 'LABORATOIRE' : section === 'cabinets' ? 'CABINET' : 'HOPITAL',
                });
                setEstModal(true);
              }
              else { setEditingUserId(null); setUserForm({ ...emptyUserForm, role: tab === 'admins' ? 'ADMIN' : defaultRoleForTab() }); setUserModal(true); }
            }}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        )}
      </div>

      {!section && (
      <div className="flex flex-wrap gap-2 mt-4">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm ${tab === t.id ? 'bg-primary-600 text-white' : 'bg-white border text-slate-600'}`}>
            {t.label}
          </button>
        ))}
      </div>
      )}

      <div className="mt-6 bg-white rounded-xl border overflow-hidden">
        {loading ? <LoadingSpinner /> : tab === 'establishments' ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>
              <th className="text-left p-4">Nom</th><th className="text-left p-4">Type</th><th className="text-left p-4">Ville</th>
              {section === 'laboratoires' && <th className="text-left p-4">Rattaché à</th>}
              <th className="text-left p-4">Téléphone</th><th className="text-left p-4">Actions</th>
            </tr></thead>
            <tbody>{establishments.map((e) => (
              <tr key={e.id} className="border-b">
                <td className="p-4">{e.name}</td><td className="p-4">{e.type}</td><td className="p-4">{e.city?.name}</td>
                {section === 'laboratoires' && <td className="p-4">{e.parentEstablishment?.name || '—'}</td>}
                <td className="p-4">{e.phone}</td>
                <td className="p-4 space-x-2">
                  <button onClick={() => openEditEstablishment(e)} className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Modifier</button>
                  {isSuperAdmin && (
                    <button onClick={() => deleteEstablishment(e.id)} className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Supprimer</button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        ) : tab === 'appointments' ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>
              <th className="text-left p-4">Date</th><th className="text-left p-4">Patient</th><th className="text-left p-4">Médecin</th><th className="text-left p-4">Statut</th><th className="text-left p-4">Actions</th>
            </tr></thead>
            <tbody>{appointments.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-4">{new Date(a.date).toLocaleDateString('fr-FR')} {a.startTime}</td>
                <td className="p-4">{a.patient?.user?.firstName} {a.patient?.user?.lastName}</td>
                <td className="p-4">Dr. {a.doctor?.user?.firstName} {a.doctor?.user?.lastName}</td>
                <td className="p-4"><StatusBadge status={a.status} /></td>
                <td className="p-4 space-x-2">
                  {a.status === 'PENDING' && (
                    <>
                      <button onClick={() => updateAppointmentStatus(a.id, 'CONFIRMED')} className="text-xs text-green-600 hover:underline">Confirmer</button>
                      <button onClick={() => updateAppointmentStatus(a.id, 'REJECTED')} className="text-xs text-red-600 hover:underline">Rejeter</button>
                    </>
                  )}
                  {['PENDING', 'CONFIRMED'].includes(a.status) && (
                    <button onClick={() => updateAppointmentStatus(a.id, 'CANCELLED')} className="text-xs text-slate-600 hover:underline">Annuler</button>
                  )}
                </td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b"><tr>
              <th className="text-left p-4">Nom</th><th className="text-left p-4">Email</th><th className="text-left p-4">Téléphone</th><th className="text-left p-4">Statut</th><th className="text-left p-4">Actions</th>
            </tr></thead>
            <tbody>{users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-4">{u.firstName} {u.lastName}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">{u.phone}</td>
                <td className="p-4">{u.isActive ? 'Actif' : 'Inactif'}</td>
                <td className="p-4">
                  <button onClick={() => openEditUser(u)} className="text-xs text-primary-600 hover:underline mr-2">Modifier</button>
                  <button onClick={() => toggleUser(u.id)} className="text-xs text-primary-600 hover:underline">
                    {u.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <Modal open={userModal} title={editingUserId ? 'Modifier un utilisateur' : 'Créer un utilisateur'} onClose={() => { setUserModal(false); setEditingUserId(null); }}>
        <form onSubmit={saveUser} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="Prénom" value={userForm.firstName} onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Nom" value={userForm.lastName} onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <input required type="email" placeholder="Email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input required placeholder="Téléphone +235" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          {!editingUserId && (
          <input required type="password" placeholder="Mot de passe" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          )}
          {!editingUserId && (
          <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as Role })} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Médecin</option>
            <option value="ASSISTANT">Assistant</option>
            {isSuperAdmin && <option value="ADMIN">Admin</option>}
          </select>
          )}
          {!editingUserId && userForm.role === 'DOCTOR' && (
            <select required value={userForm.specialtyId} onChange={(e) => setUserForm({ ...userForm, specialtyId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Spécialité</option>
              {specialties.map((s) => <option key={s.id} value={s.id}>{s.nameFr}</option>)}
            </select>
          )}
          {!editingUserId && userForm.role === 'ASSISTANT' && (
            <select required value={userForm.doctorId} onChange={(e) => setUserForm({ ...userForm, doctorId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Médecin assigné</option>
              {doctors.map((d) => <option key={d.id} value={d.doctor?.id}>{d.firstName} {d.lastName}</option>)}
            </select>
          )}
          {!editingUserId && userForm.role === 'ADMIN' && (
            <input placeholder="Scope (ex: N'Djamena)" value={userForm.scope} onChange={(e) => setUserForm({ ...userForm, scope: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          )}
          <button type="submit" disabled={saving} className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Enregistrement...' : editingUserId ? 'Enregistrer' : 'Créer'}
          </button>
        </form>
      </Modal>

      <Modal open={estModal} title={editingEstId ? 'Modifier un établissement' : 'Créer un établissement'} onClose={() => { setEstModal(false); setEditingEstId(null); }}>
        <form onSubmit={saveEstablishment} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input required placeholder="Nom" value={estForm.name} onChange={(e) => setEstForm({ ...estForm, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <select value={estForm.type} onChange={(e) => setEstForm({ ...estForm, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="HOPITAL">Hôpital</option>
            <option value="CLINIQUE">Clinique</option>
            <option value="CABINET">Cabinet</option>
            <option value="CENTRE_SANTE">Centre de santé</option>
            <option value="LABORATOIRE">Laboratoire</option>
          </select>
          <textarea required placeholder="Adresse" value={estForm.address} onChange={(e) => setEstForm({ ...estForm, address: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
          <input required placeholder="Téléphone" value={estForm.phone} onChange={(e) => setEstForm({ ...estForm, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <select required value={estForm.cityId} onChange={(e) => setEstForm({ ...estForm, cityId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Ville</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(estForm.type === 'LABORATOIRE' || section === 'laboratoires') && (
            <select value={estForm.parentEstablishmentId} onChange={(e) => setEstForm({ ...estForm, parentEstablishmentId: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Établissement parent (optionnel)</option>
              {parentEstablishments.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" step="any" placeholder="Latitude" value={estForm.latitude} onChange={(e) => setEstForm({ ...estForm, latitude: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm" />
            <input required type="number" step="any" placeholder="Longitude" value={estForm.longitude} onChange={(e) => setEstForm({ ...estForm, longitude: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-sm" />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50">
            {saving ? 'Enregistrement...' : editingEstId ? 'Enregistrer' : 'Créer'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
