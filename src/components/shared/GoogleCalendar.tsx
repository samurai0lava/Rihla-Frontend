import gcalIcon from "@/assets/icons/Google_Calendar_icon_(2020).svg";
import "./GoogleCalendar.css";

type GoogleCalendarProps = {
  handleExport: () => void;
  /** Shown under the button so users allow popups before clicking. */
  popupHint?: string;
};

function GoogleCalendar({
  handleExport,
}: GoogleCalendarProps) {
  return (
    <div className="gcal-export-wrap">
      <button type="button" className="gcal-btn" onClick={handleExport}>
        <img src={gcalIcon} alt="" width={20} height={20} decoding="async" aria-hidden />
        Add to Google Calendar
      </button>
    </div>
  );
}

export default GoogleCalendar;
