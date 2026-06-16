import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Establishment } from '../types';
import { googleMapsUrl } from './MapView';

const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface OsmMapViewProps {
  markers: Establishment[];
  center: [number, number];
}

export default function OsmMapView({ markers, center }: OsmMapViewProps) {
  return (
    <MapContainer center={center} zoom={6} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.latitude, m.longitude]} icon={icon}>
          <Popup>
            <div className="text-sm">
              <strong>{m.name}</strong>
              <p className="text-slate-500 mt-1">{m.address}</p>
              <p>{m.city?.name} — {m.phone}</p>
              <a
                href={googleMapsUrl(m.latitude, m.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline text-xs mt-2 inline-block"
              >
                Ouvrir dans Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
