import { cn } from "@/lib/utils";

function ChatWelcome() {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-12",
        "md:bg-gray-50/90 md:dark:bg-zinc-950",
        "bg-linear-to-br from-white via-gray-50/80 to-amber-50/30",
        "dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950",
        "md:bg-linear-to-br md:from-gray-50/90 md:via-white/50 md:to-amber-50/25",
        "md:dark:from-zinc-950 md:dark:via-zinc-900/80 md:dark:to-zinc-950",
      )}
    >
      <div className="max-w-xl space-y-6 text-center md:max-w-3xl md:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Messages
        </p>
        <h1 className="select-none text-4xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl">
          Welcome to
          <br />
          <span className="text-primary">Rihla</span> Messages
        </h1>
        <p className="text-base text-muted-foreground md:text-lg">
          Pick a conversation on the left to start chatting. Your threads stay
          in sync in real time.
        </p>
        <div
          className="mx-auto h-px w-24 rounded-full bg-linear-to-r from-transparent via-primary/40 to-transparent md:mx-0"
          aria-hidden
        />
      </div>
    </div>
  );
}

export default ChatWelcome;
