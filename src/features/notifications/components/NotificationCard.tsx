import { memo } from "react";
import { Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "../types";
import ChatAvatar from "@/features/chat/components/ChatAvatar";

interface NotificationCardProps {
  notification: Notification;
  onClick?: (id: string) => void;
  onArchive?: (id: string) => void;
  archiveBusy?: boolean;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function NotificationCard({
  notification,
  onClick,
  onArchive,
  archiveBusy = false,
}: NotificationCardProps) {
  const title =
    notification.title?.trim() || "Notification";
  const body = notification.body?.trim() ?? "";

  return (
    <div
      className={cn(
        "flex w-full items-stretch overflow-hidden rounded-2xl border transition-all duration-200",
        "hover:shadow-sm",
        notification.read
          ? "border-border/30 bg-white dark:bg-zinc-900"
          : "border-primary/30 bg-primary/5 dark:bg-primary/10",
      )}
    >
      <button
        type="button"
        onClick={() => onClick?.(notification.id)}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-4 px-5 py-4 text-left",
          "cursor-pointer outline-none",
        )}
      >
        {notification.avatar ? (
          <ChatAvatar src={notification.avatar} name={title} size="md" />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <span className="text-lg font-bold text-primary">
              {title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm",
                notification.read
                  ? "font-medium text-foreground/80"
                  : "font-semibold text-foreground",
              )}
            >
              {title}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(notification.timestamp)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {body || "—"}
          </p>
        </div>

        {!notification.read && (
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
        )}
      </button>
      {onArchive ? (
        <button
          type="button"
          disabled={archiveBusy}
          onClick={(e) => {
            e.stopPropagation();
            onArchive(notification.id);
          }}
          className={cn(
            "flex shrink-0 items-center justify-center border-l border-border/40 px-3",
            "text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-50",
            "dark:border-white/10",
          )}
          aria-label="Archive notification"
        >
          <Archive className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export default memo(NotificationCard);
