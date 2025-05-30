import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNewChat?: () => void;
}

export function Header({ onToggleSidebar, isSidebarOpen, onNewChat }: HeaderProps) {
  const [, setLocation] = useLocation();

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      setLocation("/");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white dark:bg-black">
      <div className="flex items-center gap-3">
        {/* Empty div to push content to the right */}
      </div>
      
      <div className="flex items-center gap-4 md:gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleNewChat}
          className="p-3 md:p-2 text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-white"
        >
          <Plus className="w-7 h-7 md:w-5 md:h-5 font-bold stroke-[2.5]" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="p-3 md:p-2 md:hidden text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-white"
        >
          <Menu className="w-7 h-7 md:w-5 md:h-5 font-bold stroke-[2.5]" />
        </Button>
      </div>
    </header>
  );
}
