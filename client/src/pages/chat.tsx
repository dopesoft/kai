import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/chat/Header";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageContainer } from "@/components/chat/MessageContainer";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { ChatInput } from "@/components/chat/ChatInput";
import { SparklesBackground } from "@/components/ui/sparkles-background";
import { BackgroundPathsEffect } from "@/components/ui/background-paths";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { useAuth } from "@/lib/auth-context";
import type { Message, ChatRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  loadThreads, 
  getActiveThreadId, 
  setActiveThreadId, 
  createNewThread, 
  addMessageToThread, 
  getThread,
  saveNewThreadWithMessage,
  type ChatThread 
} from "@/lib/chatThreads";

export default function Chat() {
  const { authEnabled } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize thread state
  useEffect(() => {
    const storedActiveId = getActiveThreadId();
    if (storedActiveId) {
      const thread = getThread(storedActiveId);
      if (thread) {
        setActiveThreadIdState(storedActiveId);
        setCurrentMessages(thread.messages);
        setCurrentThread(thread);
      } else {
        // Thread not found, start with no active thread
        setActiveThreadIdState(null);
        setCurrentMessages([]);
        setCurrentThread(null);
        setActiveThreadId(null);
      }
    } else {
      // No active thread, start fresh
      setActiveThreadIdState(null);
      setCurrentMessages([]);
      setCurrentThread(null);
    }
  }, []);

  const handleNewChat = () => {
    // Create a temporary thread that won't be saved until first message
    const newThread = createNewThread();
    setCurrentThread(newThread);
    setActiveThreadIdState(newThread.id);
    setCurrentMessages([]);
  };

  const handleThreadSelect = (threadId: string) => {
    const thread = getThread(threadId);
    if (thread) {
      setActiveThreadId(threadId);
      setActiveThreadIdState(threadId);
      setCurrentMessages(thread.messages);
      setCurrentThread(thread);
    }
  };

  const handleThreadDelete = (threadId: string) => {
    if (threadId === activeThreadId) {
      // If we deleted the active thread, start fresh
      setActiveThreadIdState(null);
      setCurrentMessages([]);
      setCurrentThread(null);
      setActiveThreadId(null);
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // If no active thread, create a new one
      let threadToUse = currentThread;
      if (!threadToUse) {
        threadToUse = createNewThread();
        setCurrentThread(threadToUse);
        setActiveThreadIdState(threadToUse.id);
      }

      // Check for verified integrations
      const verifiedIntegrations = JSON.parse(localStorage.getItem("verified_integrations") || "[]");
      const openaiIntegration = verifiedIntegrations.find((i: any) => i.provider === "openai");
      
      if (!openaiIntegration) {
        throw new Error("No verified AI integration found. Please configure an OpenAI integration in Settings.");
      }

      const apiKey = localStorage.getItem("chatgpt_api_key") || undefined;
      const model = localStorage.getItem("chatgpt_model") || undefined;
      
      // Add user message to thread immediately
      const userMessage: Message = {
        id: Date.now(),
        content: message,
        role: "user",
        timestamp: new Date()
      };
      
      // If this is the first message in a new thread, save the thread to storage
      const isFirstMessage = threadToUse.messages.length === 0;
      if (isFirstMessage) {
        // Update thread with first message and save to storage
        threadToUse.messages.push(userMessage);
        threadToUse.updatedAt = new Date();
        // Generate a title from the first few words of the message
        const words = message.split(' ').slice(0, 4);
        threadToUse.title = words.join(' ') + (message.split(' ').length > 4 ? '...' : '');
        
        saveNewThreadWithMessage(threadToUse);
        setCurrentThread(threadToUse);
      } else {
        // Add to existing thread
        addMessageToThread(threadToUse.id, userMessage);
      }
      
      setCurrentMessages(prev => [...prev, userMessage]);
      
      const requestData: ChatRequest = { 
        message,
        apiKey,
        model
      };

      // Use streaming endpoint
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";
      
      // Start streaming mode
      setIsStreaming(true);
      setStreamingContent("");

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.error) {
                  throw new Error(data.error);
                }
                if (data.content) {
                  streamedContent += data.content;
                  // Update streaming content in real-time for smooth streaming effect
                  setStreamingContent(streamedContent);
                }
                if (data.done) {
                  // End streaming mode and add final message
                  setIsStreaming(false);
                  setStreamingContent("");
                  
                  const assistantMessage: Message = {
                    id: Date.now() + 1,
                    content: streamedContent,
                    role: "assistant",
                    timestamp: new Date()
                  };
                  
                  addMessageToThread(threadToUse.id, assistantMessage);
                  setCurrentMessages(prev => [...prev, assistantMessage]);
                  
                  return { content: streamedContent, role: "assistant" as const };
                }
              } catch (e) {
                // Skip invalid JSON lines
                console.warn('Invalid JSON in stream:', line);
              }
            }
          }
        }
      }

      return { content: streamedContent, role: "assistant" as const };
    },
    onMutate: () => {
      setIsTyping(true);
    },
    onError: (error) => {
      console.error("Failed to send message:", error);
      setIsStreaming(false);
      setStreamingContent("");
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsTyping(false);
    },
  });

  const handleSendMessage = (message: string) => {
    sendMessageMutation.mutate(message);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const hasMessages = currentMessages.length > 0;

  return (
    <div className="h-screen flex bg-white dark:bg-black relative overflow-hidden">
      {/* Auth setup banner */}
      {!authEnabled && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <AuthSetupBanner />
        </div>
      )}

      {/* Global background effects */}
      {hasMessages ? <SparklesBackground /> : <BackgroundPathsEffect />}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar}
        onThreadSelect={handleThreadSelect}
        onNewChat={handleNewChat}
        activeThreadId={activeThreadId}
        onThreadDelete={handleThreadDelete}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} onNewChat={handleNewChat} />
        
        {hasMessages ? (
          <div className={`flex-1 flex flex-col h-full ${!authEnabled ? 'pt-20' : 'pt-16'}`}>
            <div className="flex-1 overflow-hidden">
              <MessageContainer 
                messages={currentMessages} 
                isTyping={isTyping}
                streamingContent={streamingContent}
                isStreaming={isStreaming}
              />
            </div>
            <div className="flex-shrink-0 z-30" style={{ marginBottom: '80px', position: 'relative', top: '-4px' }}>
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={sendMessageMutation.isPending}
              />
            </div>
          </div>
        ) : (
          <div className={`flex-1 ${!authEnabled ? 'pt-20' : 'pt-16'}`}>
            <WelcomeScreen
              onSendMessage={handleSendMessage}
              isLoading={sendMessageMutation.isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
}
