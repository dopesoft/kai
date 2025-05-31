import { Search, X, Menu, MessageSquare, Folder, Plus, Sun, Moon, MoreHorizontal, Trash2, Brain, Settings, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { loadThreads, getActiveThreadId, deleteThread, type ChatThread } from "@/lib/chatThreads";
import { isYesterday } from "date-fns";
import { useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  activeThreadId: string | null;
  onThreadDelete?: (threadId: string) => void;
}

export function Sidebar({ isOpen, onClose, onThreadSelect, onNewChat, activeThreadId, onThreadDelete }: SidebarProps) {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, authEnabled } = useAuth();

  // Get user's first name from profile
  const getFirstName = () => {
    if (!profile?.full_name) return null;
    return profile.full_name.split(' ')[0];
  };

  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!profile?.full_name) return "U";
    const nameParts = profile.full_name.split(' ');
    const firstInitial = nameParts[0]?.[0] || '';
    const lastInitial = nameParts[1]?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || "U";
  };

  useEffect(() => {
    const loadedThreads = loadThreads();
    setThreads(loadedThreads);
  }, []);

  // Update threads when activeThreadId changes (thread was updated)
  useEffect(() => {
    const loadedThreads = loadThreads();
    setThreads(loadedThreads);
  }, [activeThreadId]);

  // Add a periodic refresh to catch new threads
  useEffect(() => {
    const interval = setInterval(() => {
      const loadedThreads = loadThreads();
      setThreads(loadedThreads);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Categorize threads by time
  const yesterdayThreads = threads.filter(thread => isYesterday(thread.updatedAt));
  const recentThreads = threads.filter(thread => !isYesterday(thread.updatedAt));

  const handleDeleteThread = (threadId: string) => {
    deleteThread(threadId);
    setThreads(loadThreads());
    if (onThreadDelete) {
      onThreadDelete(threadId);
    }
  };

  const renderThreadItem = (thread: ChatThread) => {
    const isActive = thread.id === activeThreadId;
    
    return (
      <div 
        key={thread.id}
        className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors relative group ${
          isActive 
            ? "bg-gray-200 dark:bg-gray-700 text-black dark:text-white" 
            : "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#435058]"
        }`}
      >
        <button 
          onClick={() => onThreadSelect(thread.id)}
          className="w-full text-left truncate font-normal pr-8"
        >
          {thread.title}
        </button>
        
        {/* Three dots menu on hover */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-300 dark:hover:bg-[#435058]"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteThread(thread.id);
                }}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop with blur effect */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-md z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-[296px] z-50 transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:ml-10
        text-[#666666] dark:text-white px-3 py-[0.5rem] flex items-center
        bg-transparent
      `}>
        <div className="bg-[#f9f9f9] dark:bg-black rounded-xl h-[calc(80vh+16px)] w-full shadow-sm border border-gray-300 dark:border-gray-600">
          <div className="flex flex-col h-full">
          {/* Header with ChatGPT logo and hamburger */}
          <div className="flex items-center justify-between p-3 pb-9">
            <div className="flex items-center justify-center gap-2 flex-1">
              <span className="text-lg font-medium text-black dark:text-white">kai</span>
              <span className="text-xs bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded">1k</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="md:hidden p-1 text-[#666666] hover:text-black dark:text-white dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search chats */}
          <div className="px-3 pb-3">
            <button className="w-full justify-start text-[#666666] dark:text-white hover:text-black dark:hover:text-white h-8 flex items-center transition-colors">
              <Search className="w-4 h-4 mr-2" />
              Search chats
            </button>
          </div>

          {/* Navigation */}
          <div className="px-3 pb-4 border-b border-gray-300 dark:border-gray-600">
            <div className="space-y-1">
              <button 
                onClick={() => setLocation("/memory")}
                className="w-full justify-start text-[#666666] dark:text-white hover:text-black dark:hover:text-white h-8 flex items-center transition-colors rounded px-2"
              >
                <Brain className="w-4 h-4 mr-2" />
                Memory
              </button>
              <button 
                onClick={() => setLocation("/settings")}
                className="w-full justify-start text-[#666666] dark:text-white hover:text-black dark:hover:text-white h-8 flex items-center transition-colors rounded px-2"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>

          {/* Chat History */}
          <ScrollArea className="flex-1 px-3">
            <div className="space-y-4">
              {/* CHATS section - newest first */}
              <div className="pt-6">
                <h3 className="text-xs font-bold text-[#666666] dark:text-white mb-2 px-2">CHATS</h3>
                <div className="space-y-1">
                  {recentThreads.map(renderThreadItem)}
                </div>
              </div>

              {/* YESTERDAY section - only show if there are yesterday threads */}
              {yesterdayThreads.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-[#666666] dark:text-white mb-2 px-2">YESTERDAY</h3>
                  <div className="space-y-1">
                    {yesterdayThreads.map(renderThreadItem)}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* User profile - Fixed to bottom */}
          <div className="p-3 border-t border-gray-300 dark:border-gray-600">
            <div className="flex items-center justify-between">
              {authEnabled && user ? (
                <button 
                  onClick={() => setLocation("/settings")}
                  className="flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded p-1 transition-colors"
                >
                  <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black text-sm font-medium">
                    {getUserInitials()}
                  </div>
                  <span className="text-sm text-[#666666] dark:text-white">
                    {getFirstName() || "User"}
                  </span>
                </button>
              ) : (
                <button 
                  onClick={() => setLocation("/settings")}
                  className="flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-gray-800 rounded p-1 transition-colors"
                >
                  <div className="w-8 h-8 bg-black dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black text-sm font-medium">
                    U
                  </div>
                  <span className="text-sm text-[#666666] dark:text-white">User</span>
                </button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="p-2 text-[#666666] hover:text-black dark:text-white dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          </div>
        </div>
      </aside>
    </>
  );
}