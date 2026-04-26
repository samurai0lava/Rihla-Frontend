import { useEffect, useState } from "react";
import { resolveGatewayUrl } from "@/lib/api";

const AI_PLACES_URL = resolveGatewayUrl(
  import.meta.env.VITE_AI_PLACES_URL as string | undefined,
);

export const REVIEW_PLACES_URL = resolveGatewayUrl(
  import.meta.env.VITE_REVIEW_PLACES_URL as string | undefined,
);

export const FAV_PLACES_URL = resolveGatewayUrl(
  import.meta.env.VITE_FAV_PLACES_URL as string | undefined,
);

export { AI_PLACES_URL };

/** API returns paths like `/places/photos?...` — must hit ai-places origin, not the SPA host */
export function resolvePlaceImageUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${AI_PLACES_URL}${src}`;
  return src;
}

export interface Place {
  place_id?: string;
  name: string;
  category: string;
  rating: number | null;
  description: string;
  address: string;
  must_visit: boolean;
  image_query?: string;
  image: string | null;
  photos?: string[];
  lat?: number | null;
  lng?: number | null;
  match_reason?: string;
}

export interface ApiEnvelope {
  ok: boolean;
  data?: Place[];
  error?: { code: string; message: string; details?: string };
  city?: string;
  intent?: string;
}

export interface Review {
  id: string;
  placeName: string;
  city: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number | null;
  totalReviews: number;
}

export interface ReviewEnvelope {
  ok: boolean;
  data?: Review[] | Review | ReviewSummary | { id: string };
  error?: { code: string; message: string; details?: string };
}

export interface FavCheckEnvelope {
  ok: boolean;
  data?: { saved: boolean; id: string | null };
  error?: { code: string; message: string };
}

export function usePlaces(city: string) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city.trim()) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlaces([]);

    fetch(`${AI_PLACES_URL}/places?city=${encodeURIComponent(city.trim())}`, { credentials: "include" })
      .then((res) => res.json())
      .then((envelope: ApiEnvelope) => {
        if (!envelope.ok) throw new Error(envelope.error?.details ?? envelope.error?.message ?? "Unknown error");
        if (!cancelled) setPlaces(envelope.data ?? []);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [city]);

  return { places, loading, error };
}

export function useSearch(q: string) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedCity, setResolvedCity] = useState("");
  const [intent, setIntent] = useState("");

  useEffect(() => {
    if (!q.trim()) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlaces([]);
    setResolvedCity("");
    setIntent("");

    fetch(`${AI_PLACES_URL}/places/search?q=${encodeURIComponent(q.trim())}`, { credentials: "include" })
      .then((res) => res.json())
      .then((envelope: ApiEnvelope) => {
        if (!envelope.ok) throw new Error(envelope.error?.details ?? envelope.error?.message ?? "Unknown error");
        if (!cancelled) {
          setPlaces(envelope.data ?? []);
          setResolvedCity(envelope.city ?? "");
          setIntent(envelope.intent ?? "");
        }
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [q]);

  return { places, loading, error, resolvedCity, intent };
}

export function useReviews(placeName: string, city: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    if (!placeName || !city) return;
    setLoading(true);
    setError(null);

    fetch(
      `${REVIEW_PLACES_URL}/reviews?place=${encodeURIComponent(placeName)}&city=${encodeURIComponent(city)}`,
      { credentials: "include" },
    )
      .then((r) => r.json())
      .then((env: ReviewEnvelope) => {
        if (!env.ok) throw new Error((env.error as { message: string })?.message ?? "Failed");
        setReviews((env.data as Review[]) ?? []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { reload(); }, [placeName, city]); // eslint-disable-line react-hooks/exhaustive-deps

  return { reviews, loading, error, reload };
}

export function useReviewSummary(placeName: string, city: string, refreshKey: number) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);

  useEffect(() => {
    if (!placeName || !city) return;

    fetch(
      `${REVIEW_PLACES_URL}/reviews/summary?place=${encodeURIComponent(placeName)}&city=${encodeURIComponent(city)}`,
      { credentials: "include" },
    )
      .then((r) => r.json())
      .then((env: ReviewEnvelope) => {
        if (env.ok) setSummary(env.data as ReviewSummary);
      })
      .catch(() => { /* silent — summary is non-critical */ });
  }, [placeName, city, refreshKey]);

  return summary;
}

export function useFavPlace(
  userId: string | null,
  placeName: string,
  city: string,
  placeData: Omit<Place, "match_reason">,
) {
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!userId || !placeName || !city) return;

    fetch(
      `${FAV_PLACES_URL}/fav-places/check?userId=${encodeURIComponent(userId)}&placeName=${encodeURIComponent(placeName)}&city=${encodeURIComponent(city)}`,
      { credentials: "include" },
    )
      .then((r) => r.json())
      .then((env: FavCheckEnvelope) => {
        if (env.ok && env.data) {
          setSaved(env.data.saved);
          setSavedId(env.data.id);
        }
      })
      .catch(() => { /* silent */ });
  }, [userId, placeName, city]);

  const toggle = async () => {
    if (!userId || toggling) return;
    setToggling(true);

    try {
      if (saved && savedId) {
        const res = await fetch(
          `${FAV_PLACES_URL}/fav-places/${savedId}?userId=${encodeURIComponent(userId)}`,
          { method: "DELETE", credentials: "include" },
        );
        const env = await res.json();
        if (env.ok) { setSaved(false); setSavedId(null); }
      } else {
        const res = await fetch(`${FAV_PLACES_URL}/fav-places`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            placeName,
            city,
            category: placeData.category,
            address:  placeData.address,
            image:    placeData.image ?? undefined,
            placeId:  placeData.place_id ?? undefined,
            rating:   placeData.rating,
          }),
        });
        const env = await res.json();
        if (env.ok && env.data) { setSaved(true); setSavedId(env.data.id); }
      }
    } catch { /* silent */ } finally {
      setToggling(false);
    }
  };

  return { saved, toggling, toggle };
}

export function useSuggest() {
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const getSuggestions = async (
    city: string,
    preferences: string[],
    visited: string[],
    limit = 5,
  ) => {
    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const res = await fetch(`${AI_PLACES_URL}/places/suggest`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, preferences, visited, limit }),
      });
      const data = await res.json();
      if (!Array.isArray(data.suggestions)) {
        throw new Error(data.error ?? "Failed to get suggestions");
      }
      setSuggestions(data.suggestions);
      setFetched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, error, fetched, getSuggestions };
}
