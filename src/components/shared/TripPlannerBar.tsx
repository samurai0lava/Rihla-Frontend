import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";
import TripPlanModal from "./TripPlanModal";
import GlassSearchBar from "./GlassSearchBar";
import GlassCalendar from "./GlassCalendar";
import { useAuth } from "../../context/AuthContext";
import "./TripPlannerBar.css";
import { parseApiJson, resolveGatewayUrl } from "@/lib/api";

const PLANNER_URL = resolveGatewayUrl(
  import.meta.env.VITE_PLANNER_URL as string | undefined,
);

const MAX_TRIP_DAYS = 14;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function defaultTripRange(): { start: Date; end: Date } {
  const start = startOfDay(new Date());
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return { start, end };
}

function inclusiveDays(start: Date, end: Date): number {
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  if (e < s) return 1;
  return Math.floor((e - s) / 86400000) + 1;
}

function formatShort(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Local calendar date as YYYY-MM-DD (matches planner-service parseISODateOnly). */
function toIsoDateLocal(d: Date): string {
  const x = startOfDay(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export interface TripPlan {
  id: string;
  city: string;
  days: number;
  preferences: string[];
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  plan: {
    title: string;
    summary: string;
    days: DayPlan[];
    tips?: string[];
  };
  createdAt: string;
}

export interface DayPlan {
  day: number;
  theme: string;
  activities: Activity[];
}

export interface Activity {
  time: string;
  name: string;
  category: string;
  description: string;
  address: string;
  rating: number | null;
  image: string | null;
  lat: number | null;
  lng: number | null;
  is_favorite: boolean;
  review_summary: { averageRating: number | null; totalReviews: number } | null;
  duration_minutes: number;
  tips: string;
}

interface TripPlannerBarProps {
  defaultCity?: string;
  inlinePlanDisplay?: boolean;
  onPlanGenerated?: (plan: TripPlan) => void;
}

function TripPlannerBar({
  defaultCity = "",
  inlinePlanDisplay = false,
  onPlanGenerated,
}: TripPlannerBarProps) {
  const { user } = useAuth();
  const [city, setCity] = useState(defaultCity);
  const [tripRange, setTripRange] = useState(defaultTripRange);
  const [preferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRootRef = useRef<HTMLDivElement>(null);

  const days = useMemo(
    () => inclusiveDays(tripRange.start, tripRange.end),
    [tripRange.start, tripRange.end],
  );

  const today = startOfDay(new Date());

  const openCalendar = useCallback(() => {
    setCalendarOpen((o) => !o);
  }, []);

  const onRangeComplete = useCallback((start: Date, end: Date) => {
    setTripRange({ start, end });
    setCalendarOpen(false);
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (
        calendarRootRef.current &&
        !calendarRootRef.current.contains(e.target as Node)
      ) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [calendarOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;

    if (!user) {
      setError("Please sign in to generate a trip plan.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${PLANNER_URL}/plan/generate`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: city.trim(),
          days,
          preferences,
          tripStartDate: toIsoDateLocal(tripRange.start),
          tripEndDate: toIsoDateLocal(tripRange.end),
        }),
      });

      const raw = await parseApiJson(res);
      const data = raw as { ok?: boolean; error?: { message?: string }; data?: TripPlan };

      if (!data.ok) {
        throw new Error(data.error?.message ?? "Failed to generate plan");
      }

      const row = data.data as TripPlan;
      if (onPlanGenerated) {
        onPlanGenerated(row);
        return;
      }

      setPlan(row);
      if (!inlinePlanDisplay) setShowModal(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="planner-bar-wrapper">
        <form className="planner-bar" onSubmit={handleSubmit}>
          <GlassSearchBar
            embedded
            placeholder="Where to?"
            value={city}
            onChange={setCity}
            onSelect={setCity}
            wrapperClassName="planner-bar-field"
            inputClassName="planner-bar-input"
          />

          <div className="planner-bar-divider" />

          <div className="planner-bar-calendar" ref={calendarRootRef}>
            <button
              type="button"
              className="planner-bar-calendar-trigger"
              onClick={openCalendar}
              aria-expanded={calendarOpen}
              aria-haspopup="dialog"
            >
              <CalendarDays size={17} className="planner-bar-icon" />
              <span className="planner-bar-calendar-label">
                <span className="planner-bar-calendar-dates">
                  {formatShort(tripRange.start)} – {formatShort(tripRange.end)}
                </span>
                <span className="planner-bar-calendar-days">
                  {days} {days === 1 ? "day" : "days"}
                </span>
              </span>
            </button>

            {calendarOpen ? (
              <div
                className="planner-calendar-popover"
                role="dialog"
                aria-label="Trip dates"
              >
                <GlassCalendar
                  variant="embedded"
                  mode="range"
                  rangeValue={tripRange}
                  onRangeComplete={onRangeComplete}
                  maxRangeDays={MAX_TRIP_DAYS}
                  minDate={today}
                />
              </div>
            ) : null}
          </div>

          <button
            type="submit"
            className="planner-bar-submit"
            disabled={loading || !city.trim()}
            aria-label="Generate trip plan"
          >
            {loading ? (
              <span className="planner-bar-spinner" />
            ) : (
              <>
                <Sparkles size={16} />
                <span>Plan</span>
              </>
            )}
          </button>
        </form>

        {error && <p className="planner-bar-error">{error}</p>}
      </div>

      {plan && (inlinePlanDisplay || showModal) && (
        <TripPlanModal
          plan={plan}
          inline={inlinePlanDisplay}
          onClose={() => {
            setShowModal(false);
            if (inlinePlanDisplay) setPlan(null);
          }}
        />
      )}
    </>
  );
}

export default TripPlannerBar;
