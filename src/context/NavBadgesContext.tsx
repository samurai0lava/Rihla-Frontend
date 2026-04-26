import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import {
  fetchIncomingRequests,
  fetchNotifications,
  type NotificationRow,
} from "@/lib/friendsApi";
import { useAuth } from "@/context/AuthContext";
import { useNotificationRealtime } from "@/context/NotificationRealtimeContext";

const CHAT_MESSAGE_TYPE = "CHAT_MESSAGE";

const FRIEND_TYPES_SYNC_INCOMING = new Set([
  "FRIEND_REQUEST_RECEIVED",
  "FRIEND_REQUEST_ACCEPTED",
  "FRIENDSHIP_CREATED",
]);

export interface NavBadgesContextValue {
  showFriendsBadge: boolean;
  showMessagesBadge: boolean;
  showNotificationsBadge: boolean;
  refreshIncomingFriendBadge: () => void;
  notifyNotificationRead: (id: string) => void;
  notifyAllNotificationsRead: () => void;
}

const NavBadgesContext = createContext<NavBadgesContextValue | null>(null);

export function NavBadgesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const location = useLocation();
  const pathname =
    location.pathname.replace(/\/+$/, "") || "/";
  const { subscribeNotifications, subscribeArchived } = useNotificationRealtime();

  const [notificationRows, setNotificationRows] = useState<NotificationRow[]>(
    [],
  );
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);

  /** User opened that area in the app — hide dot until counts increase again. */
  const [friendsSeen, setFriendsSeen] = useState(false);
  const [notificationsSeen, setNotificationsSeen] = useState(false);
  const [messagesSeen, setMessagesSeen] = useState(false);

  const prevIncoming = useRef<number | null>(null);
  const prevUnreadNonChat = useRef<number | null>(null);
  const prevUnreadChat = useRef<number | null>(null);

  const unreadNonChatCount = useMemo(() => {
    return notificationRows.filter(
      (r) => !r.read && r.type !== CHAT_MESSAGE_TYPE,
    ).length;
  }, [notificationRows]);

  const unreadChatCount = useMemo(() => {
    return notificationRows.filter(
      (r) => !r.read && r.type === CHAT_MESSAGE_TYPE,
    ).length;
  }, [notificationRows]);

  const refreshIncoming = useCallback(async () => {
    if (!userId) {
      setIncomingRequestCount(0);
      return;
    }
    try {
      const incoming = await fetchIncomingRequests();
      setIncomingRequestCount(incoming.length);
    } catch {
      /* keep previous count */
    }
  }, [userId]);

  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      setNotificationRows([]);
      return;
    }
    try {
      const rows = await fetchNotifications();
      setNotificationRows(rows);
    } catch {
      setNotificationRows([]);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotificationRows([]);
      setIncomingRequestCount(0);
      setFriendsSeen(false);
      setNotificationsSeen(false);
      setMessagesSeen(false);
      prevIncoming.current = null;
      prevUnreadNonChat.current = null;
      prevUnreadChat.current = null;
      return;
    }
    setFriendsSeen(false);
    setNotificationsSeen(false);
    setMessagesSeen(false);
    prevIncoming.current = null;
    prevUnreadNonChat.current = null;
    prevUnreadChat.current = null;
    void refreshNotifications();
    void refreshIncoming();
  }, [userId, refreshNotifications, refreshIncoming]);

  useEffect(() => {
    if (
      prevIncoming.current !== null &&
      incomingRequestCount > prevIncoming.current
    ) {
      setFriendsSeen(false);
    }
    prevIncoming.current = incomingRequestCount;
  }, [incomingRequestCount]);

  useEffect(() => {
    if (
      prevUnreadNonChat.current !== null &&
      unreadNonChatCount > prevUnreadNonChat.current
    ) {
      setNotificationsSeen(false);
    }
    prevUnreadNonChat.current = unreadNonChatCount;
  }, [unreadNonChatCount]);

  useEffect(() => {
    if (
      prevUnreadChat.current !== null &&
      unreadChatCount > prevUnreadChat.current
    ) {
      setMessagesSeen(false);
    }
    prevUnreadChat.current = unreadChatCount;
  }, [unreadChatCount]);

  useEffect(() => {
    if (!userId) return;
    if (pathname === "/friends") setFriendsSeen(true);
    if (pathname === "/notifications") setNotificationsSeen(true);
    if (pathname === "/webchat") setMessagesSeen(true);
  }, [pathname, userId]);

  useEffect(() => {
    if (!userId) return;

    const unsubN = subscribeNotifications((row) => {
      setNotificationRows((prev) => {
        const i = prev.findIndex((r) => r.id === row.id);
        if (i === -1) return [row, ...prev];
        const next = [...prev];
        next[i] = row;
        return next;
      });
      if (FRIEND_TYPES_SYNC_INCOMING.has(row.type)) {
        void refreshIncoming();
      }
    });

    const unsubA = subscribeArchived((id) => {
      setNotificationRows((prev) => prev.filter((r) => r.id !== id));
    });

    return () => {
      unsubN();
      unsubA();
    };
  }, [userId, subscribeNotifications, subscribeArchived, refreshIncoming]);

  const notifyNotificationRead = useCallback((id: string) => {
    setNotificationRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, read: true } : r)),
    );
  }, []);

  const notifyAllNotificationsRead = useCallback(() => {
    setNotificationRows((prev) => prev.map((r) => ({ ...r, read: true })));
  }, []);

  const value = useMemo((): NavBadgesContextValue => {
    return {
      showFriendsBadge:
        incomingRequestCount > 0 && !friendsSeen,
      showMessagesBadge: unreadChatCount > 0 && !messagesSeen,
      showNotificationsBadge:
        unreadNonChatCount > 0 && !notificationsSeen,
      refreshIncomingFriendBadge: refreshIncoming,
      notifyNotificationRead,
      notifyAllNotificationsRead,
    };
  }, [
    incomingRequestCount,
    unreadNonChatCount,
    unreadChatCount,
    friendsSeen,
    notificationsSeen,
    messagesSeen,
    refreshIncoming,
    notifyNotificationRead,
    notifyAllNotificationsRead,
  ]);

  return (
    <NavBadgesContext.Provider value={value}>
      {children}
    </NavBadgesContext.Provider>
  );
}

export function useNavBadges(): NavBadgesContextValue {
  const ctx = useContext(NavBadgesContext);
  if (!ctx) {
    throw new Error("useNavBadges must be used within NavBadgesProvider");
  }
  return ctx;
}
