export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  coverImage?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: "sending" | "sent" | "delivered" | "read" | "failed";
}

export interface Conversation {
  id: string;
  participant: ChatUser;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}


export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

/** Wire format: server → WsServerEnvelope, client → WsClientSend. Env VITE_WS_URL; token GET /api/chat/ws-token. */

export interface WsMessagePayload {
  id: string;            // server-assigned permanent message ID
  conversationId: string;
  senderId: string;
  content: string;
  status: "sent" | "delivered" | "read";
  timestamp: string;     // ISO 8601 — JSON cannot carry Date objects
}

export interface WsAckPayload {
  tempId: string;        // echoes the client-generated tempId
  id: string;            // server-assigned permanent ID
  status: "sent";
}

export interface WsErrorPayload {
  code: string;
  message: string;
}

/** Server → client typing indicator (friends-service / friends-chat.asyncapi.yaml). */
export interface WsServerTypingInbound {
  type: "typing";
  conversationId: string;
  userId: string;
  typing: boolean;
}

export type WsServerEnvelope =
  | { type: "message";     payload: WsMessagePayload; timestamp: string }
  | { type: "message_ack"; payload: WsAckPayload;     timestamp: string }
  | WsServerTypingInbound
  | { type: "error";       payload: WsErrorPayload;   timestamp: string };


/** Client → server (friends-service WebSocket); optional tempId → `message_ack`. */
export interface WsClientMessageSend {
  type: "message";
  conversationId: string;
  content: string;
  tempId?: string;
}

export interface WsClientTypingSend {
  type: "typing";
  conversationId: string;
  typing: boolean;
}

export type WsClientSend = WsClientMessageSend | WsClientTypingSend;
