export interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}

export function formatGCalDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d{3}/g, "");
}

export function openInGoogleCalendar(event: CalendarEvent): void {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGCalDate(event.startDate)}/${formatGCalDate(event.endDate)}`,
    trp: "false",
  });
  if (event.description) params.set("details", event.description);
  if (event.location) params.set("location", event.location);

  window.open(
    `https://calendar.google.com/calendar/render?${params.toString()}`,
    "_blank",
    "noopener,noreferrer"
  );
}
