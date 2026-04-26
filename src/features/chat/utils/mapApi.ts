import { toProfileAvatarUrl, type Profile } from "@/lib/profilesApi";
import type { ChatConversationRow, ChatMessageRow } from "@/lib/friendsApi";
import type { ChatUser, Conversation, Message } from "../types";

function lastActivityMs(row: ChatConversationRow): number {
  const t = row.lastMessage?.createdAt ?? row.createdAt;
  const ms = new Date(t).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Friends-service allows multiple 2-user conversations for the same peer pair
 * (no DB uniqueness). The UI would show duplicate threads — one with preview, one empty.
 * Collapse to a single row per peer for DMs.
 */
export function dedupeChatConversationRows(
  rows: ChatConversationRow[],
): ChatConversationRow[] {
  const other: ChatConversationRow[] = [];
  const dmByPeer = new Map<string, ChatConversationRow[]>();

  for (const row of rows) {
    if (row.participantCount === 2 && row.peerUserId) {
      const k = row.peerUserId;
      const list = dmByPeer.get(k) ?? [];
      list.push(row);
      dmByPeer.set(k, list);
    } else {
      other.push(row);
    }
  }

  function pickCanonical(candidates: ChatConversationRow[]): ChatConversationRow {
    if (candidates.length === 1) return candidates[0]!;
    const withPreview = candidates.filter((r) => r.lastMessage != null);
    const pool = withPreview.length > 0 ? withPreview : candidates;
    return pool.reduce((best, r) =>
      lastActivityMs(r) > lastActivityMs(best) ? r : best,
    pool[0]!);
  }

  const mergedDms = [...dmByPeer.values()].map(pickCanonical);
  return [...other, ...mergedDms].sort(
    (a, b) => lastActivityMs(b) - lastActivityMs(a),
  );
}

export function apiMessageToMessage(row: ChatMessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    timestamp: new Date(row.createdAt),
    status: "sent",
  };
}

export function profileToChatUser(peerId: string, profile: Profile | null): ChatUser {
  if (!profile) {
    return {
      id: peerId,
      name: peerId ? `User ${peerId.slice(0, 8)}` : "Unknown",
      isOnline: false,
    };
  }
  const name =
    profile.displayName?.trim() || profile.username?.trim() || "User";
  const u: ChatUser = {
    id: peerId,
    name,
    isOnline: profile.status === "online",
  };
  const avatarUrl = toProfileAvatarUrl(profile.avatar);
  if (avatarUrl) u.avatar = avatarUrl;
  return u;
}

export async function conversationRowToConversation(
  row: ChatConversationRow,
  getProfile: (id: string) => Promise<Profile | null>,
): Promise<Conversation> {
  const peerId = row.peerUserId ?? "";
  const profile = peerId ? await getProfile(peerId) : null;
  const participant = profileToChatUser(peerId || "unknown", profile);
  return {
    id: row.id,
    participant,
    lastMessage: row.lastMessage?.content,
    lastMessageTime: row.lastMessage
      ? new Date(row.lastMessage.createdAt)
      : undefined,
    unreadCount: 0,
  };
}
