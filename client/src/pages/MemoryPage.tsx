import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/chat/Header";
import { Sidebar } from "@/components/chat/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/use-auth";
import { SparklesBackground } from "@/components/ui/sparkles-background";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { Loading } from "@/components/ui/loading";
import { Pencil, Trash2, Save, X, User, Bot, Plus } from "lucide-react";
import { format } from "date-fns";

interface ChatThread {
  id: string;
  user_id: string;
  thread_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
  metadata: any;
}

interface ShortTermMemory {
  id: string;
  user_id: string;
  thread_id: string;  // Changed from session_id
  message: string;
  display_text: string;
  sender: string;
  tags: string[];
  timestamp: string;
  expires_at: string;
  metadata: { auto_captured: boolean };
}

interface LongTermMemory {
  id: string;
  user_id: string;
  category: string;
  key: string;
  value: string;
  display_text: string;
  importance: number;
  embedding?: number[];
  created_at: string;
  last_updated: string;
  metadata: { auto_captured: boolean };
}

export default function MemoryPage() {
  const { user, profile, authEnabled } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'short-term' | 'long-term'>('short-term');
  const [activeThreadId, setActiveThreadIdState] = useState<string | null>(null);
  const [shortTermMemories, setShortTermMemories] = useState<ShortTermMemory[]>([]);
  const [longTermMemories, setLongTermMemories] = useState<LongTermMemory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [addMemoryText, setAddMemoryText] = useState("");
  const [editMemoryText, setEditMemoryText] = useState("");
  const [editingMemory, setEditingMemory] = useState<ShortTermMemory | LongTermMemory | null>(null);
  const [editingIsLongTerm, setEditingIsLongTerm] = useState(false);
  const [saving, setSaving] = useState(false);

  // For now, use empty threads array since API endpoints don't exist yet
  const threads: ChatThread[] = [];

  // Sidebar toggle
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  // Navigation functions for sidebar
  const handleThreadSelect = (threadId: string) => {
    localStorage.setItem('activeThreadId', threadId);
    setLocation('/'); // Navigate to chat page
  };

  const handleNewChat = () => {
    localStorage.removeItem('activeThreadId');
    setLocation('/'); // Navigate to chat page with new thread
  };

  // Fetch memories from API
  const fetchMemories = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [shortTermResponse, longTermResponse] = await Promise.all([
        fetch(`/api/memory/short-term?user_id=${user.id}`),
        fetch(`/api/memory/long-term?user_id=${user.id}`)
      ]);
      
      const shortTermData = await shortTermResponse.json();
      const longTermData = await longTermResponse.json();
      
      setShortTermMemories(shortTermData);
      setLongTermMemories(longTermData);
    } catch (error) {
      console.error('Error fetching memories:', error);
      toast({ title: "Error", description: "Failed to load memories" });
    } finally {
      setLoading(false);
    }
  };

  // Get active thread ID from localStorage on mount
  useEffect(() => {
    const storedThreadId = localStorage.getItem('activeThreadId');
    if (storedThreadId) {
      setActiveThreadIdState(storedThreadId);
    }
  }, []);

  // Load memories when component mounts and user is available
  useEffect(() => {
    if (user?.id && authEnabled) {
      fetchMemories();
    }
  }, [user?.id, authEnabled]);

  // Add memory modal handlers
  const openAddModal = () => {
    setAddMemoryText("");
    setShowAddModal(true);
    setActiveTab(activeTab); // Ensure we know which tab is active
  };
  
  const closeAddModal = () => {
    setShowAddModal(false);
    setAddMemoryText("");
  };

  // Add new memory
  const addMemory = async () => {
    if (!user?.id || !addMemoryText.trim()) return;
    
    setSaving(true);
    try {
      const endpoint = activeTab === 'short-term' ? '/api/memory/short-term' : '/api/memory/long-term';
      const body: any = {
        user_id: user.id,
        display_text: addMemoryText.trim()
      };
      
      // For short-term memories, optionally add the current thread_id
      if (activeTab === 'short-term' && activeThreadId) {
        body.thread_id = activeThreadId;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        const newMemory = await response.json();
        if (activeTab === 'short-term') {
          setShortTermMemories(prev => [newMemory, ...prev]);
        } else {
          setLongTermMemories(prev => [newMemory, ...prev]);
        }
        toast({ title: "Success", description: "Memory added successfully" });
        closeAddModal();
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Failed to add memory');
      }
    } catch (error) {
      console.error('Error adding memory:', error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to add memory", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Edit memory modal handlers
  const openEditModal = (memory: ShortTermMemory | LongTermMemory, isLongTerm: boolean) => {
    setEditingMemory(memory);
    setEditingIsLongTerm(isLongTerm);
    // Always use display_text for editing
    const text = memory.display_text || '';
    setEditMemoryText(text);
    setShowEditModal(true);
  };
  
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingMemory(null);
    setEditMemoryText("");
  };

  // Save edited memory
  const saveEditedMemory = async () => {
    if (!editingMemory || !editMemoryText?.trim()) return;
    
    setSaving(true);
    try {
      const endpoint = editingIsLongTerm 
        ? `/api/memory/long-term/${editingMemory.id}`
        : `/api/memory/short-term/${editingMemory.id}`;
        
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_text: editMemoryText.trim()
        })
      });
      
      if (response.ok) {
        const updatedMemory = await response.json();
        if (editingIsLongTerm) {
          setLongTermMemories(prev => prev.map(m => m.id === updatedMemory.id ? updatedMemory : m));
        } else {
          setShortTermMemories(prev => prev.map(m => m.id === updatedMemory.id ? updatedMemory : m));
        }
        toast({ title: "Success", description: "Memory updated successfully" });
        closeEditModal();
      } else {
        throw new Error('Failed to update memory');
      }
    } catch (error) {
      console.error('Error updating memory:', error);
      toast({ title: "Error", description: "Failed to update memory", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete memory
  const deleteMemory = async (memory: ShortTermMemory | LongTermMemory, isLongTerm: boolean) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) return;
    
    setSaving(true);
    try {
      const endpoint = isLongTerm 
        ? `/api/memory/long-term/${memory.id}`
        : `/api/memory/short-term/${memory.id}`;
        
      const response = await fetch(endpoint, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (isLongTerm) {
          setLongTermMemories(prev => prev.filter(m => m.id !== memory.id));
        } else {
          setShortTermMemories(prev => prev.filter(m => m.id !== memory.id));
        }
        toast({ title: "Success", description: "Memory deleted successfully" });
      } else {
        throw new Error('Failed to delete memory');
      }
    } catch (error) {
      console.error('Error deleting memory:', error);
      toast({ title: "Error", description: "Failed to delete memory", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Helper to get user display with icon
  const getUserDisplay = (memory: ShortTermMemory | LongTermMemory) => {
    const isAI = memory.metadata?.auto_captured === true;
    
    if (isAI) {
      return (
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span>AI</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span>User</span>
        </div>
      );
    }
  };

  // Helper to format expiry time for short-term memories
  const formatExpiry = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const hoursLeft = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft < 0) return 'Expired';
    if (hoursLeft < 24) return `${hoursLeft}h left`;
    const daysLeft = Math.round(hoursLeft / 24);
    return `${daysLeft}d left`;
  };

  // Table render
  const renderTable = (memories: ShortTermMemory[] | LongTermMemory[], isLongTerm: boolean) => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <Loading />
        </div>
      );
    }

    return (
      <div className="h-full max-h-full overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm !m-0 !p-0">
        <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 !m-0 !p-0">
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
              <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Memory</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Tags</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Created By</TableHead>
              <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Date Created</TableHead>
              {!isLongTerm && <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Expires</TableHead>}
              <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memories && memories.length > 0 ? (
              memories.map((memory, idx) => {
                const tags = isLongTerm 
                  ? [(memory as LongTermMemory).category] 
                  : (memory as ShortTermMemory).tags || [];
                const dateCreated = isLongTerm 
                  ? (memory as LongTermMemory).created_at 
                  : (memory as ShortTermMemory).timestamp;
                
                return (
                  <TableRow key={memory.id} className={`transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900" : "bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                    <TableCell className="max-w-xs whitespace-pre-wrap align-top text-gray-900 dark:text-gray-100">
                      {memory.display_text || 'No content'}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1">
                        {tags && tags.length > 0 ? tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800">{tag}</Badge>
                        )) : <span className="text-gray-500 dark:text-gray-400">No tags</span>}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-gray-900 dark:text-gray-100">{getUserDisplay(memory)}</TableCell>
                    <TableCell className="align-top text-gray-700 dark:text-gray-300">{format(new Date(dateCreated), 'MMM dd, yyyy')}</TableCell>
                    {!isLongTerm && (
                      <TableCell className="align-top text-gray-700 dark:text-gray-300">
                        {formatExpiry((memory as ShortTermMemory).expires_at)}
                      </TableCell>
                    )}
                    <TableCell className="align-top">
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditModal(memory, isLongTerm)} className="hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => deleteMemory(memory, isLongTerm)} disabled={saving} className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={isLongTerm ? 5 : 6} className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No memories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <SparklesBackground />
      </div>
      {authEnabled === false && (
        <div className="fixed top-0 left-0 right-0 z-50 p-4">
          <AuthSetupBanner />
        </div>
      )}
      {/* Header at the very top */}
      <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      {/* Main area: sidebar and content side by side */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={toggleSidebar}
          onThreadSelect={handleThreadSelect}
          onNewChat={handleNewChat}
          activeThreadId={activeThreadId}
          threads={threads}
        />
        {/* Main content, centered horizontally */}
        <div className="flex-1 flex justify-center items-start min-h-0">
          <div className="max-w-[1100px] w-full bg-white dark:bg-black backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 h-[calc(80vh+16px)] flex flex-col min-h-0 mt-[105px]">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Memories</h1>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'short-term' | 'long-term')} className="flex-1 flex flex-col min-h-0 !m-0 !p-0">
              <div className="mb-6 flex items-center justify-between">
                <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-gray-100 dark:bg-gray-800 p-1 text-gray-600 dark:text-gray-400 w-fit">
                  <TabsTrigger value="short-term" className="w-[120px] justify-center bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 data-[state=active]:bg-white dark:data-[state=active]:bg-black text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 border-0 data-[state=active]:shadow-sm">Short Term</TabsTrigger>
                  <TabsTrigger value="long-term" className="w-[120px] justify-center bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 data-[state=active]:bg-white dark:data-[state=active]:bg-black text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 border-0 data-[state=active]:shadow-sm">Long Term</TabsTrigger>
                </TabsList>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 bg-white dark:bg-black border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"
                  onClick={openAddModal}
                  disabled={!user?.id || !authEnabled}
                >
                  <Plus className="w-4 h-4" />
                  Add Memory
                </Button>
              </div>
              <div className="flex-1 !m-0 !p-0">
                <TabsContent value="short-term" className="h-full !m-0 !p-0 !mt-0 !pt-0 !bg-transparent data-[state=active]:block data-[state=inactive]:hidden">
                  {renderTable(shortTermMemories, false)}
                </TabsContent>
                <TabsContent value="long-term" className="h-full !m-0 !p-0 !mt-0 !pt-0 !bg-transparent data-[state=active]:block data-[state=inactive]:hidden">
                  {renderTable(longTermMemories, true)}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Add Memory Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              Add {activeTab === 'short-term' ? 'Short Term' : 'Long Term'} Memory
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={addMemoryText}
              onChange={(e) => setAddMemoryText(e.target.value)}
              placeholder="Enter your memory..."
              className="min-h-[120px] bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              disabled={saving}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddModal} disabled={saving} className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
              Cancel
            </Button>
            <Button onClick={addMemory} disabled={saving || !addMemoryText?.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? 'Adding...' : 'Add Memory'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Memory Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">
              Edit Memory
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editMemoryText}
              onChange={(e) => setEditMemoryText(e.target.value)}
              placeholder="Edit your memory..."
              className="min-h-[120px] bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              disabled={saving}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal} disabled={saving} className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300">
              Cancel
            </Button>
            <Button onClick={saveEditedMemory} disabled={saving || !editMemoryText?.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}