import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSend: (content: string) => void;
  onComposerActivity?: ((hasDraft: boolean) => void) | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

function MessageInput({
  onSend,
  onComposerActivity,
  disabled,
  className,
}: MessageInputProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onComposerActivity?.(false);
    onSend(trimmed);
    setValue("");
    inputRef.current?.focus();
  }, [value, onSend, onComposerActivity, disabled]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div
      className={cn(
        "flex justify-center px-4 py-2 border-t border-border/40 shrink-0",
        className
      )}
    >
      <div
        style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
        className={cn(
          "flex items-center gap-3 rounded-2xl py-1.5 w-full max-w-3xl",
          "bg-white dark:bg-zinc-800",
          "border-2 border-border/80 shadow-sm",
          "transition-shadow duration-200",
          "focus-within:shadow-md focus-within:border-primary/50"
        )}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            onComposerActivity?.(v.trim().length > 0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          className={cn(
            "flex-1 bg-transparent text-sm text-foreground min-h-9 py-1",
            "placeholder:text-muted-foreground outline-none"
          )}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "shrink-0 p-1.5 rounded-full transition-colors duration-200",
            canSend
              ? "text-primary hover:bg-primary/10 cursor-pointer"
              : "text-muted-foreground/50 cursor-not-allowed"
          )}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default MessageInput;
