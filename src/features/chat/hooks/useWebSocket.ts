import { useState, useEffect, useRef, useCallback } from "react";
import type {
  ConnectionState,
  Message,
  WsClientMessageSend,
  WsClientSend,
} from "../types";
import { fetchChatWsToken, postChatMessage } from "@/lib/friendsApi";
import { resolveGatewayWebSocketUrl } from "@/lib/api";
import { apiMessageToMessage } from "../utils/mapApi";

const WS_URL = resolveGatewayWebSocketUrl(
  import.meta.env.VITE_WS_URL as string | undefined,
  "/ws",
);
const CAN_USE_WS = Boolean(WS_URL);
const MAX_RECONNECT_DELAY_MS = 30_000;

interface UseWebSocketOptions {
  userId: string;
  onChatMessage?: (msg: Message) => void;
}

interface UseWebSocketReturn {
  connectionState: ConnectionState;
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, content: string) => void;
  sendTyping: (conversationId: string, typing: boolean) => void;
  peerTypingByConversation: Record<string, boolean>;
  hydrateMessages: (conversationId: string, list: Message[]) => void;
}

export function useWebSocket({
  userId,
  onChatMessage,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [peerTypingByConversation, setPeerTypingByConversation] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setMessages({});
    setPeerTypingByConversation({});
  }, [userId]);

  const wsRef = useRef<WebSocket | null>(null);
  const onChatMessageRef = useRef(onChatMessage);
  onChatMessageRef.current = onChatMessage;

  const hydrateMessages = useCallback((conversationId: string, list: Message[]) => {
    setMessages((prev) => ({ ...prev, [conversationId]: list }));
  }, []);

  useEffect(() => {
    if (!CAN_USE_WS || !userId) return;

    let attempts = 0;
    let destroyed = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

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
          const base = WS_URL.replace(/\/$/, "");
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

          if (r.type === "ready" || r.type === "joined") return;

          if (r.type === "typing") {
            const conversationId =
              typeof r.conversationId === "string" ? r.conversationId : "";
            const peerId = typeof r.userId === "string" ? r.userId : "";
            const isTyping = Boolean(r.typing);
            if (!conversationId || !peerId || peerId === userId) return;
            setPeerTypingByConversation((prev) => ({
              ...prev,
              [conversationId]: isTyping,
            }));
            return;
          }

          if (r.type === "message_ack") {
            const payload = r.payload as Record<string, unknown> | undefined;
            if (
              !payload ||
              typeof payload.tempId !== "string" ||
              typeof payload.id !== "string"
            )
              return;
            const status = "sent" as const;
            const { tempId, id } = payload;
            setMessages((prev) => {
              const next = { ...prev };
              for (const cid of Object.keys(next)) {
                next[cid] = (next[cid] ?? []).map((m) =>
                  m.id === tempId ? { ...m, id, status } : m,
                );
              }
              return next;
            });
            return;
          }

          if (r.type === "message") {
            let id: string;
            let conversationId: string;
            let senderId: string;
            let content: string;
            let tsRaw: string | undefined;

            if (r.payload && typeof r.payload === "object") {
              const p = r.payload as Record<string, unknown>;
              if (
                typeof p.id !== "string" ||
                typeof p.conversationId !== "string" ||
                typeof p.senderId !== "string" ||
                typeof p.content !== "string"
              )
                return;
              id = p.id;
              conversationId = p.conversationId;
              senderId = p.senderId;
              content = p.content;
              tsRaw =
                typeof p.timestamp === "string"
                  ? p.timestamp
                  : typeof p.createdAt === "string"
                    ? p.createdAt
                    : undefined;
            } else if (r.message && typeof r.message === "object") {
              const m = r.message as Record<string, unknown>;
              if (
                typeof m.id !== "string" ||
                typeof m.conversationId !== "string" ||
                typeof m.senderId !== "string" ||
                typeof m.content !== "string"
              )
                return;
              id = m.id;
              conversationId = m.conversationId;
              senderId = m.senderId;
              content = m.content;
              tsRaw = typeof m.createdAt === "string" ? m.createdAt : undefined;
            } else return;

            if (!tsRaw) return;
            const incomingMsg: Message = {
              id,
              conversationId,
              senderId,
              content,
              timestamp: new Date(tsRaw),
              status: "sent",
            };

            setMessages((prev) => {
              const list = prev[conversationId] ?? [];
              if (list.some((m) => m.id === incomingMsg.id)) return prev;
              return {
                ...prev,
                [conversationId]: [...list, incomingMsg],
              };
            });
            if (incomingMsg.senderId !== userId) {
              setPeerTypingByConversation((prev) => ({
                ...prev,
                [conversationId]: false,
              }));
            }
            onChatMessageRef.current?.(incomingMsg);
          }
        };

        ws.onclose = () => {
          if (destroyed) return;
          wsRef.current = null;
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
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [userId]);

  const sendMessage = useCallback(
    (conversationId: string, content: string) => {
      const tempId = `temp-${Date.now()}`;

      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: userId,
        content,
        timestamp: new Date(),
        status: "sending",
      };

      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), optimistic],
      }));

      const ws = wsRef.current;
      if (CAN_USE_WS && ws?.readyState === WebSocket.OPEN) {
        const frame: WsClientMessageSend = {
          type: "message",
          conversationId,
          content,
          tempId,
        };
        ws.send(JSON.stringify(frame));
        return;
      }

      void (async () => {
        try {
          const row = await postChatMessage(conversationId, content);
          const confirmed = apiMessageToMessage(row);
          setMessages((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] ?? []).map((m) =>
              m.id === tempId ? confirmed : m,
            ),
          }));
          onChatMessageRef.current?.(confirmed);
        } catch {
          setMessages((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] ?? []).map((m) =>
              m.id === tempId ? { ...m, status: "failed" as const } : m,
            ),
          }));
        }
      })();
    },
    [userId],
  );

  const sendTyping = useCallback((conversationId: string, typing: boolean) => {
    const ws = wsRef.current;
    if (!CAN_USE_WS || ws?.readyState !== WebSocket.OPEN) return;
    const frame: WsClientSend = {
      type: "typing",
      conversationId,
      typing,
    };
    ws.send(JSON.stringify(frame));
  }, []);

  return {
    connectionState,
    messages,
    sendMessage,
    sendTyping,
    peerTypingByConversation,
    hydrateMessages,
  };
}
