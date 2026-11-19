
import { useEffect, useState } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default marker paths when used with Vite.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

interface LocationPickerProps {
  value?: GeoPoint;
  onChange: (point: GeoPoint) => void;
}

const DEFAULT_CENTER: [number, number] = [22.9734, 78.6569];

function MapClickHandler({
  onSelect,
}: {
  onSelect: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapViewUpdater({ point }: { point?: GeoPoint }) {
  const map = useMap();

  useEffect(() => {
    if (!point) return;

    const [longitude, latitude] = point.coordinates;
    map.setView([latitude, longitude], 16);
  }, [map, point]);

  return null;
}

export default function LocationPicker({
  value,
  onChange,
}: LocationPickerProps) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const markerPosition: [number, number] | null = value
    ? [value.coordinates[1], value.coordinates[0]]
    : null;

  const selectLocation = (latitude: number, longitude: number) => {
    setError('');

    onChange({
      type: 'Point',
      coordinates: [longitude, latitude],
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Your browser does not support location access.');
      return;
    }

    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectLocation(
          position.coords.latitude,
          position.coords.longitude,
        );
        setLocating(false);
      },
      (geoError) => {
        const message =
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission was denied. Select your location directly on the map.'
            : geoError.code === geoError.POSITION_UNAVAILABLE
              ? 'Your current location is unavailable. Please select it on the map.'
              : 'Location request timed out. Please try again or select it on the map.';

        setError(message);
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">
            Pinpoint the problem location
          </h3>
          <p className="text-sm text-gray-400">
            Click the map to place or move the marker.
          </p>
        </div>

        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="rounded-lg border border-purple-500 px-4 py-2 text-sm text-purple-200 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {locating ? 'Finding location...' : 'Use my current location'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <MapContainer
          center={markerPosition ?? DEFAULT_CENTER}
          zoom={markerPosition ? 16 : 5}
          scrollWheelZoom
          style={{ height: '360px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onSelect={selectLocation} />
          <MapViewUpdater point={value} />

          {markerPosition && <Marker position={markerPosition} />}
        </MapContainer>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      {value ? (
        <p className="text-sm text-gray-300">
          <span className="font-medium text-green-400">
            Location selected
          </span>
          {' · '}
          Latitude: {value.coordinates[1].toFixed(6)}
          {' · '}
          Longitude: {value.coordinates[0].toFixed(6)}
        </p>
      ) : (
        <p className="text-sm text-amber-300">
          No exact location selected yet.
        </p>
      )}
    </div>
  );
}
