import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { City } from '../../types';
import MapView from '../../components/MapView';

export default function MapPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    api.get('/users/cities').then(({ data }) => setCities(data));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">Carte des établissements</h1>
      <p className="text-slate-500 mt-1">Hôpitaux, cliniques, cabinets et laboratoires au Tchad</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Toutes les villes</option>
          {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm">
          <option value="">Tous types</option>
          <option value="HOPITAL">Hôpital</option>
          <option value="CLINIQUE">Clinique</option>
          <option value="CABINET">Cabinet</option>
          <option value="CENTRE_SANTE">Centre de santé</option>
          <option value="LABORATOIRE">Laboratoire</option>
        </select>
      </div>

      <div className="mt-4">
        <MapView cityFilter={cityFilter} typeFilter={typeFilter} height="calc(100vh - 16rem)" />
      </div>
    </div>
  );
}
