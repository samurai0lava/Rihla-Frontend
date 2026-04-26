import { memo, useCallback } from "react";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { cn } from "@/lib/utils";
import type { Message } from "../types";
import { useChatScroll } from "../hooks/useChatScroll";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import ChatAvatar from "./ChatAvatar";

interface ChatAreaProps {
  messages: Message[];
  currentUserId: string;
  contactName: string;
  peerAvatar?: string | undefined;
  peerOnline?: boolean | undefined;
  onSendMessage: (content: string) => void;
  onComposerActivity?: ((hasDraft: boolean) => void) | undefined;
  peerIsTyping?: boolean | undefined;
  isDisabled?: boolean | undefined;
  onBack?: (() => void) | undefined;
  onRemoveFriend?: (() => void | Promise<void>) | undefined;
  className?: string | undefined;
}

function ChatArea({
  messages,
  currentUserId,
  contactName,
  peerAvatar,
  peerOnline,
  onSendMessage,
  onComposerActivity,
  peerIsTyping = false,
  isDisabled = false,
  onBack,
  onRemoveFriend,
  className,
}: ChatAreaProps) {
  const { containerRef, handleScroll } = useChatScroll(
    messages.length,
    peerIsTyping,
  );

  const handleRemoveSelect = useCallback(() => {
    if (
      !onRemoveFriend ||
      !window.confirm("Remove this friend? You can add them again later.")
    ) {
      return;
    }
    void onRemoveFriend();
  }, [onRemoveFriend]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-white dark:bg-zinc-900 md:bg-gray-50/90 md:dark:bg-zinc-950",
        className
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border/40 bg-white/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur-md dark:bg-zinc-900/95 md:px-5 md:py-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="-ml-1 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        ) : null}
        <ChatAvatar
          src={peerAvatar}
          name={contactName}
          size="md"
          isOnline={peerOnline}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {contactName}
          </p>
        </div>
      </header>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain px-4 py-5 scrollbar-thin md:px-8 md:py-6"
      >
        <div className="mx-auto mt-auto w-full max-w-3xl space-y-3">
          {messages.length === 0 ? (
            <p className="select-none py-8 text-center text-sm text-muted-foreground">
              No messages yet — say hi!
            </p>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            ))
          )}
          {peerIsTyping ? (
            <p
              className="select-none pl-1 text-xs text-muted-foreground"
              aria-live="polite"
            >
              {contactName} is typing…
            </p>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 border-t border-border/40 bg-white/95 backdrop-blur-md dark:bg-zinc-900/95 md:bg-gray-50/95 md:dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-3xl">
          <MessageInput
            onSend={onSendMessage}
            onComposerActivity={onComposerActivity}
            disabled={isDisabled}
            className="border-t-0"
          />
        </div>
      </div>
    </div>
  );
}

export default memo(ChatArea);
