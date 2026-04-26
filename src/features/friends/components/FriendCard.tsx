import { memo, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { DropdownMenu } from "radix-ui";
import {
  MapPin,
  MapPinned,
  MessageCircle,
  MoreHorizontal,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ChatAvatar from "@/features/chat/components/ChatAvatar";
import type { Friend, FriendLastVisited } from "../types";
import { resolveGatewayUrl } from "@/lib/api";

const FAV_PLACES_URL =
  resolveGatewayUrl(import.meta.env.VITE_FAV_PLACES_URL as string | undefined);

async function fetchPublicLastPlace(
  userId: string,
): Promise<FriendLastVisited | null> {
  try {
    const res = await fetch(
      `${FAV_PLACES_URL}/fav-places/public/${encodeURIComponent(userId)}`,
      { credentials: "include" },
    );
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!json || typeof json !== "object") return null;
    const o = json as Record<string, unknown>;
    if (o.ok === true && Array.isArray(o.data) && o.data.length > 0) {
      const p = o.data[0] as Record<string, unknown>;
      const name =
        (typeof p.placeName === "string" && p.placeName) ||
        (typeof p.name === "string" && p.name) ||
        "Place";
      const city = typeof p.city === "string" ? p.city : "";
      const image = typeof p.image === "string" ? p.image : undefined;
      const out: FriendLastVisited = { name, city };
      if (image) out.image = image;
      return out;
    }
    if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
      const p = o.data as Record<string, unknown>;
      const name =
        (typeof p.placeName === "string" && p.placeName) ||
        (typeof p.name === "string" && p.name) ||
        "Place";
      const city = typeof p.city === "string" ? p.city : "";
      const image = typeof p.image === "string" ? p.image : undefined;
      const out: FriendLastVisited = { name, city };
      if (image) out.image = image;
      return out;
    }
    return null;
  } catch {
    return null;
  }
}

export interface RichFriendCardProps {
  friend: Friend;
  sharedInterests: string[];
  onViewProfile: () => void;
  onShareProfile: () => void;
  onRemoveFriend: () => void;
}

function FriendCard({
  friend,
  sharedInterests,
  onViewProfile,
  onShareProfile,
  onRemoveFriend,
}: RichFriendCardProps) {
  const [resolvedLast, setResolvedLast] = useState<FriendLastVisited | null>(
    friend.lastVisited ?? null,
  );

  useEffect(() => {
    setResolvedLast(friend.lastVisited ?? null);
    let cancelled = false;
    void (async () => {
      const fetched = await fetchPublicLastPlace(friend.id);
      if (!cancelled && fetched) setResolvedLast(fetched);
    })();
    return () => {
      cancelled = true;
    };
  }, [friend.id, friend.lastVisited]);

  const places = friend.placesVisited ?? 0;
  const fCount = friend.friendsCount ?? 0;
  const bio =
    friend.bio && friend.bio.length > 90
      ? `${friend.bio.slice(0, 87)}…`
      : friend.bio;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl",
        "bg-white dark:bg-white/4",
        "border border-stone-200/80 dark:border-white/[0.07]",
        "shadow-sm hover:shadow-md transition-all duration-300",
      )}
    >
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex gap-3">
          <ChatAvatar
            src={friend.avatar}
            name={friend.name}
            size="lg"
            isOnline={friend.isOnline}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-bold text-stone-900 dark:text-white">
                {friend.name}
              </h3>
            </div>
            <p className="truncate text-[12px] font-medium text-orange-500 dark:text-orange-400">
              @{friend.username}
            </p>
            {friend.city && (
              <p className="mt-1 flex items-center gap-1 text-[12px] text-stone-500 dark:text-stone-400">
                <MapPin size={12} className="shrink-0 text-orange-400" />
                <span className="truncate">{friend.city}</span>
              </p>
            )}
            {bio && (
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-stone-600 dark:text-stone-300">
                {bio}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatPill
            label="Friends"
            value={fCount}
            icon={<Users size={11} className="shrink-0 opacity-70" />}
          />
        </div>
      </div>

      <div
        className={cn(
          "mt-auto flex flex-wrap items-center gap-2 border-t border-stone-100 px-4 py-3",
          "dark:border-white/6 sm:px-5",
        )}
      >
        <Link
          to={`/webchat?with=${encodeURIComponent(friend.id)}`}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold",
            "bg-orange-500 text-white shadow-sm transition-all hover:bg-orange-600",
            "dark:bg-orange-500 dark:hover:bg-orange-600 min-w-28",
          )}
        >
          <MessageCircle size={16} strokeWidth={2.25} />
          Message
        </Link>
        <button
          type="button"
          onClick={onViewProfile}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-semibold",
            "border-stone-200 bg-white text-stone-800 transition-colors hover:bg-stone-50",
            "dark:border-white/15 dark:bg-white/5 dark:text-stone-100 dark:hover:bg-white/10 min-w-28",
          )}
        >
          <UserRound size={16} strokeWidth={2} />
          Profile
        </button>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                "border-stone-200 bg-white text-stone-600 transition-colors hover:bg-stone-50",
                "dark:border-white/15 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-white/10",
              )}
              aria-label="More actions"
            >
              <MoreHorizontal size={18} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={6}
              align="end"
              className={cn(
                "z-50 min-w-44 overflow-hidden rounded-xl p-1",
                "border border-stone-200/90 bg-white/95 shadow-lg backdrop-blur-xl",
                "dark:border-white/10 dark:bg-zinc-900/95",
              )}
            >
              <DropdownMenu.Item
                className={cn(
                  "flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-[13px] font-medium",
                  "text-rose-600 outline-none data-highlighted:bg-rose-50",
                  "dark:text-rose-400 dark:data-highlighted:bg-rose-950/40",
                )}
                onSelect={() => onRemoveFriend()}
              >
                Remove friend
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </article>
  );
}

function StatPill({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: boolean;
  icon: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums",
        accent
          ? "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800/50 dark:bg-orange-950/35 dark:text-orange-200"
          : "border-stone-200/90 bg-stone-50 text-stone-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-200",
      )}
    >
      {icon}
      <span className="text-[10px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {label}
      </span>
      <span>{value}</span>
    </span>
  );
}

export default memo(FriendCard);
