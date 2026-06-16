import { useEffect, useState, useRef } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import type { Doctor, Specialty, City } from '../../types';
import { DoctorCard } from '../../components/Cards';
import { CardSkeleton } from '../../components/Skeleton';

const PAGE_SIZE = 10;

export default function DoctorsSearchPage({ publicView = false }: { publicView?: boolean }) {
  const [doctors, setDoctors] = useState<(Doctor & { user?: { firstName: string; lastName: string; phone?: string } })[]>([]);
  const [total, setTotal] = useState(0);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [filters, setFilters] = useState({ specialty: '', city: '', name: '' });
  const [debouncedName, setDebouncedName] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const isFirstRender = useRef(true);

  const loadDoctors = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    if (filters.specialty) params.set('specialty', filters.specialty);
    if (filters.city) params.set('city', filters.city);
    if (debouncedName) params.set('name', debouncedName);
    api.get(`/doctors?${params}`)
      .then(({ data }) => {
        setDoctors(data.data);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      api.get('/doctors/specialties/list'),
      api.get('/users/cities'),
    ]).then(([specRes, cityRes]) => {
      setSpecialties(specRes.data);
      setCities(cityRes.data);
    });
    loadDoctors(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedName(filters.name), 300);
    return () => clearTimeout(timer);
  }, [filters.name]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPage(1);
    loadDoctors(1);
  }, [filters.specialty, filters.city, debouncedName]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={publicView ? 'max-w-7xl mx-auto px-4 py-8' : ''}>
      <h1 className="text-2xl font-bold">Rechercher un médecin</h1>
      <p className="text-slate-500 mt-1">Par spécialité, ville ou nom — Tchad (+235)</p>

      <div className="mt-6 bg-white rounded-xl border p-4 grid sm:grid-cols-4 gap-3">
        <input
          placeholder="Nom du médecin..."
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select value={filters.specialty} onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes spécialités</option>
          {specialties.map((s) => <option key={s.id} value={s.id}>{s.nameFr}</option>)}
        </select>
        <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes villes</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => loadDoctors(page)} className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2 hover:bg-primary-700">
          <Search className="w-4 h-4" /> Rechercher
        </button>
      </div>

      <div className="mt-6">
        {loading ? <CardSkeleton count={4} /> : doctors.length === 0 ? (
          <p className="text-center text-slate-500 py-12">Aucun médecin trouvé</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              {doctors.map((d) => <DoctorCard key={d.id} doctor={d} publicView={publicView} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); loadDoctors(p); }}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Précédent</button>
                <span className="text-sm text-slate-500 py-1">Page {page} / {totalPages} ({total} médecins)</span>
                <button disabled={page >= totalPages} onClick={() => { const p = page + 1; setPage(p); loadDoctors(p); }}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Suivant</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
