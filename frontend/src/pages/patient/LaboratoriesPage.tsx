import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import type { Establishment, City } from '../../types';
import EstablishmentList from '../../components/EstablishmentList';
import { CardSkeleton } from '../../components/Skeleton';

const PAGE_SIZE = 10;

export default function LaboratoriesPage() {
  const [labs, setLabs] = useState<Establishment[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadLabs = () => {
    setLoading(true);
    const params = new URLSearchParams({ type: 'LABORATOIRE' });
    if (cityFilter) params.set('city', cityFilter);
    if (search) params.set('search', search);
    api.get(`/establishments?${params}`)
      .then(({ data }) => setLabs(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/users/cities').then(({ data }) => setCities(data));
    loadLabs();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [cityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(labs.length / PAGE_SIZE));
  const paginated = labs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-bold">Laboratoires</h1>
      <p className="text-slate-500 mt-1">Laboratoires d'analyses médicales au Tchad</p>

      <div className="mt-6 bg-white rounded-xl border p-4 grid sm:grid-cols-3 gap-3">
        <input
          placeholder="Rechercher un laboratoire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Toutes les villes</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          onClick={loadLabs}
          className="bg-primary-600 text-white rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2 hover:bg-primary-700"
        >
          <Search className="w-4 h-4" /> Rechercher
        </button>
      </div>

      <div className="mt-6">
        {loading ? <CardSkeleton count={6} /> : (
          <>
            <EstablishmentList items={paginated} emptyMessage="Aucun laboratoire trouvé" />
            {labs.length > PAGE_SIZE && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
                >
                  Précédent
                </button>
                <span className="text-sm text-slate-500 py-1">Page {page} / {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
