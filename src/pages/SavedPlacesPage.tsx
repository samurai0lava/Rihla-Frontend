import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeNavBar from "@/components/shared/HomeNavBar";
import { useAuth } from "@/context/AuthContext";
import { AI_PLACES_URL, resolvePlaceImageUrl } from "@/hooks/useCityPlaces";
import { cn } from "@/lib/utils";
import { parseApiJson, resolveGatewayUrl } from "@/lib/api";
import {
  MapPin,
  Star,
  BookmarkX,
  Flame,
  TreePine,
  ShoppingBag,
  Landmark,
  Building2,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  CalendarDays,
  ChevronRight,
} from "lucide-react";

const FAV_PLACES_URL =
  resolveGatewayUrl(import.meta.env.VITE_FAV_PLACES_URL as string | undefined);

const PLANNER_URL =
  resolveGatewayUrl(import.meta.env.VITE_PLANNER_URL as string | undefined);


interface SavedPlace {
  id: string;
  userId: string;
  placeName: string;
  city: string;
  category: string;
  address: string;
  image: string | null;
  placeId?: string | null;
  rating: number | null;
  savedAt: string;
}

interface FavEnvelope {
  ok: boolean;
  data?: SavedPlace[];
  error?: { code: string; message: string };
}

interface TripPlanSummary {
  id: string;
  city: string;
  days: number;
  preferences: string[];
  createdAt: string;
  updatedAt: string;
}

interface PlansEnvelope {
  ok: boolean;
  data?: TripPlanSummary[];
  error?: { message?: string };
}

function formatTripDateRange(createdAt: string, days: number): string {
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return `${days} day${days === 1 ? "" : "s"}`;
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, days - 1));
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function tripThumbColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 62% 46%)`;
}


function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, React.ReactNode> = {
    Park:            <TreePine size={13} />,
    Market:          <ShoppingBag size={13} />,
    "Historical Site": <Landmark size={13} />,
    Monument:        <Building2 size={13} />,
    Museum:          <BookOpen size={13} />,
    Restaurant:      <ShoppingBag size={13} />,
    Beach:           <MapPin size={13} />,
  };
  return <>{icons[category] ?? <Landmark size={13} />}</>;
}

const CATEGORY_BG: Record<string, string> = {
  Park:            "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  Market:          "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  "Historical Site": "bg-stone-100 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700",
  Monument:        "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  Museum:          "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  Restaurant:      "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  Beach:           "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
};

function categoryClass(category: string) {
  return CATEGORY_BG[category] ?? "bg-stone-100 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700";
}

/** Resolve a displayable hero image: try ai-places `?placeId=` first, then legacy stored image URL. */
function useSavedPlaceHeroImage(
  placeId: string | null | undefined,
  legacyImage: string | null | undefined,
) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const candidates: string[] = [];

    if (placeId && String(placeId).trim()) {
      candidates.push(
        `${AI_PLACES_URL}/places/photos?placeId=${encodeURIComponent(String(placeId).trim())}`,
      );
    }
    const legacy = resolvePlaceImageUrl(legacyImage);
    if (legacy) candidates.push(legacy);

    if (candidates.length === 0) {
      setPhotoUrl(null);
      return;
    }

    setPhotoUrl(null);

    const tryNext = (i: number) => {
      if (cancelled || i >= candidates.length) return;
      const img = new Image();
      img.onload = () => {
        if (!cancelled) setPhotoUrl(candidates[i]!);
      };
      img.onerror = () => tryNext(i + 1);
      img.src = candidates[i]!;
    };
    tryNext(0);

    return () => {
      cancelled = true;
    };
  }, [placeId, legacyImage]);

  return { photoUrl, showPhoto: photoUrl !== null };
}

interface PlacesListSnippet {
  place_id?: string;
  image?: string | null;
  rating?: number;
}

interface PlacesListEnvelope {
  ok?: boolean;
  data?: PlacesListSnippet[];
}

function landmarkSearchQueries(city: string): string[] {
  const c = city.trim();
  return [
    `${c} famous landmark`,
    `${c} iconic landmark`,
    `${c} best known tourist attraction`,
  ];
}

function pickBestPlaceSnippet(places: PlacesListSnippet[]): PlacesListSnippet | null {
  if (!places.length) return null;
  const sorted = [...places].sort((a, b) => {
    const ra = a.rating ?? 0;
    const rb = b.rating ?? 0;
    if (rb !== ra) return rb - ra;
    return (b.place_id ? 1 : 0) - (a.place_id ? 1 : 0);
  });
  return sorted[0] ?? null;
}

/** One in-flight / cached lookup per city (landmark-biased search, then generic city list). */
const tripCityFirstPlaceCache = new Map<
  string,
  Promise<PlacesListSnippet | null>
>();

function fetchLandmarkPlaceForTripCity(city: string): Promise<PlacesListSnippet | null> {
  const trimmed = city.trim();
  if (!trimmed) return Promise.resolve(null);
  const key = trimmed.toLowerCase();
  let pending = tripCityFirstPlaceCache.get(key);
  if (!pending) {
    pending = (async () => {
      try {
        for (const q of landmarkSearchQueries(trimmed)) {
          if (q.trim().length < 3) continue;
          const res = await fetch(
            `${AI_PLACES_URL}/places/search?q=${encodeURIComponent(q)}`,
            { credentials: "include" },
          );
          if (!res.ok) continue;
          const env = (await res.json()) as PlacesListEnvelope;
          if (env.ok && env.data?.length) {
            return pickBestPlaceSnippet(env.data);
          }
        }
        const res = await fetch(
          `${AI_PLACES_URL}/places?city=${encodeURIComponent(trimmed)}`,
          { credentials: "include" },
        );
        if (!res.ok) return null;
        const env = (await res.json()) as PlacesListEnvelope;
        if (!env.ok || !env.data?.length) return null;
        return pickBestPlaceSnippet(env.data);
      } catch {
        return null;
      }
    })();
    tripCityFirstPlaceCache.set(key, pending);
  }
  return pending;
}

/** Hero for saved trip cards: landmark-biased place for `trip.city`, then same photo pipeline as saved places. */
function useTripCardHeroImage(city: string) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!city.trim()) {
      setPhotoUrl(null);
      return;
    }

    setPhotoUrl(null);

    fetchLandmarkPlaceForTripCity(city).then((info) => {
      if (cancelled || !info) return;

      const candidates: string[] = [];
      if (info.place_id && String(info.place_id).trim()) {
        candidates.push(
          `${AI_PLACES_URL}/places/photos?placeId=${encodeURIComponent(String(info.place_id).trim())}`,
        );
      }
      const legacy = resolvePlaceImageUrl(info.image);
      if (legacy) candidates.push(legacy);

      if (candidates.length === 0) return;

      const tryNext = (i: number) => {
        if (cancelled || i >= candidates.length) return;
        const img = new Image();
        img.onload = () => {
          if (!cancelled) setPhotoUrl(candidates[i]!);
        };
        img.onerror = () => tryNext(i + 1);
        img.src = candidates[i]!;
      };
      tryNext(0);
    });

    return () => {
      cancelled = true;
    };
  }, [city]);

  return { photoUrl, showPhoto: photoUrl !== null };
}


function SavedPlaceCard({
  place,
  onUnsave,
}: {
  place: SavedPlace;
  onUnsave: (id: string) => void;
}) {
  const { photoUrl, showPhoto } = useSavedPlaceHeroImage(place.placeId, place.image);
  const [removing, setRemoving] = useState(false);

  const handleUnsave = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `${FAV_PLACES_URL}/fav-places/${place.id}?userId=${encodeURIComponent(place.userId)}`,
        { method: "DELETE", credentials: "include" },
      );
      const env = await res.json();
      if (env.ok) onUnsave(place.id);
    } catch { /* silent */ } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border shadow-sm",
        "border-stone-200/80 dark:border-white/[0.07]",
        "hover:shadow-md transition-all duration-300",
        !showPhoto && "bg-white dark:bg-white/[0.04]",
      )}
    >
      {showPhoto && photoUrl ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
          style={{ backgroundImage: `url(${photoUrl})` }}
        />
      ) : null}
      {showPhoto ? (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.65))",
          }}
        />
      ) : null}

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <div
          className={cn(
            "relative h-52 overflow-hidden shrink-0",
            !showPhoto && "bg-stone-100 dark:bg-stone-800/50",
          )}
        >
          {!showPhoto ? (
            <div className="w-full h-full flex items-center justify-center">
              <Landmark size={36} className="text-stone-300 dark:text-stone-600" />
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleUnsave}
            disabled={removing}
            aria-label="Remove from saved"
            className={cn(
              "absolute top-2.5 right-2.5 flex items-center gap-1",
              "text-[11px] font-medium px-2 py-1 rounded-full shadow-sm transition-all duration-200 disabled:opacity-50",
              showPhoto
                ? "bg-black/45 backdrop-blur-sm text-white border border-white/20 hover:bg-black/55"
                : "bg-white/90 dark:bg-black/60 backdrop-blur-sm text-rose-500 hover:text-rose-600",
            )}
          >
            <BookmarkX size={12} className={showPhoto ? "text-white" : undefined} />
            {removing ? "Removing…" : "Unsave"}
          </button>
        </div>

        <div className="flex flex-col gap-2.5 p-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
                categoryClass(place.category),
              )}
            >
              <CategoryIcon category={place.category} />
              {place.category}
            </span>
            {place.rating !== null && place.rating >= 4.5 && (
              <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Flame size={9} />
                Must Visit
              </span>
            )}
          </div>

          <h3
            className={cn(
              "font-bold text-[17px] leading-snug truncate",
              showPhoto ? "text-white" : "text-stone-900 dark:text-white",
            )}
          >
            {place.placeName}
          </h3>

          <div
            className={cn(
              "flex items-center gap-2 text-[11px]",
              showPhoto ? "text-white/90" : "text-stone-400 dark:text-stone-500",
            )}
          >
            <MapPin
              size={11}
              className={cn("shrink-0", showPhoto ? "text-white" : "text-orange-400")}
            />
            <span className="truncate">{place.address}</span>
          </div>

          <div
            className={cn(
              "flex items-center justify-between pt-2 border-t",
              showPhoto ? "border-white/15" : "border-stone-100 dark:border-white/[0.06]",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-semibold",
                showPhoto ? "text-orange-300" : "text-orange-500 dark:text-orange-400",
              )}
            >
              {place.city}
            </span>
            {place.rating !== null && (
              <div className="flex items-center gap-1">
                <Star size={11} className="fill-orange-400 text-orange-400" />
                <span
                  className={cn(
                    "text-[11px] font-bold tabular-nums",
                    showPhoto ? "text-white" : "text-stone-600 dark:text-stone-300",
                  )}
                >
                  {place.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function SavedTripCard({
  trip,
  onOpen,
}: {
  trip: TripPlanSummary;
  onOpen: (id: string) => void;
}) {
  const { photoUrl, showPhoto } = useTripCardHeroImage(trip.city);

  return (
    <button
      type="button"
      onClick={() => onOpen(trip.id)}
      className={cn(
        "group relative w-full flex items-stretch text-left rounded-2xl overflow-hidden",
        "border border-stone-200/80 dark:border-white/[0.07]",
        "shadow-sm hover:shadow-md hover:border-orange-200/80 dark:hover:border-orange-500/25",
        "transition-all duration-300 min-h-[unset] min-w-[unset]",
        !showPhoto && "bg-white dark:bg-white/[0.04]",
      )}
    >
      {showPhoto && photoUrl ? (
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.02]"
          style={{ backgroundImage: `url(${photoUrl})` }}
        />
      ) : null}
      {showPhoto ? (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.65))",
          }}
        />
      ) : null}

      <div className="relative z-10 flex w-full min-w-0 items-stretch">
        <span
          className="w-1.5 shrink-0 self-stretch"
          style={{ background: tripThumbColor(trip.id) }}
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 items-center justify-between gap-4 px-5 py-5">
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-semibold text-[16px]",
                showPhoto ? "text-white" : "text-stone-900 dark:text-white",
              )}
            >
              {trip.city}
            </p>
            <p
              className={cn(
                "mt-0.5 flex items-center gap-1.5 text-[13px]",
                showPhoto ? "text-white/90" : "text-stone-500 dark:text-stone-400",
              )}
            >
              <CalendarDays
                size={13}
                className={cn("shrink-0", showPhoto ? "text-white" : "text-orange-400")}
              />
              <span className="truncate">
                {formatTripDateRange(trip.createdAt, trip.days)} · {trip.days} day
                {trip.days === 1 ? "" : "s"}
              </span>
            </p>
          </div>
          <ChevronRight
            size={20}
            className={cn(
              "shrink-0 transition-colors",
              showPhoto
                ? "text-white/70 group-hover:text-orange-300"
                : "text-stone-300 dark:text-stone-600 group-hover:text-orange-500",
            )}
          />
        </div>
      </div>
    </button>
  );
}


function SavedPlacesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [trips, setTrips] = useState<TripPlanSummary[]>([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [tripsError, setTripsError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);

    fetch(`${FAV_PLACES_URL}/fav-places?userId=${encodeURIComponent(user.id)}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((env: FavEnvelope) => {
        if (!env.ok) throw new Error(env.error?.message ?? "Failed to load saved places");
        setPlaces(env.data ?? []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setTripsLoading(true);
    setTripsError(null);
    fetch(`${PLANNER_URL}/plans`, { credentials: "include" })
      .then(async (r) => (await parseApiJson(r)) as PlansEnvelope)
      .then((env: PlansEnvelope) => {
        if (!env.ok) throw new Error(env.error?.message ?? "Failed to load saved trips");
        setTrips(env.data ?? []);
      })
      .catch((err: Error) => setTripsError(err.message))
      .finally(() => setTripsLoading(false));
  }, [user?.id]);

  const handleUnsave = (id: string) => {
    setPlaces((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      <HomeNavBar />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-24 pb-20">
        <div className="mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[12px] text-stone-400 hover:text-stone-700
              dark:text-stone-500 dark:hover:text-stone-300 transition-colors mb-6"
          >
            <ChevronLeft size={14} />
            Back
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white tracking-tight">
            Saved <span className="text-orange-500">Places</span>
          </h1>
          <p className="mt-2 text-[14px] text-stone-500 dark:text-stone-400">
            Your bookmarked spots and AI trip plans in one place.
          </p>
        </div>

        <section className="mb-14" aria-labelledby="saved-trips-heading">
          <div className="flex items-end justify-between gap-4 mb-4">
            <h2
              id="saved-trips-heading"
              className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight"
            >
              Saved trips
            </h2>
          </div>

          {tripsError && (
            <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl
              bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800
              text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle size={14} className="shrink-0" />
              {tripsError}
            </div>
          )}

          {tripsLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[92px] rounded-2xl bg-stone-100 dark:bg-stone-800/50 animate-pulse border border-stone-200/60 dark:border-white/[0.06]"
                />
              ))}
            </div>
          )}

          {!tripsLoading && !tripsError && trips.length === 0 && (
            <p className="text-[13px] text-stone-500 dark:text-stone-400 py-2">
              No saved trips yet.{" "}
              <button
                type="button"
                onClick={() => navigate("/home", { state: { openPlanTab: true } })}
                className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Plan a trip
              </button>
            </p>
          )}

          {!tripsLoading && trips.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trips.map((trip) => (
                <SavedTripCard
                  key={trip.id}
                  trip={trip}
                  onOpen={(id) => navigate(`/planner?id=${id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-6" aria-labelledby="saved-places-heading">
          <h2
            id="saved-places-heading"
            className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight mb-4"
          >
            Saved places
          </h2>
          <p className="text-[13px] text-stone-500 dark:text-stone-400 mb-6 -mt-2">
            {loading
              ? "Loading your saved places…"
              : places.length === 0
                ? "No saved places yet — start exploring and bookmark places you love."
                : `${places.length} place${places.length !== 1 ? "s" : ""} saved`}
          </p>
        </section>

        {error && (
          <div className="flex items-center gap-3 px-5 py-4 mb-8 rounded-2xl
            bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800
            text-rose-700 dark:text-rose-300">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white dark:bg-white/[0.04]
                border border-stone-200/80 dark:border-white/[0.07] shadow-sm animate-pulse">
                <div className="h-52 bg-stone-100 dark:bg-stone-800" />
                <div className="p-5 space-y-2.5">
                  <div className="h-5 w-24 rounded-full bg-stone-100 dark:bg-stone-800" />
                  <div className="h-5 w-40 rounded bg-stone-100 dark:bg-stone-800" />
                  <div className="h-3.5 w-32 rounded bg-stone-100 dark:bg-stone-800" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && places.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {places.map((place) => (
              <SavedPlaceCard key={place.id} place={place} onUnsave={handleUnsave} />
            ))}
          </div>
        )}

        {!loading && !error && places.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full
              bg-stone-100 dark:bg-white/[0.05] mb-4">
              <Landmark size={28} className="text-stone-300 dark:text-stone-600" />
            </div>
            <p className="text-stone-400 dark:text-stone-600 text-sm">
              No saved places yet.{" "}
              <button
                onClick={() => navigate("/home")}
                className="text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Explore cities
              </button>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default SavedPlacesPage;
