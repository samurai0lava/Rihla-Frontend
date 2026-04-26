import { useState } from "react";
import {
  MapPin,
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
  ChevronDown,
  ChevronUp,
  Send,
  Trash2,
  Users,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
} from "lucide-react";
import {
  useReviews,
  useReviewSummary,
  useFavPlace,
  useSuggest,
  resolvePlaceImageUrl,
  type Place,
  type ReviewSummary,
} from "@/hooks/useCityPlaces";
import { useInView } from "@/hooks/useInView";
import { resolveGatewayUrl } from "@/lib/api";


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


export function StarRating({ rating }: { rating: number | null }) {
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


export function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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


const REVIEW_PLACES_URL = resolveGatewayUrl(
  import.meta.env.VITE_REVIEW_PLACES_URL as string | undefined,
);

interface ReviewEnvelopeLocal {
  ok: boolean;
  data?: unknown;
  error?: { code: string; message: string; details?: string };
}

export function ReviewSection({
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
      const env: ReviewEnvelopeLocal = await res.json();
      if (!env.ok) throw new Error((env.error as { message: string })?.message ?? "Failed to post review");
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
      const env: ReviewEnvelopeLocal = await res.json();
      if (!env.ok) throw new Error((env.error as { message: string })?.message ?? "Failed to delete");
      reload();
      onReviewPosted();
    } catch {
      // silent — delete failure is non-critical
    }
  };

  return (
    <div className="px-5 pb-5 pt-4 border-t border-stone-100 dark:border-white/[0.06]">

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
            bg-stone-50 dark:bg-white/[0.04] border border-stone-200 dark:border-white/[0.08]
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


export function PlaceCard({
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
        bg-white dark:bg-white/4
        border ${place.must_visit ? "border-orange-300/70 dark:border-orange-500/30" : "border-stone-200/80 dark:border-white/[0.07]"}
        ${place.must_visit ? "ring-1 ring-orange-200/60 dark:ring-orange-500/10" : ""}
        shadow-sm
        transition-all duration-500 ease-out
        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
    >
      <div className="flex flex-row h-[200px]">
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

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin size={11} className="shrink-0 text-orange-400" />
              <span className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
                {place.address}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-3">
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
                  {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
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

        <div className="relative w-[38%] shrink-0">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={place.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-stone-100 dark:bg-stone-800/50" />
          )}
          <div className="absolute inset-0 bg-linear-to-r from-white dark:from-[#0e0d0b] via-white/30 dark:via-[#0e0d0b]/30 to-transparent" />
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


export function SkeletonCard() {
  return (
    <div className="flex flex-row overflow-hidden rounded-2xl h-[200px] bg-white dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/[0.07] shadow-sm animate-pulse">
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
      <div className="w-[38%] shrink-0 bg-stone-100 dark:bg-stone-800" />
    </div>
  );
}


const PREFERENCE_OPTIONS = [
  "History", "Street Food", "Nature", "Art", "Shopping",
  "Adventure", "Architecture", "Nightlife", "Relaxation", "Sports",
];

export function SuggestSection({
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
    <div className="max-w-3xl mx-auto mt-10 pt-8 border-t border-stone-200 dark:border-white/[0.07]">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-1.5">
          Personalized <span className="text-orange-500">Suggestions</span>
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Pick what you enjoy and we'll find places that match your interests in {city}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
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
