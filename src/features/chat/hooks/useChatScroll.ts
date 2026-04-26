import { useEffect, useRef, useCallback } from "react";

export function useChatScroll(
  messageCount: number,
  peerTyping: boolean = false,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const el = containerRef.current;
      if (el) {
        el.scrollTo({ top: el.scrollHeight, behavior });
      }
    },
    []
  );

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (el) {
      const { scrollTop, scrollHeight, clientHeight } = el;
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    }
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [messageCount, peerTyping, scrollToBottom]);

  useEffect(() => {
    scrollToBottom("instant");
  }, [scrollToBottom]);

  return { containerRef, scrollToBottom, handleScroll };
}
