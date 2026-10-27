import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Crosshair, Loader2, MapPin, X, TriangleAlert } from 'lucide-react';

// Map pin picker for property create / edit — Esri World Street Map tiles
// (English labels) via Leaflet, with OpenStreetMap's Nominatim
// (accept-language=en) for address search, recentering on
// the city and the pin's address. Click the map or drag the pin to set the
// location. No API key needed.
//
// Nominatim's usage policy asks for light, user-driven traffic (≤ 1 request
// a second): search runs only on submit and reverse lookups are debounced.

export interface LatLng {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
  // City picked in the same step — the map recenters on it while no pin is set.
  cityQuery?: string;
  // Called with the pin's address (reverse-geocoded), or '' when cleared.
  onAddressResolved?: (address: string) => void;
}

const DEFAULT_CENTER: LatLng = { lat: 25.2048, lng: 55.2708 }; // Dubai
const NOMINATIM = 'https://nominatim.openstreetmap.org';

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

// A CSS pin (no image assets — Leaflet's default marker images don't resolve
// through the bundler).
const PIN_ICON = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#0F1D33;border:3px solid #D4C3B5;transform:rotate(-45deg);box-shadow:0 4px 10px rgba(0,0,0,.3)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

interface NominatimPlace {
  display_name: string;
  lat: string;
  lon: string;
}

async function nominatimSearch(q: string, limit: number): Promise<NominatimPlace[]> {
  const res = await fetch(`${NOMINATIM}/search?format=json&limit=${limit}&accept-language=en&q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return res.json();
}

async function nominatimReverse(point: LatLng): Promise<string> {
  const res = await fetch(`${NOMINATIM}/reverse?format=json&accept-language=en&lat=${point.lat}&lon=${point.lng}`);
  if (!res.ok) throw new Error(`Reverse lookup failed (${res.status})`);
  const body = (await res.json()) as { display_name?: string };
  return body.display_name ?? '';
}

interface SearchResult {
  address: string;
  location: LatLng;
}

export const LocationPicker = ({ value, onChange, cityQuery, onAddressResolved }: LocationPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onAddressRef = useRef(onAddressResolved);
  onAddressRef.current = onAddressResolved;

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const setPin = (point: LatLng) => onChangeRef.current({ lat: round6(point.lat), lng: round6(point.lng) });

  // Create the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    try {
      const start = value ?? DEFAULT_CENTER;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(
        [start.lat, start.lng],
        value ? 16 : 11,
      );
      // Esri World Street Map — the standard OSM tiles label places in the
      // local language (Arabic across the UAE); this street map labels in English.
      const tiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community',
      });
      tiles.on('tileerror', () => setLoadError('Map tiles failed to load. Check your network connection.'));
      tiles.on('load', () => setLoadError(null));
      tiles.addTo(map);
      map.on('click', (e: L.LeafletMouseEvent) => setPin({ lat: e.latlng.lat, lng: e.latlng.lng }));
      mapRef.current = map;
      setMapReady(true);
      // The container may still be animating into place (modal / tab) —
      // re-measure once it has settled so tiles fill it.
      const t = window.setTimeout(() => map.invalidateSize(), 250);
      return () => {
        window.clearTimeout(t);
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'The map failed to load.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync with `value`.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const marker = L.marker([value.lat, value.lng], { draggable: true, icon: PIN_ICON }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setPin({ lat: pos.lat, lng: pos.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLatLng([value.lat, value.lng]);
    }
    if (!map.getBounds().contains([value.lat, value.lng])) map.panTo([value.lat, value.lng]);
  }, [value, mapReady]);

  // Recenter on the selected city while no pin has been placed.
  useEffect(() => {
    if (!mapReady || !cityQuery || value) return;
    let cancelled = false;
    nominatimSearch(cityQuery, 1)
      .then(found => {
        const place = found[0];
        if (!cancelled && place && mapRef.current) mapRef.current.setView([Number(place.lat), Number(place.lon)], 12);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityQuery, mapReady]);

  // Reverse-geocode the pin — this becomes the property's address.
  useEffect(() => {
    if (!value) {
      setResolvedAddress(null);
      setResolvingAddress(false);
      onAddressRef.current?.('');
      return;
    }
    let cancelled = false;
    setResolvingAddress(true);
    const t = window.setTimeout(() => {
      nominatimReverse(value)
        .then(address => {
          if (cancelled) return;
          setResolvedAddress(address || null);
          onAddressRef.current?.(address);
        })
        .catch(() => {
          if (!cancelled) setResolvedAddress(null);
        })
        .finally(() => { if (!cancelled) setResolvingAddress(false); });
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [value?.lat, value?.lng]);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const found = await nominatimSearch(q, 5);
      const list = found.map(r => ({ address: r.display_name, location: { lat: Number(r.lat), lng: Number(r.lon) } }));
      setResults(list);
      if (list.length === 0) setSearchError('No places found for that search.');
    } catch {
      setResults([]);
      setSearchError('Location search failed. You can still click the map to place the pin.');
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r: SearchResult) => {
    setPin(r.location);
    mapRef.current?.setView([r.location.lat, r.location.lng], 17);
    setResults([]);
    setQuery(r.address);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPin(point);
        mapRef.current?.setView([point.lat, point.lng], 17);
        setLocating(false);
      },
      () => {
        setSearchError('Could not get your current location.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const updateCoord = (key: 'lat' | 'lng', raw: string) => {
    const n = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(n)) return;
    if (key === 'lat' && Math.abs(n) > 90) return;
    if (key === 'lng' && Math.abs(n) > 180) return;
    const next = { ...(value ?? DEFAULT_CENTER), [key]: n };
    setPin(next);
    mapRef.current?.panTo([next.lat, next.lng]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Pin Location on Map</label>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="text-[10px] font-black uppercase tracking-wider text-accent hover:underline flex items-center gap-1">
            <X size={12} /> Clear pin
          </button>
        )}
      </div>

      <form onSubmit={runSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 rtl:left-auto rtl:right-4 top-1/2 -translate-y-1/2 text-muted-text/50" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search a building, street or area…"
            className="w-full bg-surface border border-border-misrah rounded-2xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="px-5 rounded-2xl bg-primary text-accent text-[10px] font-black uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
        >
          {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          Search
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating || !mapReady}
          title="Use my current location"
          className="w-12 rounded-2xl border border-border-misrah bg-white flex items-center justify-center text-primary hover:border-accent disabled:opacity-50"
        >
          {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={16} />}
        </button>
      </form>

      {results.length > 0 && (
        <div className="rounded-2xl border border-border-misrah bg-white divide-y divide-border-misrah/60 overflow-hidden">
          {results.map(r => (
            <button
              key={`${r.location.lat},${r.location.lng}`}
              type="button"
              onClick={() => pickResult(r)}
              className="w-full px-4 py-3 text-left text-[11px] font-medium text-primary hover:bg-surface flex items-start gap-2"
            >
              <MapPin size={13} className="text-accent shrink-0 mt-0.5" />
              <span className="line-clamp-2">{r.address}</span>
            </button>
          ))}
        </div>
      )}
      {searchError && <p className="text-[10px] font-bold text-danger px-1">{searchError}</p>}

      {/* `isolate` keeps Leaflet's high z-index panes inside this box, below modals. */}
      <div className="relative isolate rounded-[28px] overflow-hidden border border-border-misrah bg-surface">
        <div ref={containerRef} className="h-72 w-full z-0" />
        {loadError ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit max-w-[90%] px-4 py-2 rounded-full bg-white/95 border border-amber-300 text-amber-700 text-[10px] font-bold flex items-center gap-2 shadow z-[1000]">
            <TriangleAlert size={13} /> {loadError}
          </div>
        ) : !value ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary/90 text-accent text-[10px] font-black uppercase tracking-wider shadow-lg z-[1000]">
            Click the map to drop a pin
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(['lat', 'lng'] as const).map(key => (
          <div key={key} className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">{key === 'lat' ? 'Latitude' : 'Longitude'}</label>
            <input
              key={value ? `${key}-${value[key]}` : `${key}-empty`}
              type="number"
              step="any"
              defaultValue={value ? value[key] : ''}
              onBlur={e => updateCoord(key, e.target.value)}
              placeholder={key === 'lat' ? '25.2048' : '55.2708'}
              className="w-full bg-surface border border-border-misrah rounded-2xl px-4 py-3 text-xs font-bold text-primary outline-none focus:border-accent"
            />
          </div>
        ))}
      </div>

      {value && (
        <div className="p-3 rounded-2xl bg-accent/5 border border-accent/20 flex items-start gap-2.5">
          <MapPin size={14} className="text-accent shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[2px] text-muted-text">Pinned Address</p>
            <p className="text-[11px] font-medium text-primary/80 leading-relaxed mt-0.5">
              {resolvingAddress
                ? 'Finding address…'
                : resolvedAddress ?? 'Address not found for this point — coordinates will still be saved.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
