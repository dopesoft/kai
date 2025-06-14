import { useState, useEffect, useMemo } from "react";
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
  const [memoryCounts, setMemoryCounts] = useState<{ [messageId: number]: number }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Determine the effective user identifier (real auth user or anonymous fallback)
  const effectiveUserId = useMemo(() => {
    const anon = localStorage.getItem('anon_user_id');
    const userId = user?.id || anon || null;
    console.log('getEffectiveUserId:', { userId: user?.id, anon, effectiveUserId: userId });
    return userId;
  }, [user?.id]);

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

  // Removed isCreatingThread - not needed with simpler logic
  
  // Fetch messages when thread changes
  useEffect(() => {
    // Only fetch if we don't already have messages (prevents clearing on new message)
    if (activeThreadId && effectiveUserId && currentMessages.length === 0) {
      console.log('📥 Loading thread:', activeThreadId);
      fetchThreadMessages(activeThreadId);
    }
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
    onSuccess: (data) => {
      // Don't refetch threads immediately - it causes UI flash
      // Instead, optimistically add the new thread to the list
      queryClient.setQueryData(['threads', effectiveUserId], (old: any) => {
        return old ? [...old, data] : [data];
      });
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
    console.log('🆕 New chat requested');
    // Clear everything for a fresh start
    setCurrentThread(null);
    setActiveThreadId(null);
    setCurrentMessages([]);
    setIsTyping(false);
    setIsStreaming(false);
    setStreamingContent("");
    setMemoryCounts({});
    
    // Clear active thread from localStorage
    localStorage.removeItem('activeThreadId');
    
    // Force a new thread by setting a flag that the next message should create a new thread
    localStorage.setItem('forceNewThread', 'true');
    console.log('🆕 Marked for new thread creation on next message');
  };

  const handleThreadSelect = (threadId: string) => {
    console.log('🎯 handleThreadSelect called:', { threadId, effectiveUserId, currentActiveThread: activeThreadId });
    
    // Clear force new thread flag since we're selecting an existing thread
    localStorage.removeItem('forceNewThread');
    
    // Clear current messages first so we don't show old messages during loading
    setCurrentMessages([]);
    setCurrentThread(null);
    
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

  // Simple thread restoration on mount
  useEffect(() => {
    const storedThreadId = localStorage.getItem('activeThreadId');
    
    if (storedThreadId && threads.length > 0 && !activeThreadId) {
      const threadExists = threads.some((t: ChatThread) => t.thread_id === storedThreadId);
      if (threadExists) {
        console.log('📂 Restoring thread:', storedThreadId);
        setActiveThreadId(storedThreadId);
      } else {
        localStorage.removeItem('activeThreadId');
      }
    }
  }, [threads]);

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
        const newMessages = [...prev, userMessage];
        console.log('📝 Previous messages:', prev.length, 'New messages:', newMessages.length);
        console.log('📝 This should trigger chat view since messages > 0');
        return newMessages;
      });
      
      // Show thinking indicator immediately
      console.log('🤔 Setting typing indicator to true');
      setIsTyping(true);

      // ALWAYS create a new thread when sending from welcome screen (no active thread) or when forced
      let threadToUse = currentThread;
      const forceNewThread = localStorage.getItem('forceNewThread') === 'true';
      
      // If we're on welcome screen (no messages), ALWAYS create new thread, or if explicitly requested
      if (currentMessages.length === 0 || !activeThreadId || !currentThread || forceNewThread) {
        // Clear the force flag
        localStorage.removeItem('forceNewThread');
        // Generate title from first message
        const words = message.split(' ').slice(0, 4);
        const title = words.join(' ') + (message.split(' ').length > 4 ? '...' : '');
        
        // Create thread in database
        try {
          threadToUse = await createThreadMutation.mutateAsync(title);
          console.log('✅ Created NEW thread:', threadToUse);
          if (threadToUse) {
            setCurrentThread(threadToUse);
            setActiveThreadId(threadToUse.thread_id);
            localStorage.setItem('activeThreadId', threadToUse.thread_id);
          }
        } catch (error) {
          console.error('❌ Failed to create thread:', error);
          // Create a temporary thread so UI works
          const tempThread: ChatThread = {
            id: 'temp-' + Date.now(),
            thread_id: 'temp-' + Date.now(),
            title: title,
            user_id: effectiveUserId || 'anon',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            archived: false,
            metadata: {}
          };
          threadToUse = tempThread;
          setCurrentThread(tempThread);
          setActiveThreadId(tempThread.thread_id);
        }
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
      
      // Ensure we have a valid thread ID
      if (!threadToUse?.thread_id) {
        throw new Error("Failed to create thread - no thread ID available");
      }

      const requestData: ChatRequest = { 
        message,
        apiKey,
        model,
        userId: effectiveUserId || undefined,
        threadId: threadToUse.thread_id
      };

      // Use streaming endpoint
      console.log('📤 Sending request with:', {
        userId: requestData.userId,
        threadId: requestData.threadId,
        hasApiKey: !!requestData.apiKey,
        model: requestData.model
      });
      
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, errorText);
        
        // Keep the thread active even on error
        if (threadToUse?.thread_id) {
          setActiveThreadId(threadToUse.thread_id);
        }
        
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
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
                  // Store memory count for display above action buttons
                  const shortTermCount = data.memories.short_term?.length || 0;
                  const longTermCount = data.memories.long_term?.length || 0;
                  const totalCount = shortTermCount + longTermCount;
                  
                  if (totalCount > 0) {
                    // Store the memory count for the next assistant message that will be created
                    console.log('🧠 Storing memory count in localStorage:', totalCount);
                    localStorage.setItem('nextMemoryCount', totalCount.toString());
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
                  
                  // Get memory count and store it for this message
                  const memoryCount = localStorage.getItem('nextMemoryCount');
                  console.log('🧠 Retrieved memory count from localStorage:', memoryCount);
                  if (memoryCount) {
                    const count = parseInt(memoryCount, 10);
                    console.log('🧠 Setting memory count for message', assistantMessage.id, ':', count);
                    setMemoryCounts(prev => ({
                      ...prev,
                      [assistantMessage.id]: count
                    }));
                    localStorage.removeItem('nextMemoryCount');
                    
                    // Auto-scroll to ensure memory notification and action buttons are visible
                    setTimeout(() => {
                      const container = document.querySelector('.h-full.overflow-y-auto');
                      if (container) {
                        container.scrollTo({
                          top: container.scrollHeight,
                          behavior: 'smooth'
                        });
                      }
                    }, 200); // Small delay to ensure DOM has updated
                  }
                  
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
      
      // Don't clear messages on error - keep the user message visible
      // Remove the last message only if it was the user message we just added
      setCurrentMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === "user") {
          // Keep the message but show error
          return prev;
        }
        return prev;
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      console.log('✅ Message sent successfully');
      // Ensure we're showing chat view
      if (currentMessages.length > 0) {
        console.log('✅ Messages exist, should be showing chat view');
      }
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

  // Simple rule: Show conversation view if we have any messages OR if we've selected a thread
  const showChatView = currentMessages.length > 0 || activeThreadId !== null;

  return (
    <div className="h-screen flex bg-white dark:bg-black relative overflow-hidden">
      {/* Auth setup banner */}
      {!authEnabled && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <AuthSetupBanner />
        </div>
      )}

      {/* Global background effects */}
      {showChatView ? <SparklesBackground /> : <BackgroundPathsEffect />}
      
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
        
        {showChatView ? (
          <div className={`flex-1 flex flex-col h-full ${!authEnabled ? 'pt-20' : 'pt-16'}`}>
            <div className="flex-1 overflow-hidden">
              <MessageContainer 
                messages={currentMessages} 
                isTyping={isTyping}
                streamingContent={streamingContent}
                isStreaming={isStreaming}
                memoryCounts={memoryCounts}
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