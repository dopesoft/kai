import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import type { Message } from "@shared/schema";

interface MessageContainerProps {
  messages: Message[];
  isTyping: boolean;
  streamingContent?: string;
  isStreaming?: boolean;
  memoryCounts?: { [messageId: number]: number };
  onContainerRef?: (ref: HTMLDivElement | null) => void;
}

export function MessageContainer({ messages, isTyping, streamingContent, isStreaming, memoryCounts, onContainerRef }: MessageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUserRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef<number>(messages.length);

  // Group messages into user+AI pairs
  const messagePairs: { user: Message; assistant?: Message }[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "user") {
      // If next message is assistant, pair them
      if (messages[i + 1] && messages[i + 1].role === "assistant") {
        messagePairs.push({ user: messages[i], assistant: messages[i + 1] });
        i++; // Skip next
      } else {
        messagePairs.push({ user: messages[i] });
      }
    } else if (i === 0 && messages[i].role === "assistant") {
      // Edge case: conversation starts with assistant
      messagePairs.push({ user: messages[i] });
    }
  }

  // Find index of last user message for scroll ref
  const lastUserId = messagePairs.length > 0 ? messagePairs[messagePairs.length - 1].user.id : null;

  // Scroll to top (or near top) ONLY when a new user message is appended
  useEffect(() => {
    const container = containerRef.current;
    const userMessage = lastUserRef.current;
    const prevLen = prevMessagesLength.current;
    if (
      container &&
      userMessage &&
      messages.length > prevLen &&
      messages[messages.length - 1].role === "user"
    ) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          const targetScroll = userMessage.offsetTop - 40;
          container.scrollTo({
            top: Math.max(0, targetScroll),
            behavior: "smooth",
          });
        }, 50);
      });
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  // Auto-scroll to bottom during AI streaming
  useEffect(() => {
    const container = containerRef.current;
    if (container && isStreaming && streamingContent) {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }, [isStreaming, streamingContent]);

  // Auto-scroll to bottom when AI message is complete (to show timestamp)
  useEffect(() => {
    const container = containerRef.current;
    const prevLen = prevMessagesLength.current;
    
    // Check if a new assistant message was just added
    if (
      container &&
      messages.length > prevLen &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      // Multiple timeouts to ensure scroll happens after all DOM updates
      // Including memory notifications and timestamp rendering
      const scrollToBottom = () => {
        container.scrollTo({
          top: container.scrollHeight + 100, // Extra padding to ensure bottom is visible
          behavior: "smooth",
        });
      };
      
      // Immediate scroll
      scrollToBottom();
      
      // Scroll again after short delay (for DOM updates)
      setTimeout(scrollToBottom, 200);
      
      // Final scroll after memory notifications might appear
      setTimeout(scrollToBottom, 500);
    }
  }, [messages]);

  // Also scroll when memory counts are updated
  useEffect(() => {
    const container = containerRef.current;
    if (container && memoryCounts && Object.keys(memoryCounts).length > 0) {
      // Scroll after memory notification appears
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight + 100,
          behavior: "smooth",
        });
      }, 300);
    }
  }, [memoryCounts]);

  return (
    <main className="h-full relative z-10 overflow-hidden">
      <div
        ref={(ref) => {
          containerRef.current = ref;
          if (onContainerRef) onContainerRef(ref);
        }}
        className="h-full overflow-y-auto px-4 scroll-smooth text-[15px]"
        style={{ paddingTop: '16px', paddingBottom: '16px' }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {messagePairs.map((pair, idx) => (
            <div key={pair.user.id} ref={pair.user.id === lastUserId ? lastUserRef : null} className="space-y-2">
              <ChatMessage
                content={pair.user.content}
                role={pair.user.role as "user" | "assistant"}
                timestamp={pair.user.timestamp}
              />
              {/* AI reply or streaming/typing indicator */}
              {pair.assistant ? (
                <ChatMessage
                  content={pair.assistant.content}
                  role={pair.assistant.role as "user" | "assistant"}
                  timestamp={pair.assistant.timestamp}
                  memoryCount={memoryCounts?.[pair.assistant.id]}
                />
              ) :
                idx === messagePairs.length - 1 && (isStreaming || isTyping) ? (
                  isStreaming && streamingContent ? (
                    <ChatMessage content={streamingContent} role="assistant" />
                  ) : isTyping ? (
                    <TypingIndicator />
                  ) : null
                ) : null
              }
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
