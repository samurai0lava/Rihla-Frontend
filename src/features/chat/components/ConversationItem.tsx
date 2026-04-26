import { memo } from "react";
import { cn } from "@/lib/utils";
import type { Conversation } from "../types";
import ChatAvatar from "./ChatAvatar";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: (id: string) => void;
}

function formatConversationTime(date?: Date): string {
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: ConversationItemProps) {
  const { participant, lastMessage, lastMessageTime, unreadCount } =
    conversation;

  return (
    <button
      onClick={() => onClick(conversation.id)}
      style={{ paddingLeft: "0.5rem", paddingRight: "0.5rem" }}
      className={cn(
        "flex items-center gap-3 min-h-14 w-full text-left",
        "py-2.5 rounded-xl border border-transparent",
        "transition-all duration-200 cursor-pointer",
        "hover:bg-gray-100 dark:hover:bg-zinc-800/60 hover:border-border/40",
        isActive
          ? "bg-gray-100 dark:bg-zinc-800/60 border-border/40 shadow-sm"
          : "bg-white dark:bg-zinc-900"
      )}
    >
      <ChatAvatar
        src={participant.avatar}
        name={participant.name}
        size="lg"
        isOnline={participant.isOnline}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-foreground truncate">
            {participant.name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0 ml-2">
            {formatConversationTime(lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground truncate pr-2">
            {lastMessage}
          </p>
          {unreadCount > 0 && (
            <span className="shrink-0 h-2.5 w-2.5 rounded-full bg-primary" />
          )}
        </div>
      </div>
    </button>
  );
}

export default memo(ConversationItem);
