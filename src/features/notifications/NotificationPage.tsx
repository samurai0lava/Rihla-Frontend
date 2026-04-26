import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HomeNavBar from "@/components/shared/HomeNavBar";
import NotificationCard from "./components/NotificationCard";
import EmptyState from "./components/EmptyState";
import type { Notification } from "./types";
import {
  fetchNotifications,
  patchNotificationArchive,
  patchNotificationRead,
  patchNotificationsReadAll,
  type NotificationRow,
} from "@/lib/friendsApi";
import {
  mapRowsToNotificationsWithAvatars,
  notificationRowToNotification,
  notificationRowToNotificationWithAvatar,
} from "./mapApi";
import { useAuth } from "@/context/AuthContext";
import { useNotificationRealtime } from "@/context/NotificationRealtimeContext";
import { useNavBadges } from "@/context/NavBadgesContext";
import { cn } from "@/lib/utils";

const SKELETON_PLACEHOLDERS = 7;

function NotificationPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markAllBusy, setMarkAllBusy] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const rows = await fetchNotifications();
        if (cancelled) return;
        const list = await mapRowsToNotificationsWithAvatars(rows);
        if (cancelled) return;
        setNotifications(list);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load notifications",
          );
          setNotifications([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const onSocketNotification = useCallback((row: NotificationRow) => {
    void (async () => {
      const n = await notificationRowToNotificationWithAvatar(row);
      setNotifications((prev) => {
        if (prev.some((x) => x.id === n.id)) return prev;
        return [n, ...prev];
      });
    })();
  }, []);

  const onSocketArchived = useCallback((notificationId: string) => {
    setNotifications((prev) => prev.filter((x) => x.id !== notificationId));
  }, []);

  const { subscribeNotifications, subscribeArchived } = useNotificationRealtime();
  const { notifyNotificationRead, notifyAllNotificationsRead } = useNavBadges();

  useEffect(() => {
    const unsubN = subscribeNotifications(onSocketNotification);
    const unsubA = subscribeArchived(onSocketArchived);
    return () => {
      unsubN();
      unsubA();
    };
  }, [
    subscribeNotifications,
    subscribeArchived,
    onSocketNotification,
    onSocketArchived,
  ]);

  const handleNotificationClick = useCallback(
    async (id: string) => {
      const item = notifications.find((n) => n.id === id);
      try {
        const updated = await patchNotificationRead(id);
        const mapped = notificationRowToNotification(updated);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id
              ? { ...mapped, ...(n.avatar ? { avatar: n.avatar } : {}) }
              : n,
          ),
        );
        notifyNotificationRead(id);
        if (item?.actionUrl) {
          navigate(item.actionUrl);
        }
      } catch {
        /* keep list unchanged */
      }
    },
    [notifications, navigate, notifyNotificationRead],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (!notifications.some((n) => !n.read)) return;
    setMarkAllBusy(true);
    try {
      await patchNotificationsReadAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      notifyAllNotificationsRead();
    } catch {
      /* ignore */
    } finally {
      setMarkAllBusy(false);
    }
  }, [notifications, notifyAllNotificationsRead]);

  const handleArchive = useCallback(async (id: string) => {
    setArchivingId(id);
    try {
      await patchNotificationArchive(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      /* keep list unchanged */
    } finally {
      setArchivingId(null);
    }
  }, []);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="flex flex-col h-screen bg-[#F5F5F7] dark:bg-[#1C1C1E] transition-colors duration-300">
      <HomeNavBar />

      <div className="flex-1 overflow-y-auto pt-20">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-base font-bold text-foreground">
              Notification Center:
            </h2>
            {!loading && notifications.length > 0 && hasUnread ? (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                disabled={markAllBusy}
                className={cn(
                  "text-xs font-medium text-primary hover:underline disabled:opacity-50",
                )}
              >
                {markAllBusy ? "Marking…" : "Mark all read"}
              </button>
            ) : null}
          </div>
          <div className="h-px bg-border/60 mt-2 mb-6" />

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : loading ? (
            <div className="space-y-3">
              {Array.from({ length: SKELETON_PLACEHOLDERS }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-14 rounded-2xl border border-border/30 bg-white dark:bg-zinc-900 animate-pulse"
                />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                               <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onClick={handleNotificationClick}
                  onArchive={(nid) => void handleArchive(nid)}
                  archiveBusy={archivingId === notification.id}
                />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationPage;
