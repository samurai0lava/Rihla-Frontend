import { Bot, AlertCircle, Search } from "lucide-react";
import { usePlaces, useSearch } from "@/hooks/useCityPlaces";
import { useInView } from "@/hooks/useInView";
import { PlaceCard, SkeletonCard, SuggestSection } from "./PlaceCard";
import { useAuth } from "@/context/AuthContext";

interface CityResultsProps {
  /** Free-text search query (AI search mode) */
  query?: string;
  /** Exact city name (direct city mode) */
  city?: string;
}

export default function CityResults({ query, city }: CityResultsProps) {
  const { user } = useAuth();
  const isSearchMode = !!query && !city;

  const cityResult   = usePlaces(isSearchMode ? "" : (city ?? ""));
  const searchResult = useSearch(isSearchMode ? (query ?? "") : "");

  const { places, loading, error } = isSearchMode ? searchResult : cityResult;
  const displayCity = isSearchMode ? (searchResult.resolvedCity || "…") : (city ?? "");
  const intent      = isSearchMode ? searchResult.intent : null;

  const { ref: headerRef, inView: headerInView } = useInView(0.1);

  return (
    <section className="city-results bg-[#faf9f7] dark:bg-[#0e0d0b] py-10 px-4 sm:px-8 lg:px-16">
      <div ref={headerRef} className="max-w-3xl mx-auto mb-8 text-center">
        {isSearchMode && query && (
          <div
            className={`flex items-center justify-center gap-2 mb-3
              transition-all duration-500 ease-out delay-75
              ${headerInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          >
            <span className="inline-flex items-center gap-1.5 text-[12px] text-stone-500 dark:text-stone-400
              bg-stone-100 dark:bg-white/5 border border-stone-200 dark:border-white/[0.07]
              rounded-full px-3 py-1 max-w-sm truncate">
              <Search size={11} className="shrink-0 text-orange-400" />
              {query}
            </span>
          </div>
        )}

        <h2
          className={`text-3xl sm:text-4xl font-bold text-stone-900 dark:text-white tracking-tight mb-3
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
              ? <>Could not search for <strong>"{query}"</strong>: {error}</>
              : <>Could not load places for <strong>{displayCity}</strong>: {error}</>
            }
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto flex flex-col gap-3">
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
  );
}
