import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationRealtime } from "@/context/NotificationRealtimeContext";
import { useGlassToast } from "@/context/GlassToastContext";
import { notificationRowToNotification } from "@/features/notifications/mapApi";

function NotificationGlassToasts() {
  const { subscribeNotifications } = useNotificationRealtime();
  const { showToast } = useGlassToast();
  const navigate = useNavigate();

  useEffect(() => {
    return subscribeNotifications((row) => {
      const n = notificationRowToNotification(row);
      showToast({
        title: n.title,
        body: n.body || undefined,
        onClick: n.actionUrl ? () => navigate(n.actionUrl) : undefined,
      });
    });
  }, [subscribeNotifications, showToast, navigate]);

  return null;
}

export default NotificationGlassToasts;
