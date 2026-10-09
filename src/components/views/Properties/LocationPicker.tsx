/// <reference types="google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { Search, Crosshair, Loader2, MapPin, X, TriangleAlert } from 'lucide-react';
import { env } from '../../../config/env';

// Map pin picker for property creation — Google Maps (Maps JavaScript API)
// with the Geocoding API for address search and the pin's address. Click the
// map or drag the pin to set the location. Needs VITE_GOOGLE_MAPS_API_KEY.

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

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

// Loads the Maps JavaScript API once per page.
let mapsLoader: Promise<void> | null = null;
function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window !== 'undefined' && window.google?.maps?.Map) return Promise.resolve();
  if (mapsLoader) return mapsLoader;
  mapsLoader = new Promise<void>((resolve, reject) => {
    const callbackName = '__misrahGoogleMapsReady';
    (window as unknown as Record<string, unknown>)[callbackName] = () => resolve();
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&callback=${callbackName}`;
    script.async = true;
    script.onerror = () => {
      mapsLoader = null;
      script.remove();
      reject(new Error('Google Maps failed to load. Check your network connection and the API key.'));
    };
    document.head.appendChild(script);
  });
  return mapsLoader;
}

interface SearchResult {
  address: string;
  location: LatLng;
}

export const LocationPicker = ({ value, onChange, cityQuery, onAddressResolved }: LocationPickerProps) => {
  const apiKey = env.GOOGLE_MAPS_API_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
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

  // Load the API and create the map once.
  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    // Google calls this when the key is rejected (invalid, API not enabled, referrer blocked).
    (window as unknown as Record<string, unknown>).gm_authFailure = () =>
      setLoadError('Google Maps rejected the API key. Check that it is valid, the Maps JavaScript API is enabled, and this domain is allowed.');

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const start = value ?? DEFAULT_CENTER;
        const map = new google.maps.Map(containerRef.current, {
          center: start,
          zoom: value ? 16 : 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          clickableIcons: false,
        });
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) setPin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        });
        mapRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();
        setMapReady(true);
      })
      .catch(err => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Google Maps failed to load.');
      });

    return () => {
      cancelled = true;
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Keep the marker in sync with `value`.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!value) {
      markerRef.current?.setMap(null);
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const marker = new google.maps.Marker({ position: value, map, draggable: true });
      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) setPin({ lat: pos.lat(), lng: pos.lng() });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setPosition(value);
    }
    if (!map.getBounds()?.contains(value)) map.panTo(value);
  }, [value, mapReady]);

  // Recenter on the selected city while no pin has been placed.
  useEffect(() => {
    if (!mapReady || !cityQuery || value || !geocoderRef.current) return;
    let cancelled = false;
    geocoderRef.current
      .geocode({ address: cityQuery })
      .then(({ results: found }) => {
        const loc = found[0]?.geometry.location;
        if (!cancelled && loc && mapRef.current) {
          mapRef.current.setCenter(loc);
          mapRef.current.setZoom(12);
        }
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
    if (!mapReady || !geocoderRef.current) return;
    let cancelled = false;
    setResolvingAddress(true);
    const t = window.setTimeout(() => {
      geocoderRef.current!
        .geocode({ location: value })
        .then(({ results: found }) => {
          if (cancelled) return;
          const address = found[0]?.formatted_address ?? '';
          setResolvedAddress(address || null);
          onAddressRef.current?.(address);
        })
        .catch(() => {
          if (!cancelled) setResolvedAddress(null);
        })
        .finally(() => { if (!cancelled) setResolvingAddress(false); });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [value?.lat, value?.lng, mapReady]);

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q || !geocoderRef.current) return;
    setSearching(true);
    setSearchError(null);
    try {
      const { results: found } = await geocoderRef.current.geocode({ address: q, region: 'ae' });
      const list = found.slice(0, 5).map(r => ({
        address: r.formatted_address,
        location: { lat: r.geometry.location.lat(), lng: r.geometry.location.lng() },
      }));
      setResults(list);
      if (list.length === 0) setSearchError('No places found for that search.');
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setResults([]);
      setSearchError(
        code === 'ZERO_RESULTS'
          ? 'No places found for that search.'
          : 'Location search failed. Make sure the Geocoding API is enabled for this key, or click the map to place the pin.',
      );
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r: SearchResult) => {
    setPin(r.location);
    mapRef.current?.setCenter(r.location);
    mapRef.current?.setZoom(17);
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
        mapRef.current?.setCenter(point);
        mapRef.current?.setZoom(17);
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
    mapRef.current?.panTo(next);
  };

  const mapUnavailable = !apiKey || !!loadError;

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

      {!mapUnavailable && (
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
            disabled={searching || !query.trim() || !mapReady}
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
      )}

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

      <div className="relative isolate rounded-[28px] overflow-hidden border border-border-misrah bg-surface">
        <div ref={containerRef} className={`h-72 w-full ${mapUnavailable ? 'hidden' : ''}`} />
        {mapUnavailable ? (
          <div className="h-72 w-full flex flex-col items-center justify-center gap-2 px-8 text-center">
            <TriangleAlert size={22} className="text-amber-500" />
            <p className="text-xs font-black text-primary uppercase tracking-wider">Map unavailable</p>
            <p className="text-[11px] text-muted-text leading-relaxed max-w-sm">
              {!apiKey
                ? 'Add VITE_GOOGLE_MAPS_API_KEY to the .env file and restart the dev server to enable Google Maps. You can still enter latitude and longitude below.'
                : loadError}
            </p>
          </div>
        ) : !mapReady ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-muted-text text-[10px] font-black uppercase tracking-widest">
            <Loader2 size={14} className="animate-spin" /> Loading Google Maps…
          </div>
        ) : !value ? (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-primary/90 text-accent text-[10px] font-black uppercase tracking-wider shadow-lg">
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
              {!mapReady
                ? 'Address lookup needs Google Maps — coordinates will still be saved.'
                : resolvingAddress
                  ? 'Finding address…'
                  : resolvedAddress ?? 'Address not found for this point — coordinates will still be saved.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
