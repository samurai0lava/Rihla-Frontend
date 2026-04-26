import { memo } from "react";
import { cn } from "@/lib/utils";
import type { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[70%] min-h-[36px] px-3 py-2 rounded-2xl",
          "border transition-opacity duration-200",
          isOwn
            ? "bg-primary/90 dark:bg-primary/80 border-primary/20 text-white rounded-br-sm"
            : "bg-white dark:bg-zinc-800 border-border/40 rounded-bl-sm shadow-sm",
          message.status === "sending" && "opacity-60"
        )}
      >
        <p
          className={cn(
            "text-sm leading-relaxed break-words whitespace-pre-wrap",
            isOwn ? "text-white" : "text-foreground"
          )}
        >
          {message.content}
        </p>
        <span
          className={cn(
            "block text-[10px] mt-1 text-right",
            isOwn ? "text-white/60" : "text-muted-foreground"
          )}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
