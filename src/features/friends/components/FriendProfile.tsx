import { memo } from "react";
import { ArrowLeft } from "lucide-react";
import type { Friend } from "../types";

interface FriendProfileProps {
  friend: Friend;
  onBack?: () => void;
}

function FriendProfile({ friend, onBack }: FriendProfileProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white dark:bg-zinc-900 md:items-center md:justify-center md:bg-gray-50 md:dark:bg-zinc-950 md:px-6">
      <div className="flex shrink-0 items-center gap-3 border-b border-border/40 bg-white px-4 py-3 dark:bg-zinc-900 md:hidden">
        <button
          type="button"
          onClick={onBack}
          className="-ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
          aria-label="Back to friends"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="truncate text-sm font-semibold text-foreground">
          {friend.name}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:flex md:items-center md:justify-center md:overflow-visible md:p-6">
        <div className="w-full max-w-full overflow-hidden rounded-2xl bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] dark:bg-[#2C2C2E] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] md:max-w-[720px] md:rounded-3xl">
          <div className="relative flex flex-col items-start border-b border-[#E5E5EA] bg-[url('@/assets/BigAtlass.png')] bg-cover bg-center px-4 pb-4 pt-8 dark:border-[#3A3A3C] md:px-8 md:pt-12">
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/30 to-transparent" />
            <div className="relative z-10">
              <img
                src={friend.avatar}
                alt={friend.name}
                className="mb-3 h-20 w-20 rounded-full object-cover md:mb-4 md:h-[120px] md:w-[120px]"
              />
              <h1 className="text-2xl font-bold leading-tight text-white md:text-[1.75rem]">
                {friend.name}
              </h1>
              {friend.email && (
                <p className="mt-1 text-[0.95rem] text-white/80">{friend.email}</p>
              )}
            </div>
          </div>

          <div className="grid max-sm:grid-cols-1 grid-cols-2 gap-4 p-4 md:gap-6 md:p-8">
            <InfoItem label="Display Name" value={friend.name} />
            <InfoItem label="Username" value={friend.username} />
            <InfoItem label="Email" value={friend.email} />
            <InfoItem label="Bio" value={friend.bio} />
            <InfoItem label="Status" value={friend.status ?? (friend.isOnline ? "online" : "offline")} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | undefined }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
        {label}
      </span>
      <span className="text-base font-medium text-[#1C1C1E] dark:text-[#F5F5F7]">
        {value || "—"}
      </span>
    </div>
  );
}

export default memo(FriendProfile);
