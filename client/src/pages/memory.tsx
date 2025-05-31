import { useState } from "react";
import { Header } from "@/components/chat/Header";
import { MemoryTabs } from "@/components/chat/MemoryTabs";
import { SparklesBackground } from "@/components/ui/sparkles-background";
import { BackgroundPathsEffect } from "@/components/ui/background-paths";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { useAuth } from "@/lib/auth-context";

export default function MemoryPage() {
  const { authEnabled } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNewChat = () => {
    console.log("New Chat clicked from Memory Page");
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Effects */}
      <SparklesBackground />
      <BackgroundPathsEffect />
      
      {authEnabled === false && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <AuthSetupBanner />
        </div>
      )}

      <Header 
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
        onNewChat={handleNewChat} 
      />
      
      {/* Main content area for Memory Tabs */}
      <main className={`flex-grow flex flex-col relative z-10 ${authEnabled === false ? 'pt-16' : 'pt-0' }`}>
        <MemoryTabs />
      </main>
    </div>
  );
} 