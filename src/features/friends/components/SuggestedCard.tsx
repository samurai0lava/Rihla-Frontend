import { memo } from "react";
import { MapPin, Sparkles, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import ChatAvatar from "@/features/chat/components/ChatAvatar";
import type { SuggestedStudent } from "../types";

export interface SuggestedCardProps {
  student: SuggestedStudent;
  sharedInterestCount: number;
  onAddFriend: () => void;
  requestSent?: boolean;
}

function SuggestedCard({
  student,
  sharedInterestCount,
  onAddFriend,
  requestSent = false,
}: SuggestedCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-3 overflow-hidden rounded-2xl p-4 sm:p-5",
        "bg-white dark:bg-white/4",
        "border border-stone-200/80 dark:border-white/[0.07]",
        "shadow-sm transition-all duration-300 hover:shadow-md",
      )}
    >
      <div className="flex gap-3">
        <ChatAvatar
          src={student.avatar}
          name={student.name}
          size="md"
          isOnline={false}
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold text-stone-900 dark:text-white">
            {student.name}
          </h3>
          <p className="truncate text-[12px] font-medium text-orange-500 dark:text-orange-400">
            @{student.username}
          </p>
          {student.city && (
            <p className="mt-1 flex items-center gap-1 text-[12px] text-stone-500 dark:text-stone-400">
              <MapPin size={12} className="shrink-0 text-orange-400" />
              <span className="truncate">{student.city}</span>
            </p>
          )}
        </div>
      </div>

      {student.interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {student.interests.slice(0, 4).map((label) => (
            <span
              key={label}
              className={cn(
                "rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium",
                "text-stone-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300",
              )}
            >
              {label}
            </span>
          ))}
          {student.interests.length > 4 && (
            <span className="text-[10px] text-stone-400">
              +{student.interests.length - 4}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        disabled={requestSent}
        onClick={onAddFriend}
        className={cn(
          "mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold transition-all",
          requestSent
            ? "cursor-default border border-stone-200 bg-stone-100 text-stone-500 dark:border-white/10 dark:bg-white/5 dark:text-stone-400"
            : "bg-orange-500 text-white shadow-sm hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600",
        )}
      >
        <UserPlus size={16} strokeWidth={2.25} />
        {requestSent ? "Request sent" : "Add friend"}
      </button>
    </article>
  );
}

export default memo(SuggestedCard);
