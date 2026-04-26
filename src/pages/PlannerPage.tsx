import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarDays } from "lucide-react";
import HomeNavBar from "../components/shared/HomeNavBar";
import type { Activity, DayPlan } from "../components/shared/TripPlannerBar";
import "./HomePage.css";
import "./PlannerPage.css";
import bgvideo from "../assets/home-background.mp4";
import { useAuth } from "@/context/AuthContext";
import { needsInterestsOnboarding } from "@/lib/interestsOnboarding";
import { useTheme } from "@/context/ThemeContext";
import BackArrow from "@/components/shared/BackArrow";
import GoogleCalendar from "@/components/shared/GoogleCalendar";
import { parseApiJson, resolveGatewayUrl } from "@/lib/api";

const PLANNER_URL =
  resolveGatewayUrl(import.meta.env.VITE_PLANNER_URL as string | undefined);

const STOP_TYPES = ["Food", "Sightseeing", "Stay", "Transport"] as const;
type StopType = (typeof STOP_TYPES)[number];

interface PlanSummary {
  id: string;
  city: string;
  days: number;
  preferences: string[];
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlanPayload {
  title: string;
  summary: string;
  days: DayPlan[];
  tips?: string[];
}

interface TripPlanRow {
  id: string;
  userId: string;
  city: string;
  days: number;
  preferences: string[];
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  plan: PlanPayload;
  createdAt: string;
  updatedAt: string;
}

function cloneRow(row: TripPlanRow): TripPlanRow {
  return JSON.parse(JSON.stringify(row)) as TripPlanRow;
}

function thumbColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 62% 48%)`;
}

function categoryToStopType(category: string): StopType {
  const c = category.trim().toLowerCase();
  if (c === "food" || c.includes("food") || c.includes("restaurant")) return "Food";
  if (c === "stay" || c.includes("hotel") || c.includes("stay")) return "Stay";
  if (c === "transport" || c.includes("transport")) return "Transport";
  if (c === "sightseeing" || c.includes("sight")) return "Sightseeing";
  return "Sightseeing";
}

function dotClassFromCategory(category: string): string {
  const t = categoryToStopType(category);
  switch (t) {
    case "Food":
      return "pp-dot pp-dot--food";
    case "Stay":
      return "pp-dot pp-dot--stay";
    case "Transport":
      return "pp-dot pp-dot--transport";
    default:
      return "pp-dot pp-dot--sightseeing";
  }
}

function blankActivity(): Activity {
  return {
    time: "09:00",
    name: "New stop",
    category: "Sightseeing",
    description: "",
    address: "",
    rating: null,
    image: null,
    lat: null,
    lng: null,
    is_favorite: false,
    review_summary: null,
    duration_minutes: 60,
    tips: "",
  };
}

/** Parse API date: YYYY-MM-DD or ISO datetime (Prisma JSON). Use local calendar fields. */
function parseTripDateField(value: string | null | undefined): Date | null {
  if (value == null || String(value).trim() === "") return null;
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d);
    if (dt.getFullYear() === y && dt.getMonth() === mo && dt.getDate() === d) return dt;
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Fallback when tripStartDate / tripEndDate are missing (legacy plans). */
function formatTripRangeFromCreated(createdAt: string, days: number): string {
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return `${days} day${days === 1 ? "" : "s"}`;
  const end = new Date(start);
  end.setDate(end.getDate() + Math.max(0, days - 1));
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const a = start.toLocaleDateString(undefined, opts);
  const b = end.toLocaleDateString(undefined, opts);
  return `${a} – ${b}`;
}

function formatTripDateRangeLabel(s: {
  tripStartDate?: string | null;
  tripEndDate?: string | null;
  createdAt: string;
  days: number;
}): string {
  const a = parseTripDateField(s.tripStartDate);
  const b = parseTripDateField(s.tripEndDate);
  if (a && b) {
    const sameYear = a.getFullYear() === b.getFullYear();
    const optsStart: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      ...(sameYear ? {} : { year: "numeric" }),
    };
    const optsEnd: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return `${a.toLocaleDateString(undefined, optsStart)} – ${b.toLocaleDateString(undefined, optsEnd)}`;
  }
  return formatTripRangeFromCreated(s.createdAt, s.days);
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const ms = message.length > 100 ? 6500 : 2000;
    const t = window.setTimeout(onDismiss, ms);
    return () => window.clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div className="pp-toast" role="status">
      {message}
    </div>
  );
}

function StopEditForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: Activity;
  onDone: (a: Activity) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [time, setTime] = useState(initial.time);
  const [type, setType] = useState<StopType>(categoryToStopType(initial.category));

  return (
    <div className="pp-stop-edit-form">
      <div>
        <label htmlFor="pp-stop-name">Name</label>
        <input
          id="pp-stop-name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor="pp-stop-desc">Description</label>
        <textarea
          id="pp-stop-desc"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="pp-stop-time">Time</label>
        <input
          id="pp-stop-time"
          value={time}
          onChange={e => setTime(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div>
        <label htmlFor="pp-stop-type">Type</label>
        <select
          id="pp-stop-type"
          value={type}
          onChange={e => setType(e.target.value as StopType)}
        >
          {STOP_TYPES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" className="pp-btn-done" onClick={() => onDone({ ...initial, name, description, time, category: type })}>
          Done
        </button>
        <button type="button" className="pp-btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function StopCard({
  activity,
  editing,
  onEdit,
  onRemove,
  onSaveEdit,
  onCancelEdit,
}: {
  activity: Activity;
  editing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onSaveEdit: (a: Activity) => void;
  onCancelEdit: () => void;
}) {
  return (
    <div className={`pp-stop-card${editing ? " pp-stop-card--editing" : ""}`}>
      {!editing && (
        <div className="pp-stop-actions">
          <button type="button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="pp-stop-remove" onClick={onRemove}>
            Remove
          </button>
        </div>
      )}
      <div className="pp-stop-card-inner">
        <span className={dotClassFromCategory(activity.category)} aria-hidden />
        <div className="pp-stop-body">
          {editing ? (
            <StopEditForm initial={activity} onDone={onSaveEdit} onCancel={onCancelEdit} />
          ) : (
            <>
              <div className="pp-stop-time">{activity.time}</div>
              <h4 className="pp-stop-name">{activity.name}</h4>
              {activity.description ? (
                <p className="pp-stop-desc">{activity.description}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DaySection({
  dayPlan,
  dayIndex,
  editingKey,
  setEditingKey,
  onPatchDay,
}: {
  dayPlan: DayPlan;
  dayIndex: number;
  editingKey: string | null;
  setEditingKey: (k: string | null) => void;
  onPatchDay: (dayIndex: number, next: DayPlan) => void;
}) {
  const prefix = `d${dayIndex}-`;

  const updateActivity = (ai: number, next: Activity) => {
    const activities = [...dayPlan.activities];
    activities[ai] = next;
    onPatchDay(dayIndex, { ...dayPlan, activities });
  };

  const removeActivity = (ai: number) => {
    const activities = dayPlan.activities.filter((_, i) => i !== ai);
    onPatchDay(dayIndex, { ...dayPlan, activities });
    setEditingKey(null);
  };

  const addStop = () => {
    const activities = [...dayPlan.activities, blankActivity()];
    onPatchDay(dayIndex, { ...dayPlan, activities });
    setEditingKey(`${prefix}${activities.length - 1}`);
  };

  return (
    <section className="planner-day-block">
      <p className="planner-day-heading">Day {dayPlan.day}</p>
      <h3 className="planner-day-theme">{dayPlan.theme}</h3>
      <div className="pp-stop-list">
        {dayPlan.activities.map((act, ai) => {
          const key = `${prefix}${ai}`;
          return (
            <StopCard
              key={key}
              activity={act}
              editing={editingKey === key}
              onEdit={() => setEditingKey(key)}
              onRemove={() => removeActivity(ai)}
              onSaveEdit={a => {
                updateActivity(ai, a);
                setEditingKey(null);
              }}
              onCancelEdit={() => setEditingKey(null)}
            />
          );
        })}
      </div>
      <button type="button" className="pp-add-stop" onClick={addStop}>
        + Add stop
      </button>
    </section>
  );
}

function PlannerSidebar({
  summaries,
  selectedId,
  loading,
  onSelect,
  onNewTrip,
}: {
  summaries: PlanSummary[];
  selectedId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNewTrip: () => void;
}) {
  return (
    <aside className="planner-sidebar">
      <div className="planner-sidebar-header">
        <div className="planner-sidebar-title">Your trips</div>
        <button type="button" className="pp-btn-new-trip" onClick={onNewTrip}>
          + New trip
        </button>
      </div>
      <div className="planner-sidebar-list">
        {loading && summaries.length === 0 ? (
          <p className="planner-loading-inline">Loading…</p>
        ) : null}
        {!loading && summaries.length === 0 ? (
          <p className="planner-loading-inline">No saved plans yet.</p>
        ) : null}
        {summaries.map(s => (
          <button
            key={s.id}
            type="button"
            className={`pp-plan-item${selectedId === s.id ? " pp-plan-item--active" : ""}`}
            style={{ "--pp-thumb": thumbColor(s.id) } as CSSProperties}
            onClick={() => onSelect(s.id)}
          >
            <span className="pp-plan-item-thumb" />
            <div className="pp-plan-item-body">
              <p className="pp-plan-item-name">{s.city}</p>
              <p className="pp-plan-item-meta">
                {formatTripDateRangeLabel(s)} · {s.days} day{s.days === 1 ? "" : "s"}
              </p>
              <span className="pp-plan-item-saved">Saved</span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

async function parseJson(res: Response): Promise<{ ok: boolean; data?: unknown; error?: { message?: string } }> {
  try {
    const raw = await parseApiJson(res);
    if (raw == null) {
      return { ok: false, error: { message: "Empty response from server" } };
    }
    return raw as { ok: boolean; data?: unknown; error?: { message?: string } };
  } catch (e) {
    return {
      ok: false,
      error: { message: e instanceof Error ? e.message : "Invalid response" },
    };
  }
}

export default function PlannerPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();

  const [summaries, setSummaries] = useState<PlanSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activePlan, setActivePlan] = useState<TripPlanRow | null>(null);
  const [dirty, setDirty] = useState(false);
  const [editingStopKey, setEditingStopKey] = useState<string | null>(null);

  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => setToast(msg), []);
  const dismissToast = useCallback(() => setToast(null), []);

  const fetchSummaries = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch(`${PLANNER_URL}/plans`, { credentials: "include" });
      const data = await parseJson(res);
      if (!data.ok) throw new Error(data.error?.message ?? "Failed to load plans");
      setSummaries(data.data as PlanSummary[]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not load trips");
      setSummaries([]);
    } finally {
      setListLoading(false);
    }
  }, [showToast]);

  const loadPlan = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`${PLANNER_URL}/plan/${id}`, { credentials: "include" });
        const data = await parseJson(res);
        if (!data.ok) throw new Error(data.error?.message ?? "Failed to load plan");
        const raw = data.data as TripPlanRow;
        const row = cloneRow(raw);
        console.log("[planner] GET /plan/:id response shape", {
          topLevelKeys: Object.keys(row),
          planKeys: row.plan ? Object.keys(row.plan) : [],
          dayCount: row.plan?.days?.length,
          sampleDay: row.plan?.days?.[0],
          sampleActivity: row.plan?.days?.[0]?.activities?.[0],
        });
        setActivePlan(row);
        setDirty(false);
        setEditingStopKey(null);
        setSearchParams({ id }, { replace: true });
      } catch (e) {
        showToast(e instanceof Error ? e.message : "Could not open plan");
      }
    },
    [setSearchParams, showToast]
  );

  useEffect(() => {
    if (authLoading || !user) return;
    if (needsInterestsOnboarding(user.interests)) {
      navigate("/interests", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void fetchSummaries();
  }, [user, fetchSummaries]);

  const planIdFromUrl = searchParams.get("id");
  useEffect(() => {
    if (!user || !planIdFromUrl) return;
    if (activePlan?.id === planIdFromUrl) return;
    void loadPlan(planIdFromUrl);
  }, [user, planIdFromUrl, activePlan?.id, loadPlan]);

  const patchDay = (dayIndex: number, next: DayPlan) => {
    if (!activePlan) return;
    const plan = cloneRow(activePlan);
    const days = [...plan.plan.days];
    days[dayIndex] = next;
    plan.plan = { ...plan.plan, days };
    setActivePlan(plan);
    setDirty(true);
  };

  const setTitle = (title: string) => {
    if (!activePlan) return;
    const plan = cloneRow(activePlan);
    plan.plan = { ...plan.plan, title };
    setActivePlan(plan);
    setDirty(true);
  };

  const persistPlan = async (row: TripPlanRow): Promise<TripPlanRow> => {
    let id = row.id;
    let body = row;

    if (!id) {
      const res = await fetch(`${PLANNER_URL}/plan/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: row.city,
          days: row.days,
          preferences: row.preferences,
        }),
      });
      const data = await parseJson(res);
      if (!data.ok) throw new Error(data.error?.message ?? "Generate failed");
      body = cloneRow(data.data as TripPlanRow);
      id = body.id;
    }

    const putRes = await fetch(`${PLANNER_URL}/plan/${id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: body.city,
        days: body.days,
        preferences: body.preferences,
        plan: body.plan,
        ...(body.tripStartDate && body.tripEndDate
          ? {
              tripStartDate: body.tripStartDate,
              tripEndDate: body.tripEndDate,
            }
          : {}),
      }),
    });
    const putData = await parseJson(putRes);
    if (!putData.ok) throw new Error(putData.error?.message ?? "Save failed");
    return cloneRow(putData.data as TripPlanRow);
  };

  const handleSave = async () => {
    if (!activePlan || !dirty) return;
    setSaveLoading(true);
    try {
      const saved = await persistPlan(activePlan);
      setActivePlan(saved);
      setDirty(false);
      setSearchParams({ id: saved.id }, { replace: true });
      await fetchSummaries();
      showToast("Saved");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activePlan?.id) return;
    if (!window.confirm("Delete this trip? This cannot be undone.")) return;
    try {
      const res = await fetch(`${PLANNER_URL}/plan/${activePlan.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await parseJson(res);
      if (!data.ok) throw new Error(data.error?.message ?? "Delete failed");
      setActivePlan(null);
      setDirty(false);
      setEditingStopKey(null);
      setSearchParams({}, { replace: true });
      await fetchSummaries();
      showToast("Trip deleted");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const handleShare = async () => {
    if (!activePlan?.id) return;
    const url = `${window.location.origin}/planner?id=${activePlan.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch {
      showToast("Could not copy link");
    }
  };

  const handleExportToGoogleCalendar = useCallback(async () => {
    if (!activePlan?.id) return;
    try {
      showToast("Adding to Google Calendar…");
      const res = await fetch(
        `${PLANNER_URL}/plan/${activePlan.id}/export/google-calendar`,
        { method: "POST", credentials: "include" }
      );
      const data = await parseJson(res);
      if (!data.ok) throw new Error(data.error?.message ?? "Export failed");
      const payload = data.data as {
        total: number;
        failed: number;
        firstError?: string;
      };
      const { total, failed, firstError } = payload;
      if (total === 0) {
        showToast("No activities to add to the calendar.");
        return;
      }
      if (failed === 0) {
        showToast(`${total} event${total === 1 ? "" : "s"} added to Google Calendar!`);
      } else if (failed === total && firstError) {
        showToast(firstError);
      } else {
        showToast(
          `${total - failed}/${total} events added (${failed} failed). ${firstError ?? ""}`.trim()
        );
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not export to calendar");
    }
  }, [activePlan, showToast]);

  const goToNewTripOnHome = () => {
    navigate("/home", { state: { openPlanTab: true } });
  };

  return (
    <div className="planner-page-shell home-page home-page--hero">
      <HomeNavBar />
      <div className="home-nav-main-offset planner-page-body">
        <div className="planner-root" data-theme={theme}>
        {toast ? <Toast message={toast} onDismiss={dismissToast} /> : null}
        <div className="planner-layout">
          <PlannerSidebar
            summaries={summaries}
            selectedId={activePlan?.id ?? null}
            loading={listLoading}
            onSelect={id => void loadPlan(id)}
            onNewTrip={goToNewTripOnHome}
          />
          <div className="planner-main">
            {!activePlan ? (
              <div className="planner-empty">
                <p className="planner-empty-text">
                  Select a saved trip from the sidebar, or plan a new trip on Home.
                </p>
                <button type="button" className="pp-btn-save" onClick={goToNewTripOnHome}>
                  Go to Home
                </button>
              </div>
            ) : (
              <>
                <header className="planner-toolbar">
                  <div className="planner-toolbar-title-wrap">
                    <input
                      className="planner-toolbar-title"
                      value={activePlan.plan.title}
                      onChange={e => setTitle(e.target.value)}
                      aria-label="Trip title"
                    />
                    {!dirty ? <span className="pp-badge-saved">Saved</span> : null}
                  </div>
                  <div className="planner-toolbar-actions">
                    {dirty ? (
                      <button
                        type="button"
                        className="pp-btn-save"
                        disabled={saveLoading}
                        onClick={() => void handleSave()}
                      >
                        {saveLoading ? "Saving…" : "Save changes"}
                      </button>
                    ) : null}
                    <GoogleCalendar handleExport={() => { void handleExportToGoogleCalendar(); }} />
                    <button type="button" className="pp-btn-ghost" onClick={() => void handleShare()}>
                      Share
                    </button>
                    <button type="button" className="pp-btn-ghost pp-btn-delete" onClick={() => void handleDelete()}>
                      Delete
                    </button>
                  </div>
                </header>
                <div className="planner-days-content">
                  <p style={{ color: "var(--pp-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                    <CalendarDays size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    {activePlan.city}
                    {" · "}
                    {formatTripDateRangeLabel(activePlan)}
                    {" · "}
                    {activePlan.days} day{activePlan.days === 1 ? "" : "s"}
                  </p>
                  {activePlan.plan.summary ? (
                    <p style={{ marginBottom: "1.5rem", lineHeight: 1.5, color: "var(--pp-text)" }}>
                      {activePlan.plan.summary}
                    </p>
                  ) : null}
                  {activePlan.plan.days.map((d, i) => (
                    <DaySection
                      key={`${d.day}-${i}`}
                      dayPlan={d}
                      dayIndex={i}
                      editingKey={editingStopKey}
                      setEditingKey={setEditingStopKey}
                      onPatchDay={patchDay}
                    />
                  ))}
                  {activePlan.plan.tips && activePlan.plan.tips.length > 0 ? (
                    <div className="planner-tips">
                      <h3>Trip tips</h3>
                      <ul>
                        {activePlan.plan.tips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
