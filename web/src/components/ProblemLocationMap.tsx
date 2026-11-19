
import L from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

interface ProblemLocationMapProps {
    coordinates?: {
        type: 'Point';
        coordinates: [number, number];
    };
}

export default function ProblemLocationMap({
    coordinates,
}: ProblemLocationMapProps) {
    if (
        !coordinates ||
        coordinates.type !== 'Point' ||
        coordinates.coordinates.length !== 2
    ) {
        return (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm text-gray-400">
                    Exact map coordinates are unavailable for this report.
                </p>
            </div>
        );
    }

    const [longitude, latitude] = coordinates.coordinates;

    if (
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude) ||
        longitude < -180 ||
        longitude > 180 ||
        latitude < -90 ||
        latitude > 90
    ) {
        return (
            <p className="text-sm text-gray-400">
                The saved map coordinates are invalid.
            </p>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
            <MapContainer
                key={`${latitude},${longitude}`}
                center={[latitude, longitude]}
                zoom={16}
                scrollWheelZoom={false}
                style={{ height: '260px', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[latitude, longitude]} />
            </MapContainer>

            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        Saved coordinates
                    </p>
                    <p className="mt-1 text-sm text-gray-200">
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </p>
                </div>

                <a
                    href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 transition hover:border-purple-400/60 hover:bg-purple-500/20 sm:self-auto"
                >
                    Open in Google Maps
                    <span aria-hidden="true">↗</span>
                </a>
            </div>
        </div>
    );
}
