import type { Message } from "@shared/schema";

export interface ChatThread {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

const THREADS_STORAGE_KEY = "chat_threads";
const ACTIVE_THREAD_KEY = "active_thread_id";

export function generateThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function saveThreads(threads: ChatThread[]): void {
  localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(threads));
}

export function loadThreads(): ChatThread[] {
  const stored = localStorage.getItem(THREADS_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const threads = JSON.parse(stored);
    return threads.map((thread: any) => ({
      ...thread,
      createdAt: new Date(thread.createdAt),
      updatedAt: new Date(thread.updatedAt),
      messages: thread.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }));
  } catch {
    return [];
  }
}

export function getActiveThreadId(): string | null {
  return localStorage.getItem(ACTIVE_THREAD_KEY);
}

export function setActiveThreadId(threadId: string | null): void {
  if (threadId) {
    localStorage.setItem(ACTIVE_THREAD_KEY, threadId);
  } else {
    localStorage.removeItem(ACTIVE_THREAD_KEY);
  }
}

export function createNewThread(): ChatThread {
  const thread: ChatThread = {
    id: generateThreadId(),
    title: "New Chat",
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: []
  };
  
  // Don't save to storage or set as active until first message is sent
  return thread;
}

export function saveNewThreadWithMessage(thread: ChatThread): void {
  const threads = loadThreads();
  threads.unshift(thread);
  saveThreads(threads);
  setActiveThreadId(thread.id);
}

export function updateThread(threadId: string, updates: Partial<ChatThread>): void {
  const threads = loadThreads();
  const threadIndex = threads.findIndex(t => t.id === threadId);
  
  if (threadIndex !== -1) {
    threads[threadIndex] = {
      ...threads[threadIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    // Sort threads by updatedAt, newest first
    threads.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    saveThreads(threads);
  }
}

export function addMessageToThread(threadId: string, message: Message): void {
  const threads = loadThreads();
  const thread = threads.find(t => t.id === threadId);
  
  if (thread) {
    thread.messages.push(message);
    
    // Update title if this is the first user message
    if (message.role === "user" && thread.messages.filter(m => m.role === "user").length === 1) {
      thread.title = message.content.length > 40 
        ? message.content.substring(0, 40) + "..."
        : message.content;
    }
    
    updateThread(threadId, { messages: thread.messages });
  }
}

export function getThread(threadId: string): ChatThread | undefined {
  const threads = loadThreads();
  return threads.find(t => t.id === threadId);
}

export function deleteThread(threadId: string): void {
  const threads = loadThreads();
  const filteredThreads = threads.filter(t => t.id !== threadId);
  saveThreads(filteredThreads);
  
  if (getActiveThreadId() === threadId) {
    setActiveThreadId(null);
  }
}