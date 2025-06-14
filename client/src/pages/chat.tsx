import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/chat/Header";
import { Sidebar } from "@/components/chat/Sidebar";
import { MessageContainer } from "@/components/chat/MessageContainer";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { ChatInput } from "@/components/chat/ChatInput";
import { SparklesBackground } from "@/components/ui/sparkles-background";
import { BackgroundPathsEffect } from "@/components/ui/background-paths";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { useAuth } from "@/lib/use-auth";
import type { Message, ChatRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { nanoid } from 'nanoid';
import { integrationService } from "@/lib/integrations";

// Define chat thread type
interface ChatThread {
  id: string;
  user_id: string;
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  metadata: any;
  messages?: Message[];
}

export default function Chat() {
  const { authEnabled, user } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Determine the effective user identifier (real auth user or anonymous fallback)
  const getEffectiveUserId = () => {
    const anon = localStorage.getItem('anon_user_id');
    const userId = user?.id || anon || null;
    console.log('getEffectiveUserId:', { userId: user?.id, anon, effectiveUserId: userId });
    return userId;
  };

  const effectiveUserId = getEffectiveUserId();

  // Fetch threads from database
  const { data: threads = [], refetch: refetchThreads } = useQuery({
    queryKey: ['threads', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      const response = await fetch(`/api/chat/threads?user_id=${effectiveUserId}`);
      if (!response.ok) throw new Error('Failed to fetch threads');
      return response.json();
    },
    enabled: !!effectiveUserId,
  });

  // Fetch messages when thread changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - activeThreadId changed:', { activeThreadId, effectiveUserId });
    if (activeThreadId && effectiveUserId) {
      console.log('✅ Calling fetchThreadMessages for:', activeThreadId);
      fetchThreadMessages(activeThreadId);
    } else if (!activeThreadId) {
      // Only clear messages if there's explicitly no active thread
      console.log('❌ Clearing messages - no active thread');
      setCurrentMessages([]);
      setCurrentThread(null);
    }
    // Don't clear messages if we're just waiting for effectiveUserId
  }, [activeThreadId, effectiveUserId]);

  const fetchThreadMessages = async (threadId: string) => {
    try {
      console.log('🔍 fetchThreadMessages called with:', { threadId, effectiveUserId });
      
      // Validate inputs before making the request
      if (!threadId || !effectiveUserId) {
        console.warn('Missing threadId or effectiveUserId:', { threadId, effectiveUserId });
        return;
      }
      
      // Don't set typing here - only when actually sending a message
      // setIsTyping(true);
      
      const url = `/api/chat/threads/${threadId}?user_id=${effectiveUserId}`;
      console.log('Fetching thread messages from:', url);
      
      const response = await fetch(url);
      console.log('📥 Response received:', { status: response.status, ok: response.ok });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to parse error response as JSON, but handle HTML responses
        let errorMessage = 'Failed to fetch thread';
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // Failed to parse JSON, use default error message
          }
        } else {
          console.error('Non-JSON error response:', response.status, contentType);
        }
        
        throw new Error(errorMessage);
      }
      
      const threadData = await response.json();
      console.log('📋 Thread data received:', { 
        threadId: threadData.thread_id, 
        messageCount: threadData.messages?.length || 0,
        title: threadData.title 
      });
      
      setCurrentThread(threadData);
      const mappedMessages = threadData.messages ? threadData.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at)
      })) : [];
      
      console.log('✅ Setting messages:', { count: mappedMessages.length });
      setCurrentMessages(mappedMessages);
    } catch (error) {
      console.error('❌ Failed to fetch thread messages:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load conversation history",
        variant: "destructive",
      });
    }
  };

  const createThreadMutation = useMutation({
    mutationFn: async (title: string) => {
      // Ensure we have some form of user identifier even when auth is disabled
      const existingAnonId = localStorage.getItem('anon_user_id');
      const fallbackUserId = existingAnonId || nanoid();
      if (!existingAnonId) {
        localStorage.setItem('anon_user_id', fallbackUserId);
      }

      const threadId = nanoid();

      const response = await fetch('/api/chat/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: effectiveUserId ?? fallbackUserId,
          thread_id: threadId,
          title
        })
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Failed to create thread';
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (e) {
            // Failed to parse JSON
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Thread creation response:', data); // Debug log
      return data;
    },
    onSuccess: () => {
      refetchThreads();
    }
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: string) => {
      const response = await fetch(`/api/chat/threads/${threadId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete thread');
      return response.json();
    },
    onSuccess: () => {
      refetchThreads();
    }
  });

  const handleNewChat = () => {
    // Clear everything and show welcome screen
    setCurrentThread(null);
    setActiveThreadId(null);
    setCurrentMessages([]);
    
    // Clear active thread from localStorage (temporary state only)
    localStorage.removeItem('activeThreadId');
  };

  const handleThreadSelect = (threadId: string) => {
    console.log('🎯 handleThreadSelect called:', { threadId, effectiveUserId, currentActiveThread: activeThreadId });
    setActiveThreadId(threadId);
    // Store in localStorage for page refresh persistence
    localStorage.setItem('activeThreadId', threadId);
    console.log('✅ Updated activeThreadId to:', threadId);
  };

  const handleThreadDelete = async (threadId: string) => {
    try {
      await deleteThreadMutation.mutateAsync(threadId);
      
      if (threadId === activeThreadId) {
        // If we deleted the active thread, start fresh
        handleNewChat();
      }
      
      toast({
        title: "Success",
        description: "Conversation deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  // Restore active thread on mount (from localStorage)
  useEffect(() => {
    const storedThreadId = localStorage.getItem('activeThreadId');
    console.log('Restore thread effect:', { storedThreadId, effectiveUserId, threadsLength: threads.length });

    // If user just logged in (has real id), clear any anonymous id
    if (user?.id) {
      localStorage.removeItem('anon_user_id');
    }

    // Only try to restore if we have both user ID and threads loaded
    if (effectiveUserId && threads.length > 0) {
      if (storedThreadId) {
        // Verify that the stored thread actually belongs to the current user
        const existsForUser = threads.some((t: ChatThread) => t.thread_id === storedThreadId);
        if (existsForUser) {
          setActiveThreadId(storedThreadId);
        } else {
          // Remove stale reference so no random selection occurs
          localStorage.removeItem('activeThreadId');
          setActiveThreadId(null);
        }
      } else {
        setActiveThreadId(null);
      }
    } else if (effectiveUserId && threads.length === 0) {
      // User has no threads, ensure we're in welcome state
      localStorage.removeItem('activeThreadId');
      setActiveThreadId(null);
    }
    // Don't do anything if we're still loading threads or waiting for user ID
  }, [effectiveUserId, threads.length]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Add user message to UI IMMEDIATELY before any async operations
      const userMessage: Message = {
        id: Date.now(),
        content: message,
        role: "user",
        timestamp: new Date()
      };
      
      console.log('📝 Adding user message FIRST, current length:', currentMessages.length);
      setCurrentMessages(prev => {
        console.log('📝 Previous messages:', prev.length, 'New length:', prev.length + 1);
        return [...prev, userMessage];
      });
      
      // Show thinking indicator immediately
      console.log('🤔 Setting typing indicator to true');
      setIsTyping(true);

      // NOW do async operations
      // If no active thread, create a new one
      let threadToUse = currentThread;
      if (!threadToUse) {
        // Generate title from first message
        const words = message.split(' ').slice(0, 4);
        const title = words.join(' ') + (message.split(' ').length > 4 ? '...' : '');
        
        // Create thread in database
        threadToUse = await createThreadMutation.mutateAsync(title);
        console.log('Created thread:', threadToUse); // Debug log
        setCurrentThread(threadToUse);
        setActiveThreadId(threadToUse!.thread_id);
        localStorage.setItem('activeThreadId', threadToUse!.thread_id);
      }

      // Get API key from database integrations
      let apiKey: string | undefined;
      let model: string | undefined;
      
      if (user && authEnabled) {
        // Try to get from database first
        const openaiIntegration = await integrationService.getIntegrationByProvider(user.id, 'openai');
        if (openaiIntegration) {
          apiKey = openaiIntegration.api_key;
          model = openaiIntegration.config?.model;
        }
      }
      
      // Fallback to localStorage if not in database
      if (!apiKey) {
        // Check if there's an API key in localStorage (indicating a valid integration)
        apiKey = localStorage.getItem("chatgpt_api_key") || undefined;
        model = localStorage.getItem("chatgpt_model") || undefined;
        
        if (!apiKey) {
          throw new Error("No API key found. Please configure an OpenAI integration in Settings.");
        }
      }
      
      const requestData: ChatRequest = { 
        message,
        apiKey,
        model,
        userId: effectiveUserId || undefined,
        threadId: threadToUse!.thread_id
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
      let hasStartedStreaming = false;

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
                
                // Handle memory updates
                if (data.type === 'memory_update') {
                  console.log('📝 Memory saved:', data.memories);
                  // Show a toast notification for memory updates
                  const shortTermCount = data.memories.short_term?.length || 0;
                  const longTermCount = data.memories.long_term?.length || 0;
                  const totalCount = shortTermCount + longTermCount;
                  
                  if (totalCount > 0) {
                    toast({
                      title: "Memory Updated",
                      description: `Saved ${totalCount} memory item${totalCount > 1 ? 's' : ''}`,
                    });
                  }
                } else if (data.type === 'thread_info') {
                  // Server might send OpenAI thread ID if using assistants
                  console.log('OpenAI Thread ID:', data.threadId);
                } else if (data.content) {
                  // Transition from typing to streaming on first content
                  if (!hasStartedStreaming) {
                    console.log('🔄 Transitioning from typing to streaming');
                    setIsTyping(false);
                    setIsStreaming(true);
                    setStreamingContent("");
                    hasStartedStreaming = true;
                  }
                  
                  streamedContent += data.content;
                  // Update streaming content in real-time for smooth streaming effect
                  setStreamingContent(streamedContent);
                }
                
                if (data.done) {
                  // Add final message first, then end streaming mode
                  const assistantMessage: Message = {
                    id: Date.now() + 1,
                    content: streamedContent,
                    role: "assistant",
                    timestamp: new Date()
                  };
                  
                  setCurrentMessages(prev => [...prev, assistantMessage]);
                  
                  // End streaming mode after message is added
                  setTimeout(() => {
                    setIsStreaming(false);
                    setStreamingContent("");
                  }, 100);
                  
                  // Update thread's updated_at timestamp
                  queryClient.invalidateQueries({ queryKey: ['threads', effectiveUserId] });
                  
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
    onError: (error) => {
      console.error("Failed to send message:", error);
      setIsTyping(false);
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
        threads={threads}
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