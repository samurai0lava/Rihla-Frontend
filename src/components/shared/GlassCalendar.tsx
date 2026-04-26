import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarEvent {
  date: number;
  month: number;
  year: number;
  label: string;
  color?: "orange" | "amber" | "blue" | "purple" | "teal" | "red";
}

export interface DateRangeValue {
  start: Date;
  end: Date;
}

interface GlassCalendarProps {
  events?: CalendarEvent[];
  /** Full-page shell vs compact (trip planner popover). */
  variant?: "page" | "embedded";
  /** One day + events, or start/end range for trip length. */
  mode?: "single" | "range";
  initialDate?: Date;
  onDateSelect?: (date: Date) => void;
  rangeValue?: DateRangeValue;
  onRangeComplete?: (start: Date, end: Date) => void;
  maxRangeDays?: number;
  minDate?: Date;
  hint?: string;
}

const MAX_RANGE_DEFAULT = 14;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inclusiveDays(start: Date, end: Date): number {
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  if (e < s) return 1;
  return Math.floor((e - s) / 86400000) + 1;
}

function clampEnd(start: Date, end: Date, maxDays: number): Date {
  if (inclusiveDays(start, end) <= maxDays) return startOfDay(end);
  const c = new Date(startOfDay(start));
  c.setDate(c.getDate() + maxDays - 1);
  return c;
}

const COLOR_MAP: Record<string, string> = {
  orange: "bg-[#ff6600]/85 text-white border border-[#ff8c42]/50",
  amber: "bg-amber-500/80 text-white border border-amber-300/40",
  blue: "bg-blue-400/70 text-blue-50",
  purple: "bg-purple-400/70 text-purple-50",
  teal: "bg-teal-400/70 text-teal-50",
  red: "bg-red-400/70 text-red-50",
};

const DOT_MAP: Record<string, string> = {
  orange: "bg-[#ff8c42]",
  amber: "bg-amber-400",
  blue: "bg-blue-400",
  purple: "bg-purple-400",
  teal: "bg-teal-400",
  red: "bg-red-400",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function GlassCalendar({
  events = [],
  variant = "page",
  mode = "single",
  initialDate,
  onDateSelect,
  rangeValue,
  onRangeComplete,
  maxRangeDays = MAX_RANGE_DEFAULT,
  minDate: minDateProp,
  hint,
}: GlassCalendarProps) {
  const today = startOfDay(new Date());
  const minDate = minDateProp ? startOfDay(minDateProp) : today;

  const [current, setCurrent] = useState(() =>
    initialDate ?? rangeValue?.start ?? new Date(),
  );
  const [selected, setSelected] = useState<Date | null>(
    initialDate ? startOfDay(initialDate) : null,
  );
  const [pickingAnchor, setPickingAnchor] = useState<Date | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
    if (mode === "single") {
      setSelected(today);
      onDateSelect?.(today);
    }
  };

  const handleSelect = (d: number) => {
    const date = startOfDay(new Date(year, month, d));
    if (date < minDate) return;

    if (mode === "range") {
      if (!pickingAnchor) {
        setPickingAnchor(date);
        return;
      }
      let start = pickingAnchor;
      let end = date;
      if (end < start) [start, end] = [end, start];
      end = clampEnd(start, end, maxRangeDays);
      setPickingAnchor(null);
      onRangeComplete?.(start, end);
      return;
    }

    setSelected(date);
    onDateSelect?.(date);
  };

  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isSelected = (d: number) =>
    mode === "single" &&
    selected !== null &&
    d === selected.getDate() &&
    month === selected.getMonth() &&
    year === selected.getFullYear();

  const cellDate = (d: number, inMonth: boolean): Date | null =>
    inMonth ? startOfDay(new Date(year, month, d)) : null;

  const inRangeHighlight = (d: number, inMonth: boolean): boolean => {
    if (!inMonth || mode !== "range" || !rangeValue) return false;
    const cd = cellDate(d, true);
    if (!cd || cd < minDate) return false;
    const rs = startOfDay(rangeValue.start);
    const re = startOfDay(rangeValue.end);
    if (pickingAnchor) {
      return cd.getTime() === pickingAnchor.getTime();
    }
    return cd >= rs && cd <= re;
  };

  const isRangeEdge = (d: number, inMonth: boolean): boolean => {
    if (!inMonth || mode !== "range" || !rangeValue) return false;
    const cd = cellDate(d, true);
    if (!cd || cd < minDate) return false;
    if (pickingAnchor) {
      return cd.getTime() === pickingAnchor.getTime();
    }
    const rs = startOfDay(rangeValue.start);
    const re = startOfDay(rangeValue.end);
    return cd.getTime() === rs.getTime() || cd.getTime() === re.getTime();
  };

  const getEvents = (d: number) =>
    events.filter((e) => e.date === d && e.month === month && e.year === year);

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: { day: number; current: boolean }[] = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: daysInPrev - firstDay + 1 + i, current: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, current: true });
  }
  const trailing = totalCells - cells.length;
  for (let i = 1; i <= trailing; i++) {
    cells.push({ day: i, current: false });
  }

  const selectedEvents =
    mode === "single" && selected
      ? events.filter(
          (e) =>
            e.date === selected.getDate() &&
            e.month === selected.getMonth() &&
            e.year === selected.getFullYear(),
        )
      : [];

  const rangeHint =
    hint ??
    (mode === "range"
      ? pickingAnchor
        ? "Choose the last day of your trip."
        : "Choose the first day of your trip."
      : undefined);

  const rangeSummary =
    mode === "range" && rangeValue
      ? `${rangeValue.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${rangeValue.end.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${inclusiveDays(rangeValue.start, rangeValue.end)} day${inclusiveDays(rangeValue.start, rangeValue.end) === 1 ? "" : "s"}`
      : null;

  const shell =
    variant === "page"
      ? "min-h-screen bg-gradient-to-br from-[#ffb366] via-[#ff7a33] to-[#e65c00] flex items-center justify-center p-6"
      : "w-full";

  const cardShell = variant === "page" ? "w-full max-w-md" : "w-full";

  return (
    <div className={shell}>
      <div className={cardShell}>
        <div
          className={[
            "rounded-3xl backdrop-blur-xl overflow-hidden",
            variant === "page"
              ? "bg-white/15 border border-white/30 shadow-[0_24px_60px_-12px_rgba(180,60,0,0.45)]"
              : "bg-[rgba(14,14,16,0.88)] border border-white/12 shadow-[0_16px_48px_rgba(0,0,0,0.45)]",
          ].join(" ")}
        >
          {rangeHint ? (
            <p
              className={[
                "px-4 pt-3 pb-0 text-xs font-medium leading-snug",
                variant === "page" ? "text-white/75" : "text-white/55",
              ].join(" ")}
            >
              {rangeHint}
            </p>
          ) : null}

          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div>
                <h2
                  className={[
                    "text-xl font-semibold tracking-tight",
                    variant === "page" ? "text-white" : "text-white/95",
                  ].join(" ")}
                >
                  {MONTHS[month]}
                </h2>
                <p
                  className={[
                    "text-sm font-medium",
                    variant === "page" ? "text-white/65" : "text-white/45",
                  ].join(" ")}
                >
                  {year}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={goToday}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-[#ff6600]/35 hover:bg-[#ff6600]/50 text-white border border-[#ff8c42]/40 transition-all duration-150 active:scale-95"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#ff6600]/35 text-white border border-white/15 transition-all duration-150 active:scale-95"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-[#ff6600]/35 text-white border border-white/15 transition-all duration-150 active:scale-95"
                  aria-label="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 px-3 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[0.65rem] font-bold text-[#ffcc99]/80 py-1 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-4">
            {cells.map((cell, idx) => {
              const evs = cell.current ? getEvents(cell.day) : [];
              const today_ = cell.current && isToday(cell.day);
              const sel = cell.current && isSelected(cell.day);
              const cd = cell.current ? cellDate(cell.day, true) : null;
              const pastDisabled = !!(cd && cd < minDate);
              const inR = cell.current && inRangeHighlight(cell.day, true);
              const edge = cell.current && isRangeEdge(cell.day, true);

              const faceClasses = [
                "relative z-0 mx-auto flex flex-col items-center justify-center rounded-lg transition-all duration-150",
                "w-7 min-h-[2.2rem] min-w-[2.2rem] px-0.5 py-0.5 box-border",
                sel
                  ? "bg-[#ff6600] border border-[#ff8c42] text-white shadow-[0_2px_10px_rgba(255,102,0,0.45)]"
                  : edge
                    ? "bg-[#ff6600]/90 border border-[#ffb366] text-white font-bold shadow-md"
                    : inR
                      ? "bg-[#ff6600]/28 border border-[#ff8c42]/30 text-white"
                      : today_
                        ? "bg-white/12 ring-2 ring-inset ring-[#ff8c42]/55"
                        : cell.current && !pastDisabled
                          ? "border border-transparent group-hover:bg-[#ff6600]/22"
                          : "border border-transparent",
              ].join(" ");

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!cell.current || pastDisabled}
                  onClick={() => cell.current && !pastDisabled && handleSelect(cell.day)}
                  className={[
                    "group relative flex flex-col items-center justify-center pt-1 pb-1 rounded-xl mx-0.5 min-h-[44px] w-full border border-transparent bg-transparent transition-all duration-150",
                    !cell.current
                      ? "cursor-default opacity-20"
                      : pastDisabled
                        ? "cursor-not-allowed opacity-35"
                        : "cursor-pointer",
                  ].join(" ")}
                >
                  {cell.current ? (
                    <span className={faceClasses}>
                      <span
                        className={[
                          "text-sm font-medium leading-tight",
                          today_ && !sel && !inR
                            ? "text-white font-bold"
                            : sel || edge
                              ? "text-white"
                              : cell.current
                                ? "text-white/90"
                                : "text-white/25",
                        ].join(" ")}
                      >
                        {cell.day}
                      </span>

                      {evs.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center max-w-full">
                          {evs.slice(0, 3).map((e, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_MAP[e.color ?? "orange"]}`}
                            />
                          ))}
                        </div>
                      )}
                    </span>
                  ) : (
                    <span className="text-sm font-medium leading-tight text-white/25">
                      {cell.day}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {mode === "range" && rangeSummary && variant === "embedded" ? (
            <div className="px-4 pb-3 -mt-1">
              <p className="text-[0.72rem] font-semibold text-[#ffcc99]/90 text-center tracking-wide">
                {rangeSummary}
                <span className="text-white/40 font-normal">
                  {" "}
                  · max {maxRangeDays} days
                </span>
              </p>
            </div>
          ) : null}
        </div>

        {mode === "single" && selected && variant === "page" ? (
          <div className="mt-4 rounded-2xl backdrop-blur-xl bg-white/15 border border-white/25 shadow-xl px-5 py-4 transition-all duration-200">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
              {selected.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>

            {selectedEvents.length === 0 ? (
              <p className="text-sm text-white/50 italic">No events scheduled.</p>
            ) : (
              <ul className="space-y-2">
                {selectedEvents.map((e, i) => (
                  <li
                    key={i}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
                      COLOR_MAP[e.color ?? "orange"]
                    }`}
                  >
                    {e.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
