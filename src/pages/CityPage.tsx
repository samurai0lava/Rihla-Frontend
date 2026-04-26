import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HomeNavBar from "@/components/shared/HomeNavBar";
import CityBackground from "@/assets/marrakech_japanese_ink_20260221_014526 2.png";
import {
  ChevronDown,
  MapPin,
  Search,
  Star,
  Flame,
  TreePine,
  ShoppingBag,
  Landmark,
  Building2,
  BookOpen,
  Bot,
  AlertCircle,
  MessageSquare,
  ChevronUp,
  Send,
  Trash2,
  Users,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { resolveGatewayUrl } from "@/lib/api";

const AI_PLACES_URL =
  resolveGatewayUrl(import.meta.env.VITE_AI_PLACES_URL as string | undefined); // TODO: Store in .env after czar done with dev

const REVIEW_PLACES_URL =
  resolveGatewayUrl(import.meta.env.VITE_REVIEW_PLACES_URL as string | undefined); //same as above

const FAV_PLACES_URL =
  resolveGatewayUrl(import.meta.env.VITE_FAV_PLACES_URL as string | undefined); // TODO: Store in .env after czar done with dev

/** API returns paths like `/places/photos?...` — must hit ai-places origin, not the SPA host */
function resolvePlaceImageUrl(src: string | null | undefined): string | null {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/")) return `${AI_PLACES_URL}${src}`;
  return src;
}

interface Place {
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

interface ApiEnvelope {
  ok: boolean;
  data?: Place[];
  error?: { code: string; message: string; details?: string };
  city?: string;
  intent?: string;
}

interface Review {
  id: string;
  placeName: string;
  city: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewSummary {
  averageRating: number | null;
  totalReviews: number;
}

interface ReviewEnvelope {
  ok: boolean;
  data?: Review[] | Review | ReviewSummary | { id: string };
  error?: { code: string; message: string; details?: string };
}

function usePlaces(city: string) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!city.trim()) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlaces([]);

    fetch(`${AI_PLACES_URL}/places?city=${encodeURIComponent(city.trim())}`, { credentials: 'include' })
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

function useSearch(q: string) {
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

    fetch(`${AI_PLACES_URL}/places/search?q=${encodeURIComponent(q.trim())}`, { credentials: 'include' })
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

function useReviews(placeName: string, city: string) {
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

function useReviewSummary(placeName: string, city: string, refreshKey: number) {
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

interface FavCheckEnvelope {
  ok: boolean;
  data?: { saved: boolean; id: string | null };
  error?: { code: string; message: string };
}

function useFavPlace(userId: string | null, placeName: string, city: string, placeData: Omit<Place, "match_reason">) {
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

interface CategoryStyle {
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  Park: {
    icon: <TreePine size={13} />,
    bg: "bg-emerald-50 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  Market: {
    icon: <ShoppingBag size={13} />,
    bg: "bg-orange-50 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
  "Historical Site": {
    icon: <Landmark size={13} />,
    bg: "bg-stone-100 dark:bg-stone-800/50",
    text: "text-stone-600 dark:text-stone-300",
    border: "border-stone-200 dark:border-stone-700",
  },
  Monument: {
    icon: <Building2 size={13} />,
    bg: "bg-sky-50 dark:bg-sky-900/30",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-200 dark:border-sky-800",
  },
  Museum: {
    icon: <BookOpen size={13} />,
    bg: "bg-violet-50 dark:bg-violet-900/30",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-200 dark:border-violet-800",
  },
  Restaurant: {
    icon: <ShoppingBag size={13} />,
    bg: "bg-rose-50 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  Beach: {
    icon: <MapPin size={13} />,
    bg: "bg-cyan-50 dark:bg-cyan-900/30",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
  },
};

function getCategoryStyle(category: string): CategoryStyle {
  return (
    CATEGORY_STYLES[category] ?? {
      icon: <Landmark size={13} />,
      bg: "bg-stone-100 dark:bg-stone-800/50",
      text: "text-stone-600 dark:text-stone-300",
      border: "border-stone-200 dark:border-stone-700",
    }
  );
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function StarRating({ rating }: { rating: number | null }) {
  const safeRating = rating ?? 0;
  const full = Math.floor(safeRating);
  const hasHalf = safeRating - full >= 0.3;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={13}
            className={
              i < full
                ? "fill-orange-400 text-orange-400"
                : i === full && hasHalf
                  ? "fill-orange-200 text-orange-400"
                  : "fill-stone-200 text-stone-200 dark:fill-stone-700 dark:text-stone-700"
            }
          />
        ))}
      </div>
      <span className="text-xs font-bold text-orange-500 dark:text-orange-400 tabular-nums">
        {safeRating.toFixed(1)}
      </span>
    </div>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
          aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            size={20}
            className={
              n <= (hovered || value)
                ? "fill-orange-400 text-orange-400 transition-colors"
                : "fill-stone-200 text-stone-300 dark:fill-stone-700 dark:text-stone-600 transition-colors"
            }
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs text-stone-500 dark:text-stone-400">
          {["", "Poor", "Fair", "Good", "Very good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

function ReviewSection({
  placeName,
  city,
  userId,
  summary,
  onReviewPosted,
}: {
  placeName: string;
  city: string;
  userId: string | null;
  summary: ReviewSummary | null;
  onReviewPosted: () => void;
}) {
  const { reviews, loading, reload } = useReviews(placeName, city);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { setSubmitError("Please sign in to post a review."); return; }
    if (rating === 0) { setSubmitError("Please select a star rating."); return; }
    if (comment.trim().length < 3) { setSubmitError("Comment must be at least 3 characters."); return; }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`${REVIEW_PLACES_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ placeName, city, rating, comment: comment.trim() }),
      });
      const env: ReviewEnvelope = await res.json();
      if (!env.ok) throw new Error(env.error?.message ?? "Failed to post review");
      setRating(0);
      setComment("");
      reload();
      onReviewPosted();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to post review");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      const res = await fetch(
        `${REVIEW_PLACES_URL}/reviews/${reviewId}`,
        { method: "DELETE", credentials: "include" },
      );
      const env: ReviewEnvelope = await res.json();
      if (!env.ok) throw new Error(env.error?.message ?? "Failed to delete");
      reload();
      onReviewPosted();
    } catch {
      // silent — delete failure is non-critical
    }
  };

  return (
    <div className="px-5 pb-5 pt-4 border-t border-stone-100 dark:border-white/6">

      {summary && summary.totalReviews > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-stone-400" />
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              Community
            </span>
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={11}
                className={
                  i < Math.round(summary.averageRating ?? 0)
                    ? "fill-orange-400 text-orange-400"
                    : "fill-stone-200 text-stone-200 dark:fill-stone-700 dark:text-stone-700"
                }
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-orange-500 tabular-nums">
            {summary.averageRating?.toFixed(1)}
          </span>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            ({summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""})
          </span>
        </div>
      )}

      {loading ? (
        <div className="space-y-2 mb-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-stone-100 dark:bg-stone-800/40 animate-pulse" />
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <ul className="space-y-3 mb-5 max-h-52 overflow-y-auto pr-1">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-1 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-white/[0.03] border border-stone-100 dark:border-white/[0.05]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={
                        i < r.rating
                          ? "fill-orange-400 text-orange-400"
                          : "fill-stone-200 text-stone-200 dark:fill-stone-700 dark:text-stone-700"
                      }
                    />
                  ))}
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 ml-1">
                    {r.userId === userId ? "You" : r.userId.slice(0, 8) + "…"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-300 dark:text-stone-600">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                  {r.userId === userId && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-stone-300 hover:text-rose-400 dark:text-stone-600 dark:hover:text-rose-400 transition-colors"
                      aria-label="Delete review"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[12px] text-stone-600 dark:text-stone-300 leading-relaxed">
                {r.comment}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-stone-400 dark:text-stone-600 mb-4">
          No reviews yet — be the first!
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <StarPicker value={rating} onChange={setRating} />

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience…"
          rows={2}
          className="w-full resize-none rounded-xl px-3 py-2 text-[12.5px] text-stone-800 dark:text-white
            bg-stone-50 dark:bg-white/4 border border-stone-200 dark:border-white/[0.08]
            placeholder:text-stone-400 outline-none focus:border-orange-300 dark:focus:border-orange-500/50
            transition-colors duration-150"
        />

        {submitError && (
          <p className="text-[11px] text-rose-500 flex items-center gap-1">
            <AlertCircle size={11} />
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="self-end flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600
            disabled:opacity-50 disabled:cursor-not-allowed
            text-white text-xs font-semibold px-3 py-1.5 rounded-xl
            transition-colors duration-200"
        >
          <Send size={11} />
          {submitting ? "Posting…" : "Post Review"}
        </button>
      </form>
    </div>
  );
}


function PlaceCard({
  place,
  index,
  city,
  userId,
}: {
  place: Place;
  index: number;
  city: string;
  userId: string | null;
}) {
  const style = getCategoryStyle(place.category);
  const { ref, inView } = useInView(0.1);

  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const summary = useReviewSummary(place.name, city, summaryRefreshKey);
  const { saved, toggling, toggle } = useFavPlace(userId, place.name, city, place);

  const handleReviewPosted = () => setSummaryRefreshKey((k) => k + 1);
  const imageSrc = resolvePlaceImageUrl(place.image);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: inView ? `${index * 60}ms` : "0ms" }}
      className={`group relative flex flex-col overflow-hidden rounded-2xl
        bg-white dark:bg-white/[0.04]
        border ${place.must_visit ? "border-orange-300/70 dark:border-orange-500/30" : "border-stone-200/80 dark:border-white/[0.07]"}
        ${place.must_visit ? "ring-1 ring-orange-200/60 dark:ring-orange-500/10" : ""}
        shadow-sm hover:shadow-md
        transition-all duration-500 ease-out
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="flex flex-col sm:flex-row sm:h-[200px]">
        {place.must_visit && (
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-400 rounded-l-2xl" />
        )}

        <div className="flex flex-col justify-between flex-1 min-w-0 px-5 py-4 pl-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}
            >
              {style.icon}
              {place.category}
            </span>
            {place.must_visit && (
              <span className="inline-flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                <Flame size={9} />
                Must Visit
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1 mt-2">
            <h3 className="font-bold text-[17px] leading-snug text-stone-900 dark:text-white truncate">
              {place.name}
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <StarRating rating={place.rating} />
              {summary && summary.totalReviews > 0 && (
                <button
                  onClick={() => setReviewsOpen((o) => !o)}
                  className="inline-flex items-center gap-1 text-[11px] text-stone-400 dark:text-stone-500
                    hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                >
                  <Users size={11} />
                  {summary.totalReviews} review{summary.totalReviews !== 1 ? "s" : ""}
                  {summary.averageRating !== null && (
                    <span className="font-semibold text-orange-400">
                      {" "}· {summary.averageRating.toFixed(1)}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-[12.5px] leading-relaxed text-stone-500 dark:text-stone-400 line-clamp-2 mt-2">
            {place.description}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 pt-3 border-t border-stone-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin size={11} className="shrink-0 text-orange-400" />
              <span className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
                {place.address}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end shrink-0 sm:ml-3">
              {userId && (
                <button
                  onClick={toggle}
                  disabled={toggling}
                  aria-label={saved ? "Remove from saved places" : "Save place"}
                  className={`flex items-center gap-1 text-[11px] font-medium transition-colors
                    disabled:opacity-50
                    ${saved
                      ? "text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
                      : "text-stone-400 hover:text-orange-500 dark:text-stone-500 dark:hover:text-orange-400"
                    }`}
                >
                  {saved
                    ? <BookmarkCheck size={13} />
                    : <Bookmark size={13} />
                  }
                  {saved ? "Saved" : "Save"}
                </button>
              )}

              {((place.lat != null && place.lng != null) || place.place_id) && (
                <a
                  href={
                    place.lat != null && place.lng != null
                      ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`
                      : `https://www.google.com/maps/search/?api=1&query_place_id=${place.place_id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] font-medium
                    text-stone-400 hover:text-orange-500 dark:text-stone-500 dark:hover:text-orange-400
                    transition-colors"
                  aria-label="Open in Google Maps"
                >
                  <ExternalLink size={12} />
                  Maps
                </a>
              )}

              <button
                onClick={() => setReviewsOpen((o) => !o)}
                className="flex items-center gap-1 text-[11px] font-medium
                  text-stone-400 hover:text-orange-500 dark:text-stone-500 dark:hover:text-orange-400
                  transition-colors"
              >
                <MessageSquare size={12} />
                {reviewsOpen ? (
                  <>Hide <ChevronUp size={11} /></>
                ) : (
                  <>Reviews <ChevronDown size={11} /></>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="relative w-full sm:w-[38%] shrink-0 h-44 sm:h-auto">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={place.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-stone-100 dark:bg-stone-800/50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-white dark:from-[#0e0d0b] via-white/30 dark:via-[#0e0d0b]/30 to-transparent" />
        </div>
      </div>

      {reviewsOpen && (
        <ReviewSection
          placeName={place.name}
          city={city}
          userId={userId}
          summary={summary}
          onReviewPosted={handleReviewPosted}
        />
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col sm:flex-row overflow-hidden rounded-2xl sm:h-[200px] bg-white dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/[0.07] shadow-sm animate-pulse">
      <div className="flex flex-col justify-between flex-1 min-w-0 px-5 py-4 pl-6 gap-3">
        <div className="h-6 w-28 rounded-full bg-stone-100 dark:bg-stone-800" />
        <div className="space-y-2">
          <div className="h-5 w-48 rounded bg-stone-100 dark:bg-stone-800" />
          <div className="h-3.5 w-20 rounded bg-stone-100 dark:bg-stone-800" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded bg-stone-100 dark:bg-stone-800" />
          <div className="h-3 w-4/5 rounded bg-stone-100 dark:bg-stone-800" />
        </div>
        <div className="h-3 w-40 rounded bg-stone-100 dark:bg-stone-800 mt-1" />
      </div>
      <div className="w-full sm:w-[38%] h-44 sm:h-auto shrink-0 bg-stone-100 dark:bg-stone-800" />
    </div>
  );
}


const PREFERENCE_OPTIONS = [
  "History", "Street Food", "Nature", "Art", "Shopping",
  "Adventure", "Architecture", "Nightlife", "Relaxation", "Sports",
];

function useSuggest() {
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
        credentials: 'include',
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

function SuggestSection({
  city,
  visitedNames,
  userId,
}: {
  city: string;
  visitedNames: string[];
  userId: string | null;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const { suggestions, loading, error, fetched, getSuggestions } = useSuggest();

  const togglePref = (pref: string) => {
    setSelected((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref],
    );
  };

  const handleSubmit = () => {
    if (selected.length === 0 || !city.trim()) return;
    getSuggestions(city, selected, visitedNames, 5);
  };

  return (
    <div className="max-w-3xl mx-auto mt-16 pt-12 border-t border-stone-200 dark:border-white/[0.07]">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
          Personalized <span className="text-orange-500">Suggestions</span>
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Pick what you enjoy and we'll find places that match your interests in {city}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {PREFERENCE_OPTIONS.map((pref) => (
          <button
            key={pref}
            onClick={() => togglePref(pref)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all duration-150
              ${selected.includes(pref)
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white dark:bg-white/[0.04] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-white/[0.08] hover:border-orange-300 dark:hover:border-orange-500/50"
              }`}
          >
            {pref}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={selected.length === 0 || loading || !city.trim()}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600
          disabled:opacity-40 disabled:cursor-not-allowed
          text-white text-sm font-semibold px-5 py-2.5 rounded-xl
          transition-colors duration-200 mb-8"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Finding matches…
          </>
        ) : (
          <>
            <Bot size={15} />
            Get Suggestions
          </>
        )}
      </button>

      {error && (
        <div className="flex items-center gap-3 px-5 py-4 mb-6 rounded-2xl
          bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800
          text-rose-700 dark:text-rose-300">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {fetched && !loading && suggestions.length === 0 && !error && (
        <p className="text-center text-stone-400 dark:text-stone-600 text-sm mb-8">
          No matching places found. Try different preferences.
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-col gap-4">
          {suggestions.map((place, i) => (
            <PlaceCard key={place.place_id ?? place.name} place={place} index={i} city={city} userId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}


function CityPage() {
  const [searchParams] = useSearchParams();
  const cityParam = searchParams.get("city");
  const qParam    = searchParams.get("q");
  const isSearchMode = !!qParam && !cityParam;
  const { user } = useAuth();

  const sectionRef = useRef<HTMLElement>(null);
  const { ref: headerRef, inView: headerInView } = useInView(0.2);

  const cityResult   = usePlaces(isSearchMode ? "" : (cityParam ?? "Marrakesh"));
  const searchResult = useSearch(isSearchMode ? (qParam ?? "") : "");

  const { places, loading, error } = isSearchMode ? searchResult : cityResult;
  const displayCity = isSearchMode ? (searchResult.resolvedCity || "…") : (cityParam ?? "Marrakesh");
  const intent      = isSearchMode ? searchResult.intent : null;

  return (
    <div>
      <div
        className="bg-cover bg-bottom h-screen w-full relative flex flex-col"
        style={{ backgroundImage: `url(${CityBackground})` }}
      >
        <HomeNavBar />
        <div className="flex-1" />
        <div className="pb-10 flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-500">
            Scroll to explore
          </span>
          <ChevronDown size={30} strokeWidth={1.5} />
        </div>
      </div>

      <section
        ref={sectionRef}
        className="bg-[#faf9f7] dark:bg-[#0e0d0b] py-12 sm:py-20 px-4 sm:px-8 lg:px-16"
      >
        <div ref={headerRef} className="max-w-3xl mx-auto mb-8 sm:mb-12 text-center">

          <div
            className={`inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full
              bg-stone-100 dark:bg-white/[0.06] border border-stone-200 dark:border-white/[0.08]
              transition-all duration-500 ease-out
              ${headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            <Bot size={13} className="text-orange-500" />
            <span className="text-[11px] font-semibold tracking-widest uppercase text-stone-500 dark:text-stone-400">
              {isSearchMode ? "AI Search Results" : "Curated by Google Places"}
            </span>
          </div>

          {isSearchMode && qParam && (
            <div
              className={`flex items-center justify-center gap-2 mb-3
                transition-all duration-500 ease-out delay-75
                ${headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
            >
              <span className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 dark:text-stone-400
                bg-stone-100 dark:bg-white/[0.05] border border-stone-200 dark:border-white/[0.07]
                rounded-full px-3 py-1 max-w-sm truncate">
                <Search size={11} className="shrink-0 text-orange-400" />
                {qParam}
              </span>
            </div>
          )}

          <h2
            className={`text-4xl sm:text-5xl font-bold text-stone-900 dark:text-white tracking-tight mb-4
              transition-all duration-600 ease-out delay-100
              ${headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
          >
            {isSearchMode && loading && !displayCity.trim() ? (
              <span className="text-stone-400 dark:text-stone-500">Searching…</span>
            ) : (
              <>Discover <span className="text-orange-500">{displayCity}</span></>
            )}
          </h2>

          <p
            className={`text-[15px] text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed
              transition-all duration-500 ease-out delay-200
              ${headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          >
            {intent
              ? <><span className="text-orange-400 font-medium">{intent}</span> — matched by Google Places</>
              : <>Curated picks to help you experience the very best of {displayCity} — from hidden gems to iconic landmarks.</>
            }
          </p>
        </div>

        {error && (
          <div className="max-w-3xl mx-auto mb-8 flex items-center gap-3 px-5 py-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-sm">
              {isSearchMode
                ? <>Could not search for <strong>"{qParam}"</strong>: {error}</>
                : <>Could not load places for <strong>{displayCity}</strong>: {error}</>
              }
            </p>
          </div>
        )}

        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
            : places.map((place, i) => (
                <PlaceCard key={place.name} place={place} index={i} city={displayCity} userId={user?.id ?? null} />
              ))}
        </div>

        {!loading && !error && places.length === 0 && (
          <p className="text-center text-stone-400 dark:text-stone-600 mt-8 text-sm">
            No places found. Try a different {isSearchMode ? "query" : "city"}.
          </p>
        )}

        {!loading && (
          <SuggestSection
            city={displayCity}
            visitedNames={places.map((p) => p.name)}
            userId={user?.id ?? null}
          />
        )}

        <p className="mt-12 text-center text-[11px] text-stone-400 dark:text-stone-600 tracking-wide">
          Powered by Google Places API
        </p>
      </section>
    </div>
  );
}

export default CityPage;
