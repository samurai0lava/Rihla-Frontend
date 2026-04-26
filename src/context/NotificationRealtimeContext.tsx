import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from "react";
import type { NotificationRow } from "@/lib/friendsApi";
import { useAuth } from "@/context/AuthContext";
import { useNotificationSocket } from "@/features/notifications/hooks/useNotificationSocket";

type NotificationListener = (row: NotificationRow) => void;
type ArchivedListener = (notificationId: string) => void;

interface NotificationRealtimeContextValue {
  subscribeNotifications: (fn: NotificationListener) => () => void;
  subscribeArchived: (fn: ArchivedListener) => () => void;
}

const NotificationRealtimeContext =
  createContext<NotificationRealtimeContextValue | null>(null);

export function NotificationRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const notifListeners = useRef(new Set<NotificationListener>());
  const archListeners = useRef(new Set<ArchivedListener>());

  const subscribeNotifications = useCallback((fn: NotificationListener) => {
    notifListeners.current.add(fn);
    return () => {
      notifListeners.current.delete(fn);
    };
  }, []);

  const subscribeArchived = useCallback((fn: ArchivedListener) => {
    archListeners.current.add(fn);
    return () => {
      archListeners.current.delete(fn);
    };
  }, []);

  useNotificationSocket({
    userId,
    onNotification: (row) => {
      notifListeners.current.forEach((f) => {
        f(row);
      });
    },
    onArchived: (id) => {
      archListeners.current.forEach((f) => {
        f(id);
      });
    },
  });

  const value: NotificationRealtimeContextValue = {
    subscribeNotifications,
    subscribeArchived,
  };

  return (
    <NotificationRealtimeContext.Provider value={value}>
      {children}
    </NotificationRealtimeContext.Provider>
  );
}

export function useNotificationRealtime(): NotificationRealtimeContextValue {
  const ctx = useContext(NotificationRealtimeContext);
  if (!ctx) {
    throw new Error(
      "useNotificationRealtime must be used within NotificationRealtimeProvider",
    );
  }
  return ctx;
}
