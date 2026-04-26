import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ChatUser, Conversation, ConnectionState } from "../types";
import ChatAvatar from "./ChatAvatar";
import ConversationItem from "./ConversationItem";
import UserChatAvatar from "./UserChatAvatar";

interface ChatSidebarProps {
  currentUser: ChatUser;
  conversations: Conversation[];
  activeConversationId?: string | undefined;
  onSelectConversation: (id: string) => void;
  connectionState?: ConnectionState | undefined;
  listLoading?: boolean | undefined;
  listError?: string | null | undefined;
  className?: string | undefined;
}

const CONNECTION_BADGE: Record<
  ConnectionState,
  { label: string; className: string }
> = {
  connected:    { label: "● Connected",       className: "bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400"  },
  connecting:   { label: "○ Connecting…",     className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  disconnected: { label: "○ Disconnected",    className: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400"    },
  error:        { label: "○ Connection error",className: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400"    },
};

function ChatSidebar({
  currentUser,
  conversations,
  activeConversationId,
  onSelectConversation,
  connectionState,
  listLoading,
  listError,
  className,
}: ChatSidebarProps) {
  const badge = connectionState ? CONNECTION_BADGE[connectionState] : null;

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-r border-border/40 bg-white shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)] h-full dark:bg-zinc-900 dark:shadow-[4px_0_24px_-12px_rgba(0,0,0,0.4)]",
        className,
      )}
    >
      <div className="shrink-0 space-y-1 px-4 pb-2 pt-3">
        <UserChatAvatar currentUser={currentUser} />
        <h2 className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Chats
        </h2>
      </div>
      {badge && (
        <div
          className={cn(
            "mx-4 mt-1 mb-0 shrink-0 text-[11px] text-center px-2 py-0.5 rounded-full select-none",
            badge.className,
          )}
        >
          {badge.label}
        </div>
      )}

      {listError && (
        <p className="mx-4 mt-1 text-[11px] text-red-600 dark:text-red-400">
          {listError}
        </p>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-4 pt-1 scrollbar-thin">
        {listLoading && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Loading chats…
          </p>
        )}
        {!listLoading && conversations.length === 0 && !listError && (
          <p className="rounded-xl border border-dashed border-border/50 bg-gray-50/80 px-3 py-6 text-center text-xs leading-relaxed text-muted-foreground dark:bg-zinc-800/40">
            No conversations yet. Open a chat from your friends list.
          </p>
        )}
        {conversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isActive={conv.id === activeConversationId}
            onClick={onSelectConversation}
          />
        ))}
      </div>
    </aside>
  );
}

export default memo(ChatSidebar);
