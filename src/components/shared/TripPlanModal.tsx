import { useEffect, useRef, useState } from "react";
import {
  X,
  MapPin,
  Star,
  Clock,
  Heart,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  CalendarDays,
} from "lucide-react";
import type { DayPlan, Activity } from "./TripPlannerBar";
import "./TripPlanModal.css";

interface TripPlanData {
  id: string;
  city: string;
  days: number;
  preferences: string[];
  plan: {
    title: string;
    summary: string;
    days: DayPlan[];
    tips?: string[];
  };
  createdAt: string;
}

interface TripPlanModalProps {
  plan: TripPlanData;
  onClose: () => void;
  /** When true, render the plan panel in the page flow (no overlay/backdrop). */
  inline?: boolean;
}

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return null;
  const stars = Math.round(rating * 2) / 2;
  return (
    <span className="tpm-stars">
      <Star size={11} className="tpm-star-icon" />
      <span>{stars.toFixed(1)}</span>
    </span>
  );
}

function ActivityCard({ activity }: { activity: Activity }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="tpm-activity">
      <div className="tpm-activity-time">
        <Clock size={11} />
        <span>{activity.time}</span>
      </div>

      <div className="tpm-activity-body">
        {activity.image && !imgError && (
          <div className="tpm-activity-img-wrap">
            <img
              src={activity.image}
              alt={activity.name}
              className="tpm-activity-img"
              onError={() => setImgError(true)}
            />
            {activity.is_favorite && (
              <span className="tpm-fav-badge">
                <Heart size={10} fill="currentColor" />
                Saved
              </span>
            )}
          </div>
        )}

        <div className="tpm-activity-info">
          <div className="tpm-activity-header">
            <h4 className="tpm-activity-name">{activity.name}</h4>
            {!activity.image && activity.is_favorite && (
              <span className="tpm-fav-badge tpm-fav-badge--inline">
                <Heart size={10} fill="currentColor" />
                Saved
              </span>
            )}
          </div>

          <div className="tpm-activity-meta">
            <span className="tpm-activity-category">{activity.category}</span>
            <StarRating rating={activity.rating} />
            {activity.review_summary?.totalReviews ? (
              <span className="tpm-review-tag">
                {activity.review_summary.averageRating?.toFixed(1) ?? "–"} ·{" "}
                {activity.review_summary.totalReviews} reviews
              </span>
            ) : null}
            <span className="tpm-duration">{activity.duration_minutes} min</span>
          </div>

          <p className="tpm-activity-desc">{activity.description}</p>

          {activity.address && (
            <p className="tpm-activity-address">
              <MapPin size={11} />
              {activity.address}
            </p>
          )}

          {activity.tips && (
            <p className="tpm-activity-tip">
              <Lightbulb size={11} />
              {activity.tips}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TripPlanModal({ plan, onClose, inline = false }: TripPlanModalProps) {
  const [activeDay, setActiveDay] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const dayPlans = plan.plan?.days ?? [];
  const currentDay = dayPlans[activeDay];

  // Close on Escape key
  useEffect(() => {
    if (inline) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, inline]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (inline) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [inline]);

  // Scroll content to top when switching days
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeDay]);

  const handlePrevDay = () => setActiveDay(d => Math.max(0, d - 1));
  const handleNextDay = () => setActiveDay(d => Math.min(dayPlans.length - 1, d + 1));

  const panel = (
    <div className={`tpm-panel${inline ? " tpm-panel--inline" : ""}`}>
        <div className="tpm-header">
          <div className="tpm-header-text">
            <h2 className="tpm-title">{plan.plan?.title ?? `${plan.days}-Day Trip to ${plan.city}`}</h2>
            <p className="tpm-subtitle">
              <MapPin size={12} />
              {plan.city}
              <span className="tpm-header-sep">·</span>
              <CalendarDays size={12} />
              {plan.days} {plan.days === 1 ? "day" : "days"}
              {plan.preferences.length > 0 && (
                <span className="tpm-prefs-inline">
                  · {plan.preferences.join(", ")}
                </span>
              )}
            </p>
          </div>
          <button className="tpm-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {plan.plan?.summary && (
          <p className="tpm-summary">{plan.plan.summary}</p>
        )}

        <div className="tpm-day-tabs">
          <button
            className="tpm-tab-nav"
            onClick={handlePrevDay}
            disabled={activeDay === 0}
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="tpm-tabs-list">
            {dayPlans.map((d, i) => (
              <button
                key={d.day}
                className={`tpm-tab${i === activeDay ? " active" : ""}`}
                onClick={() => setActiveDay(i)}
              >
                Day {d.day}
              </button>
            ))}
          </div>

          <button
            className="tpm-tab-nav"
            onClick={handleNextDay}
            disabled={activeDay === dayPlans.length - 1}
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="tpm-content" ref={contentRef}>
          {currentDay ? (
            <>
              <div className="tpm-day-theme">
                <span className="tpm-day-num">Day {currentDay.day}</span>
                <h3 className="tpm-day-title">{currentDay.theme}</h3>
              </div>

              <div className="tpm-activities">
                {currentDay.activities.map((activity, i) => (
                  <ActivityCard key={`${activity.name}-${i}`} activity={activity} />
                ))}
              </div>
            </>
          ) : (
            <p className="tpm-empty">No activities planned for this day.</p>
          )}

          {activeDay === dayPlans.length - 1 && plan.plan?.tips && plan.plan.tips.length > 0 && (
            <div className="tpm-general-tips">
              <h4 className="tpm-tips-title">
                <Lightbulb size={14} />
                Trip Tips
              </h4>
              <ul className="tpm-tips-list">
                {plan.plan.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
    </div>
  );

  if (inline) {
    return <div className="tpm-inline-root">{panel}</div>;
  }

  return (
    <div className="tpm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      {panel}
    </div>
  );
}

export default TripPlanModal;
