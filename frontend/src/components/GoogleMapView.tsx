import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import type { Establishment } from '../types';
import { googleMapsUrl } from './MapView';
import LoadingSpinner from './LoadingSpinner';

interface GoogleMapViewProps {
  markers: Establishment[];
  center: { lat: number; lng: number };
  apiKey: string;
}

const mapContainerStyle = { width: '100%', height: '100%' };

export default function GoogleMapView({ markers, center, apiKey }: GoogleMapViewProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'medicare-tchad-map',
    googleMapsApiKey: apiKey,
  });

  if (!isLoaded) return <LoadingSpinner text="Chargement Google Maps..." />;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={6}
      options={{ fullscreenControl: false, mapTypeControl: false }}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          position={{ lat: m.latitude, lng: m.longitude }}
          title={m.name}
          onClick={() => window.open(googleMapsUrl(m.latitude, m.longitude), '_blank')}
        />
      ))}
    </GoogleMap>
  );
}
