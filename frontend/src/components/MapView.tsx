import { lazy, Suspense, useEffect, useState } from 'react';
import api from '../services/api';
import type { Establishment } from '../types';
import LoadingSpinner from './LoadingSpinner';

const OsmMapView = lazy(() => import('./OsmMapView'));
const GoogleMapView = lazy(() => import('./GoogleMapView'));

const CHAD_CENTER: [number, number] = [12.1348, 15.0557];
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

interface MapViewProps {
  cityFilter?: string;
  typeFilter?: string;
  height?: string;
}

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export default function MapView({ cityFilter, typeFilter, height = '500px' }: MapViewProps) {
  const [markers, setMarkers] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (cityFilter) params.set('city', cityFilter);
    if (typeFilter) params.set('type', typeFilter);
    api.get(`/establishments/map?${params}`)
      .then(({ data }) => setMarkers(data))
      .finally(() => setLoading(false));
  }, [cityFilter, typeFilter]);

  if (loading) return <LoadingSpinner text="Chargement de la carte..." />;

  const center = markers.length
    ? { lat: markers[0].latitude, lng: markers[0].longitude }
    : { lat: CHAD_CENTER[0], lng: CHAD_CENTER[1] };

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-200 relative">
      <Suspense fallback={<LoadingSpinner text="Chargement de la carte..." />}>
        {GOOGLE_MAPS_KEY ? (
          <GoogleMapView markers={markers} center={center} apiKey={GOOGLE_MAPS_KEY} />
        ) : (
          <OsmMapView markers={markers} center={[center.lat, center.lng]} />
        )}
      </Suspense>
      {!GOOGLE_MAPS_KEY && (
        <p className="absolute bottom-2 left-2 right-2 text-xs bg-white/90 rounded px-2 py-1 text-slate-500">
          Carte OpenStreetMap — cliquez sur un marqueur pour ouvrir Google Maps
        </p>
      )}
    </div>
  );
}
