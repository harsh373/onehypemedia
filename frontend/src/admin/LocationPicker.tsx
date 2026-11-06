import { useEffect, useState } from "react";

type Props = {
  location: string;
  lat: number | null;
  lng: number | null;
  onChange: (next: { location: string; lat: number | null; lng: number | null }) => void;
  disabled?: boolean;
};

type Suggestion = { label: string; lat: number; lng: number };

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

function toSuggestion(feature: PhotonFeature): Suggestion | null {
  const coords = feature.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const p = feature.properties ?? {};
  const street = p.street ? (p.housenumber ? `${p.housenumber} ${p.street}` : p.street) : "";
  const parts = [p.name, street, p.district, p.city ?? p.county, p.state, p.country];
  const label = Array.from(new Set(parts.filter((part): part is string => Boolean(part))))
    .join(", ")
    .slice(0, 150);
  if (!label) return null;

  return { label, lat, lng };
}

export default function LocationPicker({ location, lat, lng, onChange, disabled }: Props) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  // Only searches after the admin types (term is set by typing, not by loading an event).
  // State is only set inside the delayed callback, never directly in the effect body.
  useEffect(() => {
    const q = term.trim();
    if (q.length < 3) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed.");
        const json = (await res.json()) as { features?: PhotonFeature[] };
        const list = (json.features ?? [])
          .map(toSuggestion)
          .filter((s): s is Suggestion => s !== null);
        setResults(list);
        setUnavailable(false);
        setOpen(true);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setResults([]);
        setUnavailable(true);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  // Derived from the text, so nothing stale shows when the text is too short to search.
  const canSearch = term.trim().length >= 3;
  const visibleResults = canSearch ? results : [];
  const showSearching = canSearch && searching;
  const showUnavailable = canSearch && unavailable;

  function handleInput(value: string) {
    setTerm(value);
    onChange({ location: value, lat: null, lng: null });
  }

  function pick(s: Suggestion) {
    onChange({ location: s.label, lat: s.lat, lng: s.lng });
    setTerm("");
    setResults([]);
    setOpen(false);
  }

  function clearAll() {
    setTerm("");
    setResults([]);
    setOpen(false);
    onChange({ location: "", lat: null, lng: null });
  }

  const hasPin = lat !== null && lng !== null;
  const d = 0.008;

  return (
    <div>
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            value={location}
            onChange={(e) => handleInput(e.target.value)}
            onFocus={() => visibleResults.length > 0 && setOpen(true)}
            onBlur={() => setOpen(false)}
            disabled={disabled}
            maxLength={150}
            placeholder="Search for a place or type an address"
            className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-transparent placeholder:text-white/40 focus:ring-white/30 disabled:opacity-50"
          />
          {location && (
            <button
              type="button"
              onClick={clearAll}
              disabled={disabled}
              className="shrink-0 rounded-lg px-2 py-2 text-xs font-semibold text-white/60 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {open && visibleResults.length > 0 && (
          <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl bg-[#1c1c1f] shadow-xl ring-1 ring-white/10">
            {visibleResults.map((s, i) => (
              <li key={`${s.lat}-${s.lng}-${i}`}>
                <button
                  type="button"
                  // mousedown (not click) so the choice lands before the input loses focus
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(s);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-white/90 hover:bg-white/10"
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showSearching && <p className="mt-2 text-xs text-white/40">Searching places...</p>}
      {showUnavailable && (
        <p className="mt-2 text-xs text-amber-300/80">
          Place search is unavailable right now. You can still type the address.
        </p>
      )}

      {hasPin && (
        <div className="mt-3">
          <iframe
            title="Event location map"
            className="h-44 w-full rounded-xl border-0"
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d / 2}%2C${lng + d}%2C${lat + d / 2}&layer=mapnik&marker=${lat}%2C${lng}`}
          />
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs text-white/50 hover:text-white"
          >
            Open larger map &#8599;
          </a>
        </div>
      )}
    </div>
  );
}