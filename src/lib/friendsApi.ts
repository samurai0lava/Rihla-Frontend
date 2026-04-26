import type {
  Friend,
  OutgoingFriendRequest,
  PendingFriendRequest,
} from "@/features/friends/types";
import { flattenUserInterests } from "@/features/friends/utils";
import {
  PROFILES_BASE_URL,
  resolveGatewayUrl,
  resolveGatewayWebSocketUrl,
} from "./api";
import { toProfileAvatarUrl, type Profile } from "./profilesApi";

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

export const FRIENDS_BASE_URL = stripTrailingSlashes(
  resolveGatewayUrl(import.meta.env.VITE_FRIENDS_URL as string | undefined),
);

/**
 * WebSocket URL for notification pushes (friends-service `notificationSocket`).
 * Override with `VITE_NOTIFICATION_WS_URL`, or set `VITE_NOTIFICATION_WS_PORT` if the host
 * matches `VITE_FRIENDS_URL` but the published port differs (default8182).
 */
export function getNotificationWebSocketUrl(): string {
  const explicit = (import.meta.env.VITE_NOTIFICATION_WS_URL as string | undefined)
    ?.trim();
  if (explicit) return stripTrailingSlashes(explicit);

  const portRaw = import.meta.env.VITE_NOTIFICATION_WS_PORT as string | undefined;
  const port =
    portRaw != null && String(portRaw).trim() !== ""
      ? Number(portRaw)
      : 8182;
  const safePort = Number.isFinite(port) && port > 0 ? port : 8182;

  try {
    const u = new URL(FRIENDS_BASE_URL);
    const isLocal = u.hostname === "localhost" || u.hostname === "127.0.0.1";
    if (isLocal) {
      return resolveGatewayWebSocketUrl(undefined, "/notifications/ws");
    }
    const proto = u.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${u.hostname}:${safePort}`;
  } catch {
    return resolveGatewayWebSocketUrl(undefined, "/notifications/ws");
  }
}

type FriendsOk<T> = { ok: true; data: T };
type FriendsErr = { ok: false; error: { code?: string; message?: string } };

async function parseJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

async function readFriendsError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as FriendsErr | Record<
    string,
    unknown
  >;
  if (
    body &&
    typeof body === "object" &&
    "ok" in body &&
    body.ok === false &&
    "error" in body &&
    body.error &&
    typeof body.error === "object" &&
    "message" in body.error &&
    typeof (body.error as { message?: string }).message === "string"
  ) {
    return (body.error as { message: string }).message;
  }
  return res.statusText || "Request failed";
}

/** Raw row from GET /api/friends/requests/incoming */
export interface FriendRequestRow {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
  updatedAt: string;
}

/** Stub from GET /api/friends (may include placeholders from backend). */
interface FriendStub {
  id: string;
  name?: string;
  username?: string;
  isOnline?: boolean;
  bio?: string;
  email?: string;
  status?: string;
}

export async function fetchProfileByUserId(
  userId: string,
): Promise<Profile | null> {
  try {
    const res = await fetch(
      `${PROFILES_BASE_URL}/profiles/internal/${encodeURIComponent(userId)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as Profile;
  } catch {
    return null;
  }
}

function profileToFriendFields(profile: Profile | null): Pick<
  Friend,
  "name" | "username" | "avatar" | "bio" | "interests" | "status"
> {
  if (!profile) {
    return {
      name: "User",
      username: "",
      interests: [],
    };
  }
  const name =
    profile.displayName?.trim() ||
    profile.username?.trim() ||
    "User";
  const username = profile.username?.trim() ?? "";
  const avatarUrl = toProfileAvatarUrl(profile.avatar);
  const base: Pick<
    Friend,
    "name" | "username" | "avatar" | "bio" | "interests" | "status"
  > = {
    name,
    username,
    interests: flattenUserInterests(profile.interests ?? undefined),
  };
  if (avatarUrl) base.avatar = avatarUrl;
  if (profile.bio) base.bio = profile.bio;
  if (profile.status) base.status = profile.status;
  return base;
}

async function stubToFriend(stub: FriendStub): Promise<Friend> {
  const profile = await fetchProfileByUserId(stub.id);
  const fromProfile = profileToFriendFields(profile);
  return {
    id: stub.id,
    ...fromProfile,
    isOnline: stub.isOnline ?? false,
  };
}

export async function fetchFriends(): Promise<Friend[]> {
  const res = await fetch(`${FRIENDS_BASE_URL}/api/friends`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<FriendStub[]>>(res);
  if (!body.ok || !Array.isArray(body.data)) {
    throw new Error("Invalid friends response");
  }
  return Promise.all(body.data.map((stub) => stubToFriend(stub)));
}

export async function fetchOutgoingRequests(): Promise<FriendRequestRow[]> {
  const res = await fetch(`${FRIENDS_BASE_URL}/api/friends/requests/outgoing`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<FriendRequestRow[]>>(res);
  if (!body.ok || !Array.isArray(body.data)) {
    throw new Error("Invalid outgoing requests response");
  }
  return body.data;
}

export async function mapOutgoingRequestRowsToPending(
  rows: FriendRequestRow[],
): Promise<OutgoingFriendRequest[]> {
  return Promise.all(
    rows.map(async (row) => {
      const profile = await fetchProfileByUserId(row.toUserId);
      const fields = profileToFriendFields(profile);
      const item: OutgoingFriendRequest = {
        id: row.id,
        toUserId: row.toUserId,
        name: fields.name,
        username: fields.username || row.toUserId.slice(0, 8),
      };
      if (fields.avatar) item.avatar = fields.avatar;
      return item;
    }),
  );
}

export async function fetchIncomingRequests(): Promise<PendingFriendRequest[]> {
  const res = await fetch(`${FRIENDS_BASE_URL}/api/friends/requests/incoming`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<FriendRequestRow[]>>(res);
  if (!body.ok || !Array.isArray(body.data)) {
    throw new Error("Invalid incoming requests response");
  }
  const enriched = await Promise.all(
    body.data.map(async (row) => {
      const profile = await fetchProfileByUserId(row.fromUserId);
      const fields = profileToFriendFields(profile);
      const pending: PendingFriendRequest = {
        id: row.id,
        name: fields.name,
        username: fields.username || row.fromUserId.slice(0, 8),
      };
      if (fields.avatar) pending.avatar = fields.avatar;
      return pending;
    }),
  );
  return enriched;
}

export async function sendFriendRequest(toUserId: string): Promise<void> {
  const res = await fetch(`${FRIENDS_BASE_URL}/api/friends/requests`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toUserId: toUserId.trim() }),
  });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  const res = await fetch(
    `${FRIENDS_BASE_URL}/api/friends/requests/${encodeURIComponent(requestId)}/accept`,
    { method: "POST", credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
}

export async function declineOrCancelRequest(requestId: string): Promise<void> {
  const res = await fetch(
    `${FRIENDS_BASE_URL}/api/friends/requests/${encodeURIComponent(requestId)}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
}

export async function removeFriend(userId: string): Promise<void> {
  const res = await fetch(
    `${FRIENDS_BASE_URL}/api/friends/${encodeURIComponent(userId)}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
}

/** JWT for `VITE_WS_URL?token=` — same session as REST (`credentials: include`). */
export async function fetchChatWsToken(): Promise<string> {
  const res = await fetch(`${FRIENDS_BASE_URL}/api/chat/ws-token`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<{ token: string }>>(res);
  if (!body.ok || typeof body.data?.token !== "string" || !body.data.token) {
    throw new Error("Invalid ws-token response");
  }
  return body.data.token;
}

/** Row from GET /api/notifications (friends-service Prisma shape, JSON dates). */
export interface NotificationRow {
  id: string;
  userId: string;
  type: string;
  title: string | null;
  body: string | null;
  data: unknown;
  read: boolean;
  readAt: string | null;
  archived: boolean;
  archivedAt: string | null;
  createdAt: string;
}

export async function fetchNotifications(): Promise<NotificationRow[]> {
  const res = await fetch(`${FRIENDS_BASE_URL}/api/notifications`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<NotificationRow[]>>(res);
  if (!body.ok || !Array.isArray(body.data)) {
    throw new Error("Invalid notifications response");
  }
  return body.data;
}

export async function patchNotificationRead(
  id: string,
): Promise<NotificationRow> {
  const q = new URLSearchParams({ id: id.trim() });
  const res = await fetch(
    `${FRIENDS_BASE_URL}/api/notifications/read?${q.toString()}`,
    { method: "PATCH", credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<NotificationRow>>(res);
  if (!body.ok || !body.data?.id) {
    throw new Error("Invalid read notification response");
  }
  return body.data;
}

export async function patchNotificationsReadAll(): Promise<number> {
  const res = await fetch(`${FRIENDS_BASE_URL}/api/notifications/readAll`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<{ count: number }>>(res);
  if (!body.ok || typeof body.data?.count !== "number") {
    throw new Error("Invalid read-all notifications response");
  }
  return body.data.count;
}

export async function patchNotificationArchive(id: string): Promise<NotificationRow> {
  const q = new URLSearchParams({ id: id.trim() });
  const res = await fetch(
    `${FRIENDS_BASE_URL}/api/notifications/archive?${q.toString()}`,
    { method: "PATCH", credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<NotificationRow>>(res);
  if (!body.ok || !body.data?.id) {
    throw new Error("Invalid archive notification response");
  }
  return body.data;
}

/** Row from GET /api/chat/conversations */
export interface ChatConversationRow {
  id: string;
  createdAt: string;
  peerUserId: string | null;
  participantCount: number;
  lastMessage: {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
  } | null;
}

/** Row from GET /api/chat/conversations/:id/messages */
export interface ChatMessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

/** Response from POST /api/chat/conversations (open or create DM). */
export interface OpenChatDmResult {
  id: string;
  createdAt: string;
  peerUserId: string;
  participantCount: number;
}

export async function openOrCreateChatDm(
  withUserId: string,
): Promise<OpenChatDmResult> {
  const res = await fetch(`${FRIENDS_BASE_URL}/api/chat/conversations`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ withUserId: withUserId.trim() }),
  });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<OpenChatDmResult>>(res);
  if (!body.ok || typeof body.data?.id !== "string") {
    throw new Error("Invalid open conversation response");
  }
  return body.data;
}

export async function postChatMessage(
  conversationId: string,
  content: string,
): Promise<ChatMessageRow> {
  const res = await fetch(
    `${FRIENDS_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<ChatMessageRow>>(res);
  if (!body.ok || !body.data?.id) {
    throw new Error("Invalid send message response");
  }
  return body.data;
}

export async function fetchChatConversations(): Promise<ChatConversationRow[]> {
  const res = await fetch(`${FRIENDS_BASE_URL}/api/chat/conversations`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<FriendsOk<ChatConversationRow[]>>(res);
  if (!body.ok || !Array.isArray(body.data)) {
    throw new Error("Invalid chat conversations response");
  }
  return body.data;
}

export async function fetchChatMessages(
  conversationId: string,
  opts?: { before?: string; limit?: number },
): Promise<{ messages: ChatMessageRow[]; hasMore: boolean }> {
  const q = new URLSearchParams();
  if (opts?.before) q.set("before", opts.before);
  if (opts?.limit != null) q.set("limit", String(opts.limit));
  const qs = q.toString();
  const url = `${FRIENDS_BASE_URL}/api/chat/conversations/${encodeURIComponent(conversationId)}/messages${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(await readFriendsError(res));
  }
  const body = await parseJson<
    FriendsOk<{ messages: ChatMessageRow[]; hasMore: boolean }>
  >(res);
  if (!body.ok || !body.data?.messages || typeof body.data.hasMore !== "boolean") {
    throw new Error("Invalid chat messages response");
  }
  return body.data;
}
