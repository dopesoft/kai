import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Share, MoreHorizontal, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatMessageProps {
  content: string;
  role: "user" | "assistant";
  timestamp?: Date;
  memoryCount?: number;
}

export function ChatMessage({ content, role, timestamp, memoryCount }: ChatMessageProps) {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  
  // Debug logging
  if (role === "assistant" && memoryCount) {
    console.log('🧠 ChatMessage received memoryCount:', memoryCount, 'for content:', content.substring(0, 50) + '...');
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "Message copied successfully",
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy message to clipboard",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  const formatTime = (date: Date | string) => {
    if (!date) {
      return "Just now";
    }
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return "Just now";
    }
    
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(dateObj);
  };

  return (
    <div
      className={`group flex ${role === "user" ? "justify-end" : "justify-start"} animate-fade-in mb-6`}
      data-message-role={role}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`${
        role === "user" 
          ? "max-w-[80%] md:max-w-[70%] flex flex-col items-end" 
          : "w-full"
      }`}>
        <div
          className={`${
            role === "user"
              ? "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl px-4 py-3"
              : "text-gray-800 dark:text-gray-100"
          }`}
        >
          <div className="text-sm md:text-base leading-relaxed">
            {role === "assistant" ? (
              <ReactMarkdown
                components={{
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !className;
                    return !isInline && match ? (
                      <SyntaxHighlighter
                        style={theme === "dark" ? oneDark : oneLight}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md text-sm"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 last:mb-0 pl-6 space-y-1 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 last:mb-0 pl-6 space-y-1 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                  h4: ({ children }) => <h4 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h4>,
                  h5: ({ children }) => <h5 className="text-sm font-bold mb-2 mt-2 first:mt-0">{children}</h5>,
                  h6: ({ children }) => <h6 className="text-sm font-bold mb-2 mt-2 first:mt-0">{children}</h6>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 my-3 italic text-gray-700 dark:text-gray-300">
                      {children}
                    </blockquote>
                  ),
                  hr: () => <hr className="my-4 border-gray-300 dark:border-gray-600" />,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              content
            )}
          </div>
        </div>
        
        {/* Memory notification - only for assistant messages with memory count */}
        {role === "assistant" && memoryCount && memoryCount > 0 && (
          <div className="flex items-center gap-2 mt-3 mb-1">
            <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {memoryCount} Memories made
            </span>
          </div>
        )}
        
        {/* Action buttons on hover */}
        <div className={`flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
          role === "user" ? "justify-end" : "justify-start"
        }`}>
          {role === "assistant" ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Share className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
        
        {timestamp && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}