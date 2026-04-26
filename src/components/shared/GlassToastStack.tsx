import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlassToast } from "@/context/GlassToastContext";
import "./GlassToast.css";

function GlassToastStack() {
  const { toasts, dismissToast } = useGlassToast();
  const location = useLocation();
  const pathname =
    location.pathname.replace(/\/+$/, "") || "/";
  const onVideoSurface = pathname === "/home" || pathname === "/planner";

  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        "glass-toast-stack",
        onVideoSurface && "glass-toast-stack--on-video",
      )}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "glass-toast",
            t.variant !== "default" && `glass-toast--${t.variant}`,
            t.onClick && "glass-toast--clickable",
          )}
          onClick={t.onClick}
          onKeyDown={
            t.onClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    t.onClick?.();
                  }
                }
              : undefined
          }
          role={t.onClick ? "button" : undefined}
          tabIndex={t.onClick ? 0 : undefined}
        >
          <div className="glass-toast__row">
            <div className="glass-toast__body">
              <div className="glass-toast__title">{t.title}</div>
              {t.body ? (
                <div className="glass-toast__text">{t.body}</div>
              ) : null}
            </div>
            <button
              type="button"
              className="glass-toast__dismiss"
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(t.id);
              }}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default GlassToastStack;
