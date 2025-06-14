import { useState } from "react";
import { Header } from "@/components/chat/Header";
import { Sidebar } from "@/components/chat/Sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/use-auth";
import { SparklesBackground } from "@/components/ui/sparkles-background";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { Loading } from "@/components/ui/loading";
import { Pencil, Trash2, Save, X, User, Bot, Plus } from "lucide-react";
import { format } from "date-fns";

interface MemoryEntry {
  id: string;
  content: string;
  tags: string[];
  created_by: string;
  created_at: string;
  embedding?: number[];
}

// Mock user removed - will use actual authenticated user

// Initial empty state - memories will be loaded from database when auth is enabled
const INITIAL_SHORT_TERM: MemoryEntry[] = [];
const INITIAL_LONG_TERM: MemoryEntry[] = [];

export default function MemoryPage() {
  const { user, profile, authEnabled } = useAuth();
  const { toast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'short-term' | 'long-term'>('short-term');
  const [shortTermMemories, setShortTermMemories] = useState<MemoryEntry[]>(INITIAL_SHORT_TERM);
  const [longTermMemories, setLongTermMemories] = useState<MemoryEntry[]>(INITIAL_LONG_TERM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Sidebar toggle
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  // Inline edit handlers
  const startEdit = (entry: MemoryEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setEditTags(entry.tags.join(", "));
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
    setEditTags("");
  };

  // Save edit (update memory)
  const saveEdit = (entry: MemoryEntry, isLongTerm: boolean) => {
    setSaving(true);
    const updated = {
      ...entry,
      content: editContent,
      tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    if (isLongTerm) {
      setLongTermMemories((prev) => prev.map((m) => (m.id === entry.id ? updated : m)));
    } else {
      setShortTermMemories((prev) => prev.map((m) => (m.id === entry.id ? updated : m)));
    }
    toast({ title: "Memory updated", description: "Memory updated successfully." });
    cancelEdit();
    setSaving(false);
  };

  // Delete memory
  const deleteMemory = (entry: MemoryEntry, isLongTerm: boolean) => {
    if (!window.confirm("Are you sure you want to delete this memory?")) return;
    if (isLongTerm) {
      setLongTermMemories((prev) => prev.filter((m) => m.id !== entry.id));
    } else {
      setShortTermMemories((prev) => prev.filter((m) => m.id !== entry.id));
    }
    toast({ title: "Memory deleted", description: "Memory deleted successfully." });
  };

  // Helper to get user display with icon
  const getUserDisplay = (createdBy: string) => {
    // Check if this is an AI-generated memory (you can adjust this logic based on your needs)
    const isAI = createdBy === "ai" || createdBy === "system" || createdBy.includes("ai");
    
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

  // Table render
  const renderTable = (memories: MemoryEntry[], isLongTerm: boolean) => (
    <div className="h-full max-h-full overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm !m-0 !p-0">
      <Table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 !m-0 !p-0">
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Memory</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Tags</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Created By</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Date Created</TableHead>
            <TableHead className="text-gray-900 dark:text-gray-100 font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memories && memories.length > 0 ? (
            memories.map((entry, idx) => (
              <TableRow key={entry.id} className={`transition-colors ${idx % 2 === 0 ? "bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900" : "bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                <TableCell className="max-w-xs whitespace-pre-wrap align-top text-gray-900 dark:text-gray-100">
                  {editingId === entry.id ? (
                                          <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                        disabled={saving}
                      />
                  ) : (
                    entry.content
                  )}
                </TableCell>
                <TableCell className="align-top">
                  {editingId === entry.id ? (
                    <Input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
                      disabled={saving}
                      placeholder="Comma separated"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags && entry.tags.length > 0 ? entry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800">{tag}</Badge>
                      )) : <span className="text-gray-500 dark:text-gray-400">No tags</span>}
                    </div>
                  )}
                </TableCell>
                <TableCell className="align-top text-gray-900 dark:text-gray-100">{getUserDisplay(entry.created_by)}</TableCell>
                <TableCell className="align-top text-gray-700 dark:text-gray-300">{format(new Date(entry.created_at), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="align-top">
                  {editingId === entry.id ? (
                    <div className="flex gap-2">
                      <Button size="icon" variant="secondary" onClick={() => saveEdit(entry, isLongTerm)} disabled={saving} className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit} disabled={saving} className="hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(entry)} className="hover:bg-gray-100 dark:hover:bg-gray-900 text-gray-500 dark:text-gray-400">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => deleteMemory(entry, isLongTerm)} disabled={saving} className="bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400 py-8">
                No memories found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

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
          onThreadSelect={() => {}} // not used here
          onNewChat={() => {}} // not used here
          activeThreadId={null}
        />
        {/* Main content, centered horizontally */}
        <div className="flex-1 flex justify-center items-start min-h-0">
          <div className="max-w-[1100px] w-full bg-white dark:bg-black backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8 h-[calc(80vh+16px)] flex flex-col min-h-0 mt-[105px]">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Memories</h1>
            <Tabs defaultValue="short-term" className="flex-1 flex flex-col min-h-0 !m-0 !p-0">
              <div className="mb-6 flex items-center justify-between">
                <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-gray-100 dark:bg-gray-800 p-1 text-gray-600 dark:text-gray-400 w-fit">
                  <TabsTrigger value="short-term" className="w-[120px] justify-center bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 data-[state=active]:bg-white dark:data-[state=active]:bg-black text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 border-0 data-[state=active]:shadow-sm">Short Term</TabsTrigger>
                  <TabsTrigger value="long-term" className="w-[120px] justify-center bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 data-[state=active]:bg-white dark:data-[state=active]:bg-black text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 border-0 data-[state=active]:shadow-sm">Long Term</TabsTrigger>
                </TabsList>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 bg-white dark:bg-black border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"
                  onClick={() => {
                    // Add memory functionality will go here
                    toast({ title: "Add Memory", description: "Add memory functionality coming soon!" });
                  }}
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
    </div>
  );
} 