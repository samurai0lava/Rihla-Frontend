import type { NotificationRow } from "@/lib/friendsApi";
import { fetchProfileByUserId as fetchProfile } from "@/lib/friendsApi";
import { toProfileAvatarUrl } from "@/lib/profilesApi";
import type { Notification, NotificationType } from "./types";

const BACKEND_TYPES = {
  FRIEND_REQUEST_RECEIVED: "FRIEND_REQUEST_RECEIVED",
  FRIEND_REQUEST_ACCEPTED: "FRIEND_REQUEST_ACCEPTED",
  FRIENDSHIP_CREATED: "FRIENDSHIP_CREATED",
  CHAT_MESSAGE: "CHAT_MESSAGE",
} as const;

function asRecord(d: unknown): Record<string, unknown> | null {
  if (d && typeof d === "object" && !Array.isArray(d)) {
    return d as Record<string, unknown>;
  }
  return null;
}

function strField(r: Record<string, unknown>, k: string): string | undefined {
  const v = r[k];
  return typeof v === "string" && v.trim() ? v : undefined;
}

function mapBackendTypeToUi(backendType: string): NotificationType {
  switch (backendType) {
    case BACKEND_TYPES.FRIEND_REQUEST_RECEIVED:
    case BACKEND_TYPES.FRIEND_REQUEST_ACCEPTED:
    case BACKEND_TYPES.FRIENDSHIP_CREATED:
      return "friend_request";
    case BACKEND_TYPES.CHAT_MESSAGE:
      return "message";
    default:
      return "system";
  }
}

function deriveActionUrl(backendType: string, data: unknown): string | undefined {
  const r = asRecord(data);
  if (!r) {
    if (
      backendType === BACKEND_TYPES.FRIEND_REQUEST_RECEIVED ||
      backendType === BACKEND_TYPES.FRIEND_REQUEST_ACCEPTED
    ) {
      return "/friends";
    }
    return undefined;
  }

  if (backendType === BACKEND_TYPES.CHAT_MESSAGE) {
    const senderId = strField(r, "senderId");
    if (senderId) {
      return `/webchat?with=${encodeURIComponent(senderId)}`;
    }
  }

  if (backendType === BACKEND_TYPES.FRIENDSHIP_CREATED) {
    const peer = strField(r, "peerUserId");
    if (peer) {
      return `/webchat?with=${encodeURIComponent(peer)}`;
    }
  }

  if (
    backendType === BACKEND_TYPES.FRIEND_REQUEST_RECEIVED ||
    backendType === BACKEND_TYPES.FRIEND_REQUEST_ACCEPTED
  ) {
    return "/friends";
  }

  return undefined;
}

/** User id to load avatar for (related actor), if any. */
export function relatedUserIdForRow(row: NotificationRow): string | undefined {
  const r = asRecord(row.data);
  switch (row.type) {
    case BACKEND_TYPES.FRIEND_REQUEST_RECEIVED:
      return r ? strField(r, "fromUserId") : undefined;
    case BACKEND_TYPES.FRIEND_REQUEST_ACCEPTED:
      return r ? strField(r, "acceptedBy") : undefined;
    case BACKEND_TYPES.FRIENDSHIP_CREATED:
      return r ? strField(r, "peerUserId") : undefined;
    case BACKEND_TYPES.CHAT_MESSAGE:
      return r ? strField(r, "senderId") : undefined;
    default:
      return undefined;
  }
}

export function notificationRowToNotification(row: NotificationRow): Notification {
  const title =
    row.title != null && String(row.title).trim()
      ? String(row.title).trim()
      : "Notification";
  const body =
    row.body != null && String(row.body).trim() ? String(row.body).trim() : "";
  const ts = row.createdAt ? new Date(row.createdAt) : new Date();
  const actionUrl = deriveActionUrl(row.type, row.data);

  return {
    id: row.id,
    type: mapBackendTypeToUi(row.type),
    backendType: row.type,
    title,
    body,
    timestamp: Number.isNaN(ts.getTime()) ? new Date() : ts,
    read: Boolean(row.read),
    ...(actionUrl ? { actionUrl } : {}),
  };
}

export async function notificationRowToNotificationWithAvatar(
  row: NotificationRow,
): Promise<Notification> {
  const base = notificationRowToNotification(row);
  const uid = relatedUserIdForRow(row);
  if (!uid) return base;
  const profile = await fetchProfile(uid);
  const url = profile ? toProfileAvatarUrl(profile.avatar) : undefined;
  return url ? { ...base, avatar: url } : base;
}

export async function mapRowsToNotificationsWithAvatars(
  rows: NotificationRow[],
): Promise<Notification[]> {
  const base = rows.map((row) => notificationRowToNotification(row));
  const uniqueIds = new Set<string>();
  for (const row of rows) {
    const uid = relatedUserIdForRow(row);
    if (uid) uniqueIds.add(uid);
  }
  if (uniqueIds.size === 0) return base;

  const avatarByUserId = new Map<string, string>();
  await Promise.all(
    [...uniqueIds].map(async (userId) => {
      const profile = await fetchProfile(userId);
      const url = profile ? toProfileAvatarUrl(profile.avatar) : undefined;
      if (url) avatarByUserId.set(userId, url);
    }),
  );

  return base.map((n, i) => {
    const row = rows[i];
    if (!row) return n;
    const uid = relatedUserIdForRow(row);
    const avatar = uid ? avatarByUserId.get(uid) : undefined;
    return avatar ? { ...n, avatar } : n;
  });
}
