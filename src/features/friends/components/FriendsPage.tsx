import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Tabs } from "radix-ui";
import {
  ChevronDown,
  ChevronUp,
  Compass,
  Search,
  Wifi,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import HomeNavBar from "@/components/shared/HomeNavBar";
import { useAuth } from "@/context/AuthContext";
import { useNavBadges } from "@/context/NavBadgesContext";
import ChatAvatar from "@/features/chat/components/ChatAvatar";
import FriendCard from "./FriendCard";
import FriendProfile from "./FriendProfile";
import SuggestedCard from "./SuggestedCard";
import type {
  Friend,
  OutgoingFriendRequest,
  PendingFriendRequest,
  SuggestedStudent,
} from "../types";
import {
  countSharedInterests,
  flattenUserInterests,
  getSharedInterests,
} from "../utils";
import {
  acceptFriendRequest,
  declineOrCancelRequest,
  fetchFriends,
  fetchIncomingRequests,
  fetchOutgoingRequests,
  mapOutgoingRequestRowsToPending,
  removeFriend,
  sendFriendRequest,
} from "@/lib/friendsApi";
import { searchUsers } from "@/lib/profilesApi";

const SEARCH_LIMIT = 10;
const DISCOVER_MIN_QUERY = 2;

function FriendsPage() {
  const { user } = useAuth();
  const { refreshIncomingFriendBadge } = useNavBadges();
  const myInterestLabels = useMemo(
    () => flattenUserInterests(user?.interests ?? undefined),
    [user?.interests],
  );

  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingFriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingFriendRequest[]>([]);
  const [outgoingToUserIds, setOutgoingToUserIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingExpanded, setPendingExpanded] = useState(true);
  const [outgoingExpanded, setOutgoingExpanded] = useState(true);
  const [search, setSearch] = useState("");
  const [discoverSearch, setDiscoverSearch] = useState("");
  const [discoverHits, setDiscoverHits] = useState<SuggestedStudent[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const [profileFriend, setProfileFriend] = useState<Friend | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [friendList, incoming, outgoingRows] = await Promise.all([
        fetchFriends(),
        fetchIncomingRequests(),
        fetchOutgoingRequests(),
      ]);
      const outgoingList = await mapOutgoingRequestRowsToPending(outgoingRows);
      setFriends(friendList);
      setPending(incoming);
      setOutgoing(outgoingList);
      setOutgoingToUserIds(new Set(outgoingList.map((r) => r.toUserId)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load friends");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const q = discoverSearch.trim();
    if (q.length < DISCOVER_MIN_QUERY) {
      setDiscoverHits([]);
      setDiscoverLoading(false);
      setDiscoverError(null);
      return;
    }
    setDiscoverLoading(true);
    setDiscoverError(null);
    const t = window.setTimeout(() => {
      void searchUsers(q)
        .then((hits) => {
          setDiscoverHits(hits);
          setDiscoverLoading(false);
        })
        .catch((e) => {
          setDiscoverError(
            e instanceof Error ? e.message : "Search failed",
          );
          setDiscoverHits([]);
          setDiscoverLoading(false);
        });
    }, 300);
    return () => window.clearTimeout(t);
  }, [discoverSearch]);

  const onlineFriends = useMemo(
    () => friends.filter((f) => f.isOnline),
    [friends],
  );

  const filteredAllFriends = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = friends;
    if (q) {
      list = friends.filter((f) => {
        const u = (f.username ?? "").toLowerCase();
        const n = f.name.toLowerCase();
        const c = (f.city ?? "").toLowerCase();
        return u.includes(q) || n.includes(q) || c.includes(q);
      });
    }
    return list.slice(0, SEARCH_LIMIT);
  }, [friends, search]);

  const discoverResults = useMemo(() => {
    const pool = discoverHits.filter((s) => {
      if (user?.id && s.id === user.id) return false;
      if (friends.some((f) => f.id === s.id)) return false;
      if (outgoingToUserIds.has(s.id)) return false;
      return true;
    });
    const sorted = [...pool].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
    return sorted.slice(0, SEARCH_LIMIT).map((student) => ({
      student,
      shared: countSharedInterests(myInterestLabels, student.interests),
    }));
  }, [discoverHits, user?.id, friends, outgoingToUserIds, myInterestLabels]);

  const handleRemoveFriend = useCallback(async (id: string) => {
    try {
      await removeFriend(id);
      setFriends((prev) => prev.filter((f) => f.id !== id));
      setProfileFriend((p) => (p?.id === id ? null : p));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove friend");
    }
  }, []);

  const handleShareProfile = useCallback((friend: Friend) => {
    const handle = friend.username ?? friend.id;
    const url = `${window.location.origin}/profile/${encodeURIComponent(handle)}`;
    void navigator.clipboard.writeText(url).catch(() => {
      /* ignore */
    });
  }, []);

  const handleAccept = useCallback(async (req: PendingFriendRequest) => {
    try {
      await acceptFriendRequest(req.id);
      setPending((prev) => prev.filter((p) => p.id !== req.id));
      refreshIncomingFriendBadge();
      const list = await fetchFriends();
      setFriends(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept request");
    }
  }, [refreshIncomingFriendBadge]);

  const handleDecline = useCallback(async (requestId: string) => {
    try {
      await declineOrCancelRequest(requestId);
      setPending((prev) => prev.filter((p) => p.id !== requestId));
      refreshIncomingFriendBadge();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to decline request");
    }
  }, [refreshIncomingFriendBadge]);

  const refreshOutgoing = useCallback(async () => {
    const rows = await fetchOutgoingRequests();
    const list = await mapOutgoingRequestRowsToPending(rows);
    setOutgoing(list);
    setOutgoingToUserIds(new Set(list.map((r) => r.toUserId)));
  }, []);

  const handleAddSuggested = useCallback(
    async (studentId: string) => {
      try {
        await sendFriendRequest(studentId);
        await refreshOutgoing();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to send friend request",
        );
      }
    },
    [refreshOutgoing],
  );

  const handleCancelOutgoing = useCallback(
    async (req: OutgoingFriendRequest) => {
      try {
        await declineOrCancelRequest(req.id);
        setOutgoing((prev) => prev.filter((p) => p.id !== req.id));
        setOutgoingToUserIds((prev) => {
          const next = new Set(prev);
          next.delete(req.toUserId);
          return next;
        });
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to cancel friend request",
        );
      }
    },
    [],
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#1d1d1f]">
      <HomeNavBar />

      {profileFriend && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#faf9f7] dark:bg-[#0e0d0b]">
          <FriendProfile
            friend={profileFriend}
            onBack={() => setProfileFriend(null)}
          />
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-24 sm:px-8">
        <header className="mb-8 sm:mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-white sm:text-4xl">
            Friends
          </h1>
        </header>

        {error && (
          <div
            className={cn(
              "mb-6 flex items-start justify-between gap-3 rounded-2xl border border-red-200",
              "bg-red-50 px-4 py-3 text-[14px] text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200",
            )}
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-900/40"
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {loading ? (
          <p className="text-[14px] text-stone-500 dark:text-stone-400">
            Loading friends…
          </p>
        ) : (
          <>
            {pending.length > 0 && (
              <section
                className={cn(
                  "mb-8 overflow-hidden rounded-2xl border",
                  "bg-linear-gradient(to bottom, #ff6b00, #ff8c00)",
                  "shadow-sm",
                )}
              >
                <button
                  type="button"
                  onClick={() => setPendingExpanded((e) => !e)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left sm:px-5"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[15px] font-bold text-stone-900 dark:text-white">
                        You have {pending.length} pending request
                        {pending.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  {pendingExpanded ? (
                    <ChevronUp className="shrink-0 text-stone-400" size={20} />
                  ) : (
                    <ChevronDown className="shrink-0 text-stone-400" size={20} />
                  )}
                </button>
                {pendingExpanded && (
                  <ul className="space-y-2  px-3 py-3 sm:px-4">
                    {pending.map((req) => (
                      <li
                        key={req.id}
                        className={cn(
                          "flex flex-wrap items-center gap-3 rounded-xl border border-stone-200/60",
                          "bg-white/80 px-3 py-3 dark:border-white/8 dark:bg-white/5",
                        )}
                      >
                        <ChatAvatar
                          src={req.avatar}
                          name={req.name}
                          size="md"
                          isOnline={false}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-stone-900 dark:text-white">
                            {req.name}
                          </p>
                          <p className="truncate text-[12px] text-orange-500 dark:text-orange-400">
                            @{req.username}
                          </p>
                        </div>
                        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
                          <button
                            type="button"
                            onClick={() => void handleAccept(req)}
                            className={cn(
                              "flex-1 rounded-xl bg-orange-500 px-4 py-2 text-[13px] font-semibold text-white",
                              "shadow-sm transition-colors hover:bg-orange-400 sm:flex-none",
                            )}
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDecline(req.id)}
                            className={cn(
                              "flex-1 rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13px] font-semibold",
                              "text-stone-700 transition-colors hover:bg-stone-50",
                              "dark:border-white/15 dark:bg-transparent dark:text-stone-200 dark:hover:bg-white/10 sm:flex-none",
                            )}
                          >
                            Decline
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {outgoing.length > 0 && (
              <section
                className={cn(
                  "mb-8 overflow-hidden rounded-2xl border border-stone-200/80",
                  "bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5",
                )}
              >
                <button
                  type="button"
                  onClick={() => setOutgoingExpanded((e) => !e)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left sm:px-5"
                >
                  <div>
                    <p className="text-[15px] font-bold text-stone-900 dark:text-white">
                      {outgoing.length} outgoing request
                      {outgoing.length !== 1 ? "s" : ""}
                    </p>
                    <p className="text-[12px] text-stone-500 dark:text-stone-400">
                      Waiting for them to respond
                    </p>
                  </div>
                  {outgoingExpanded ? (
                    <ChevronUp className="shrink-0 text-stone-400" size={20} />
                  ) : (
                    <ChevronDown className="shrink-0 text-stone-400" size={20} />
                  )}
                </button>
                {outgoingExpanded && (
                  <ul className="space-y-2 px-3 py-3 sm:px-4">
                    {outgoing.map((req) => (
                      <li
                        key={req.id}
                        className={cn(
                          "flex flex-wrap items-center gap-3 rounded-xl border border-stone-200/60",
                          "bg-stone-50/80 px-3 py-3 dark:border-white/8 dark:bg-white/5",
                        )}
                      >
                        <ChatAvatar
                          src={req.avatar}
                          name={req.name}
                          size="md"
                          isOnline={false}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-stone-900 dark:text-white">
                            {req.name}
                          </p>
                          <p className="truncate text-[12px] text-stone-500 dark:text-stone-400">
                            @{req.username}
                          </p>
                        </div>
                        <div className="flex w-full shrink-0 sm:w-auto">
                          <button
                            type="button"
                            onClick={() => void handleCancelOutgoing(req)}
                            className={cn(
                              "w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-[13px] font-semibold",
                              "text-stone-700 transition-colors hover:bg-stone-50",
                              "dark:border-white/15 dark:bg-transparent dark:text-stone-200 dark:hover:bg-white/10 sm:w-auto",
                            )}
                          >
                            Cancel request
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <Tabs.Root value={tab} onValueChange={setTab} className="w-full">
              <Tabs.List
                className={cn(
                  "mb-3 flex w-full gap-0.5 rounded-2xl border border-stone-200/80",
                  "bg-white/80 dark:border-white/8 dark:bg-white/5 backdrop-blur-sm",
                  "sm:inline-flex sm:w-auto",
                )}
              >
                <Tabs.Trigger
                  value="all"
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-2 py-1 text-[13px] font-semibold",
                    "text-stone-500 outline-none transition-all dark:text-white",
                    "data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:hover:bg-stone-100 dark:data-[state=inactive]:hover:bg-white/6",
                  )}
                >
                  All
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="discover"
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold",
                    "text-stone-500 outline-none transition-all dark:text-white",
                    "data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:hover:bg-stone-100 dark:data-[state=inactive]:hover:bg-white/6",
                  )}
                >
                  Discover
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="online" className="outline-none">
                {onlineFriends.length === 0 ? (
                  <EmptyBlock
                    icon={<Wifi className="text-stone-300 dark:text-stone-600" />}
                    title="No one online"
                    subtitle="Check back later or browse all friends."
                  />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {onlineFriends.map((friend) => (
                      <FriendCard
                        key={friend.id}
                        friend={friend}
                        sharedInterests={getSharedInterests(
                          myInterestLabels,
                          friend.interests,
                        )}
                        onViewProfile={() => setProfileFriend(friend)}
                        onShareProfile={() => handleShareProfile(friend)}
                        onRemoveFriend={() => void handleRemoveFriend(friend.id)}
                      />
                    ))}
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="all" className="outline-none">
                <div
                  className={cn(
                    "mb-5 flex items-center gap-2 rounded-2xl border border-stone-200/80 bg-white/90 px-3 py-2",
                    "dark:border-white/[0.07] dark:bg-white/4 backdrop-blur-sm",
                  )}
                >
                  <Search size={18} className="shrink-0 text-orange-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by username"
                    className={cn(
                      "min-w-0 flex-1 bg-transparent py-2 text-[14px] text-stone-900 outline-none",
                      "placeholder:text-stone-400 dark:text-white dark:placeholder:text-stone-500",
                    )}
                    aria-label="Search friends"
                  />
                </div>
                <p className="text-[12px] text-dark-500 text-bold dark:text-white mb-3">
                  You have : {filteredAllFriends.length} friends
                </p>
                {filteredAllFriends.length === 0 ? (
                  <EmptyBlock
                    icon={
                      <Search className="text-stone-300 dark:text-stone-600" />
                    }
                    title="No matches"
                    subtitle="Try another name, handle, or city."
                  />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredAllFriends.map((friend) => (
                      <FriendCard
                        key={friend.id}
                        friend={friend}
                        sharedInterests={getSharedInterests(
                          myInterestLabels,
                          friend.interests,
                        )}
                        onViewProfile={() => setProfileFriend(friend)}
                        onShareProfile={() => handleShareProfile(friend)}
                        onRemoveFriend={() => void handleRemoveFriend(friend.id)}
                      />
                    ))}
                  </div>
                )}
              </Tabs.Content>

              <Tabs.Content value="discover" className="outline-none">
                <div
                  className={cn(
                    "mb-5 flex items-center gap-2 rounded-2xl border border-stone-200/80 bg-white/90 px-3 py-2",
                    "dark:border-white/[0.07] dark:bg-white/4 backdrop-blur-sm",
                  )}
                >
                  <Search size={18} className="shrink-0 text-orange-400" />
                  <input
                    type="search"
                    value={discoverSearch}
                    onChange={(e) => setDiscoverSearch(e.target.value)}
                    placeholder="Search by name, @handle, or bio"
                    className={cn(
                      "min-w-0 flex-1 bg-transparent py-2 text-[14px] text-stone-900 outline-none",
                      "placeholder:text-stone-400 dark:text-white dark:placeholder:text-stone-500",
                    )}
                    aria-label="Search people to add as friends"
                  />
                </div>
                {discoverError && (
                  <p className="mb-3 text-[13px] text-red-600 dark:text-red-400">
                    {discoverError}
                  </p>
                )}
                {discoverLoading && (
                  <p className="mb-4 text-[14px] text-stone-500 dark:text-stone-400">
                    Searching…
                  </p>
                )}
                {!discoverLoading &&
                  discoverSearch.trim().length < DISCOVER_MIN_QUERY && (
                    <EmptyBlock
                      icon={
                        <Compass className="text-stone-300 dark:text-stone-600" />
                      }
                      title="Search the directory"
                      subtitle={`Type at least ${DISCOVER_MIN_QUERY} characters to find people by username, display name, or bio.`}
                    />
                  )}
                {!discoverLoading &&
                  discoverSearch.trim().length >= DISCOVER_MIN_QUERY &&
                  discoverResults.length === 0 &&
                  !discoverError && (
                    <EmptyBlock
                      icon={
                        <Compass className="text-stone-300 dark:text-stone-600" />
                      }
                      title="No matches"
                      subtitle="Try another name, handle, or keyword."
                    />
                  )}
                {!discoverLoading && discoverResults.length > 0 && (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {discoverResults.map(({ student, shared }) => (
                      <SuggestedCard
                        key={student.id}
                        student={student}
                        sharedInterestCount={shared}
                        requestSent={outgoingToUserIds.has(student.id)}
                        onAddFriend={() => void handleAddSuggested(student.id)}
                      />
                    ))}
                  </div>
                )}
              </Tabs.Content>
            </Tabs.Root>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyBlock({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-200/90",
        "bg-white/50 px-8 py-16 text-center dark:border-white/8 dark:bg-white/2",
      )}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-white/5">
        {icon}
      </div>
      <p className="font-semibold text-stone-800 dark:text-stone-100">
        {title}
      </p>
      <p className="mt-1 max-w-sm text-[13px] text-stone-500 dark:text-stone-400">
        {subtitle}
      </p>
    </div>
  );
}

export default FriendsPage;
