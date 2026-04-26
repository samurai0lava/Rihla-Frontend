import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import HomeNavBar from "@/components/shared/HomeNavBar";
import ChatSidebar from "./ChatSidebar";
import ChatArea from "./ChatArea";
import ChatWelcome from "./ChatWelcome";
import type { ChatUser, Conversation, Message } from "../types";
import { useAuth } from "@/context/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import {
  fetchChatConversations,
  fetchChatMessages,
  fetchProfileByUserId,
  openOrCreateChatDm,
  removeFriend,
  type OpenChatDmResult,
} from "@/lib/friendsApi";
import {
  apiMessageToMessage,
  conversationRowToConversation,
  dedupeChatConversationRows,
} from "../utils/mapApi";
import { toProfileAvatarUrl } from "@/lib/profilesApi";

function Webchat() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [searchParams, setSearchParams] = useSearchParams();
  const openWithPeer = searchParams.get("with")?.trim() ?? "";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const loadedThreadsRef = useRef(new Set<string>());
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >();
  const [showSidebar, setShowSidebar] = useState(true);

  const onChatMessage = useCallback((msg: Message) => {
    setConversations((prev) => {
      let found = false;
      const next = prev.map((c) => {
        if (c.id !== msg.conversationId) return c;
        found = true;
        return {
          ...c,
          lastMessage: msg.content,
          lastMessageTime: msg.timestamp,
        };
      });
      if (!found) return prev;
      return [...next].sort((a, b) => {
        const ta = a.lastMessageTime?.getTime() ?? 0;
        const tb = b.lastMessageTime?.getTime() ?? 0;
        return tb - ta;
      });
    });
  }, []);

  const {
    connectionState,
    messages,
    sendMessage,
    sendTyping,
    peerTypingByConversation,
    hydrateMessages,
  } = useWebSocket({
    userId,
    onChatMessage,
  });

  const typingIdleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingTrueAtRef = useRef(0);
  const prevActiveConversationRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const prev = prevActiveConversationRef.current;
    if (prev && prev !== activeConversationId) {
      if (typingIdleRef.current) {
        clearTimeout(typingIdleRef.current);
        typingIdleRef.current = null;
      }
      sendTyping(prev, false);
    }
    prevActiveConversationRef.current = activeConversationId;
  }, [activeConversationId, sendTyping]);

  const notifyComposerTyping = useCallback(
    (hasDraft: boolean) => {
      if (!activeConversationId) return;
      if (!hasDraft) {
        if (typingIdleRef.current) {
          clearTimeout(typingIdleRef.current);
          typingIdleRef.current = null;
        }
        sendTyping(activeConversationId, false);
        return;
      }
      const now = Date.now();
      if (now - lastTypingTrueAtRef.current > 2000) {
        sendTyping(activeConversationId, true);
        lastTypingTrueAtRef.current = now;
      }
      if (typingIdleRef.current) clearTimeout(typingIdleRef.current);
      typingIdleRef.current = setTimeout(() => {
        sendTyping(activeConversationId, false);
        typingIdleRef.current = null;
      }, 2000);
    },
    [activeConversationId, sendTyping],
  );

  const currentUser: ChatUser = useMemo(() => {
    if (user) {
      const u: ChatUser = {
        id: user.id,
        name: user.displayName || user.username || user.email,
        isOnline: user.status === "online",
      };
      const avatarUrl = toProfileAvatarUrl(user.avatar);
      if (avatarUrl) u.avatar = avatarUrl;
      return u;
    }
    return { id: "", name: "Me", isOnline: false };
  }, [user]);

  useEffect(() => {
    loadedThreadsRef.current.clear();
    if (!userId) {
      setConversations([]);
      setListError(null);
      setListLoading(false);
      setActiveConversationId(undefined);
      setShowSidebar(true);
      return;
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setListLoading(true);
    setListError(null);

    void (async () => {
      try {
        let opened: OpenChatDmResult | null = null;
        if (openWithPeer && openWithPeer !== userId) {
          opened = await openOrCreateChatDm(openWithPeer);
        }
        const rows = dedupeChatConversationRows(await fetchChatConversations());
        if (cancelled) return;
        const convs = await Promise.all(
          rows.map((row) =>
            conversationRowToConversation(row, fetchProfileByUserId),
          ),
        );
        if (cancelled) return;
        setConversations(convs);

        if (opened) {
          let convId = opened.id;
          if (!rows.some((r) => r.id === convId) && openWithPeer) {
            const fallback = rows.find((r) => r.peerUserId === openWithPeer);
            if (fallback) convId = fallback.id;
          }
          setActiveConversationId(convId);
          setShowSidebar(false);
          if (!loadedThreadsRef.current.has(convId)) {
            try {
              const { messages: msgRows } = await fetchChatMessages(convId);
              loadedThreadsRef.current.add(convId);
              hydrateMessages(convId, msgRows.map(apiMessageToMessage));
            } catch {
              loadedThreadsRef.current.add(convId);
              hydrateMessages(convId, []);
            }
          }
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete("with");
              return next;
            },
            { replace: true },
          );
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setListError(
            e instanceof Error ? e.message : "Failed to load chats",
          );
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, openWithPeer, hydrateMessages, setSearchParams]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  const currentMessages = activeConversationId
    ? (messages[activeConversationId] ?? [])
    : [];

  const handleSelectConversation = useCallback(
    async (id: string) => {
      setActiveConversationId(id);
      setShowSidebar(false);
      if (loadedThreadsRef.current.has(id)) return;
      try {
        const { messages: rows } = await fetchChatMessages(id);
        loadedThreadsRef.current.add(id);
        hydrateMessages(id, rows.map(apiMessageToMessage));
      } catch {
        loadedThreadsRef.current.add(id);
        hydrateMessages(id, []);
      }
    },
    [hydrateMessages],
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!activeConversationId) return;
      if (typingIdleRef.current) {
        clearTimeout(typingIdleRef.current);
        typingIdleRef.current = null;
      }
      sendTyping(activeConversationId, false);
      sendMessage(activeConversationId, content);
    },
    [activeConversationId, sendMessage, sendTyping],
  );

  const handleBack = useCallback(() => {
    setShowSidebar(true);
    setActiveConversationId(undefined);
  }, []);

  const handleRemoveFriend = useCallback(async () => {
    if (!activeConversation?.participant.id) return;
    await removeFriend(activeConversation.participant.id);
    setConversations((prev) => prev.filter((c) => c.id !== activeConversationId));
    setActiveConversationId(undefined);
    setShowSidebar(true);
  }, [activeConversation?.participant.id, activeConversationId]);

  return (
    <div className="flex min-h-0 flex-col h-dvh overflow-hidden bg-background">
      <HomeNavBar hideMobileGlassNav={Boolean(activeConversation)} />
      <div className="home-nav-main-offset flex min-h-0 flex-1 overflow-hidden bg-gray-50/80 dark:bg-zinc-950/80">
        <ChatSidebar
          currentUser={currentUser}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          connectionState={connectionState}
          listLoading={listLoading}
          listError={listError}
          className={cn(
            "w-full md:w-80 lg:w-72 xl:w-80 shrink-0",
            showSidebar ? "flex" : "hidden md:flex",
          )}
        />

        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            !showSidebar ? "flex" : "hidden md:flex",
          )}
        >
          {activeConversation ? (
            <ChatArea
              messages={currentMessages}
              currentUserId={currentUser.id}
              contactName={activeConversation.participant.name}
              peerAvatar={activeConversation.participant.avatar}
              peerOnline={activeConversation.participant.isOnline}
              onSendMessage={handleSendMessage}
              onComposerActivity={notifyComposerTyping}
              peerIsTyping={Boolean(
                activeConversationId &&
                  peerTypingByConversation[activeConversationId],
              )}
              onBack={handleBack}
              onRemoveFriend={handleRemoveFriend}
            />
          ) : (
            <ChatWelcome />
          )}
        </div>
      </div>
    </div>
  );
}

export default Webchat;
