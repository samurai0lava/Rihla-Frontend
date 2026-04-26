import { useEffect, useRef, useState } from "react";
import {
  fetchChatWsToken,
  getNotificationWebSocketUrl,
  type NotificationRow,
} from "@/lib/friendsApi";

const CAN_USE_WS = true;
const MAX_RECONNECT_DELAY_MS = 30_000;

export type NotificationSocketState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

function wsPayloadToRow(n: Record<string, unknown>): NotificationRow | null {
  if (
    typeof n.id !== "string" ||
    typeof n.userId !== "string" ||
    typeof n.type !== "string" ||
    typeof n.createdAt !== "string"
  ) {
    return null;
  }
  return {
    id: n.id,
    userId: n.userId,
    type: n.type,
    title: typeof n.title === "string" ? n.title : null,
    body: typeof n.body === "string" ? n.body : null,
    data: "data" in n ? n.data : null,
    read: Boolean(n.read),
    readAt: typeof n.readAt === "string" ? n.readAt : null,
    archived: Boolean(n.archived),
    archivedAt: typeof n.archivedAt === "string" ? n.archivedAt : null,
    createdAt: n.createdAt,
  };
}

interface UseNotificationSocketOptions {
  userId: string;
  onNotification: (row: NotificationRow) => void;
  onArchived: (notificationId: string) => void;
}

interface UseNotificationSocketReturn {
  connectionState: NotificationSocketState;
}

export function useNotificationSocket({
  userId,
  onNotification,
  onArchived,
}: UseNotificationSocketOptions): UseNotificationSocketReturn {
  const [connectionState, setConnectionState] =
    useState<NotificationSocketState>("disconnected");

  const onNotificationRef = useRef(onNotification);
  const onArchivedRef = useRef(onArchived);
  onNotificationRef.current = onNotification;
  onArchivedRef.current = onArchived;

  useEffect(() => {
    if (!CAN_USE_WS || !userId) {
      setConnectionState("disconnected");
      return;
    }

    let attempts = 0;
    let destroyed = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const wsRef: { current: WebSocket | null } = { current: null };

    function scheduleReconnect() {
      if (destroyed) return;
      const delay = Math.min(1_000 * 2 ** attempts, MAX_RECONNECT_DELAY_MS);
      attempts++;
      timeoutId = setTimeout(connect, delay);
    }

    function connect() {
      if (destroyed) return;
      setConnectionState("connecting");

      void (async () => {
        let token: string;
        try {
          token = await fetchChatWsToken();
        } catch {
          if (destroyed) return;
          setConnectionState("error");
          scheduleReconnect();
          return;
        }

        if (destroyed) return;

        let ws: WebSocket;
        try {
          const base = getNotificationWebSocketUrl().replace(/\/$/, "");
          ws = new WebSocket(`${base}?token=${encodeURIComponent(token)}`);
        } catch {
          if (destroyed) return;
          setConnectionState("error");
          scheduleReconnect();
          return;
        }

        wsRef.current = ws;

        ws.onopen = () => {
          if (destroyed) return;
          setConnectionState("connected");
          attempts = 0;
        };

        ws.onmessage = (event: MessageEvent<string>) => {
          if (destroyed) return;
          let parsed: unknown;
          try {
            parsed = JSON.parse(event.data);
          } catch {
            return;
          }
          if (typeof parsed !== "object" || parsed === null) return;
          const r = parsed as Record<string, unknown>;

          if (r.type === "error") {
            setConnectionState("error");
            return;
          }

          if (r.type === "ready") return;

          if (r.type === "notification_archived") {
            const id =
              typeof r.notificationId === "string" ? r.notificationId : null;
            if (id) onArchivedRef.current(id);
            return;
          }

          if (r.type === "notification" && r.notification && typeof r.notification === "object") {
            const row = wsPayloadToRow(r.notification as Record<string, unknown>);
            if (row) onNotificationRef.current(row);
          }
        };

        ws.onclose = () => {
          wsRef.current = null;
          if (destroyed) return;
          setConnectionState("disconnected");
          scheduleReconnect();
        };

        ws.onerror = () => {
          if (destroyed) return;
          setConnectionState("error");
        };
      })();
    }

    connect();

    return () => {
      destroyed = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnectionState("disconnected");
    };
  }, [userId]);

  return { connectionState };
}
