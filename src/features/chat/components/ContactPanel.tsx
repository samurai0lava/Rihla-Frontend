import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ChatUser } from "../types";
import ChatAvatar from "./ChatAvatar";

interface ContactPanelProps {
  contact: ChatUser;
  onRemoveFriend?: (() => void) | undefined;
  className?: string | undefined;
}

function ContactPanel({ contact, onRemoveFriend, className }: ContactPanelProps) {
  return (
    <aside
      className={cn(
        "flex flex-col bg-white dark:bg-zinc-900 border-l border-border/40 h-full",
        className
      )}
    >
      <div className="flex flex-col items-center -mt-10 p-6 border-b border-border/30">
        {contact.coverImage ? (
          <img
            src={contact.coverImage}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-amber-100/40 to-orange-50 dark:from-primary/15 dark:via-zinc-800 dark:to-zinc-900" />
        )}
      </div>

      <div className="flex flex-col items-center pt-20 border-b border-border/30">
        <ChatAvatar
          src={contact.avatar}
          name={contact.name}
          size="xl"
          className="ring-4 ring-white dark:ring-zinc-900"
        />
        <h3 className="mt-4 text-lg font-bold text-foreground">
          {contact.name}
        </h3>
      </div>

      <div className="flex-1 p-6 min-h-0">
        <h4 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
          Last Activities
        </h4>
      </div>

      {onRemoveFriend && (
        <div className="p-6 flex justify-center">
          <button
            onClick={onRemoveFriend}
            className={cn(
              "py-2.5 px-6 rounded-lg",
              "bg-red-500 hover:bg-red-600 active:bg-red-700",
              "text-white text-sm font-semibold",
              "transition-colors duration-200 cursor-pointer"
            )}
          >
            Remove Friend
          </button>
        </div>
      )}
    </aside>
  );
}

export default memo(ContactPanel);
