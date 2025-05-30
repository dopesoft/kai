import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import type { Message } from "@shared/schema";

interface MessageContainerProps {
  messages: Message[];
  isTyping: boolean;
  streamingContent?: string;
  isStreaming?: boolean;
}

export function MessageContainer({ messages, isTyping, streamingContent, isStreaming }: MessageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastUserRef = useRef<HTMLDivElement>(null);

  // Scroll behavior: When new user message is added, scroll to show it near the top
  useEffect(() => {
    const container = containerRef.current;
    const userMessage = lastUserRef.current;

    if (container && userMessage) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Position user message near top with some offset
          const targetScroll = userMessage.offsetTop - 40;
          container.scrollTo({ 
            top: Math.max(0, targetScroll), 
            behavior: 'smooth' 
          });
        }, 50);
      });
    }
  }, [messages]);

  // Auto-scroll to bottom during streaming or typing
  useEffect(() => {
    const container = containerRef.current;
    
    if (container && (isStreaming || isTyping)) {
      requestAnimationFrame(() => {
        container.scrollTo({ 
          top: container.scrollHeight, 
          behavior: 'smooth' 
        });
      });
    }
  }, [streamingContent, isStreaming, isTyping]);

  // Find index of last user message
  const lastUserIndex = [...messages].reverse().findIndex((msg) => msg.role === "user");
  const absoluteIndex = lastUserIndex >= 0 ? messages.length - 1 - lastUserIndex : -1;

  return (
    <main className="h-full relative z-10 overflow-hidden">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto px-4 scroll-smooth text-[15px]"
        style={{ paddingTop: '16px', paddingBottom: '16px' }}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              ref={index === absoluteIndex ? lastUserRef : null}
            >
              <ChatMessage
                content={message.content}
                role={message.role as "user" | "assistant"}
                timestamp={message.timestamp}
              />
            </div>
          ))}
          
          {/* Show streaming message */}
          {isStreaming && streamingContent && (
            <ChatMessage
              content={streamingContent}
              role="assistant"
            />
          )}
          
          {isTyping && !isStreaming && <TypingIndicator />}
        </div>
      </div>
    </main>
  );
}
