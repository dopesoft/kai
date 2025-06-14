import { useState, useEffect } from "react";
import { X, Camera, Check, Mail, Calendar, Cloud, Database, MoreVertical, Plus, Brain, ChevronDown, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { SparklesBackground } from "@/components/ui/sparkles-background";
import { AuthSetupBanner } from "@/components/auth/AuthSetupBanner";
import { Header } from "@/components/chat/Header";
import { Sidebar } from "@/components/chat/Sidebar";
import { useAuth } from "@/lib/use-auth";
import { integrationService, type Integration } from "@/lib/integrations";

// Integration interface is now imported from integrations service

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user, profile, signOut, updateProfile, refreshProfile, loading, authEnabled, session } = useAuth();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeThreadId] = useState<string | null>(null);
  const threads: any[] = [];
  
  // Original profile form data - keeping the existing fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [biography, setBiography] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Legacy integration states
  const [chatgptKey, setChatgptKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("o4-mini");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"CALENDAR" | "MAIL" | "AI">("CALENDAR");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [isAISetupModalOpen, setIsAISetupModalOpen] = useState(false);
  const [selectedAIProvider, setSelectedAIProvider] = useState<"openai" | "claude" | "gemini" | null>(null);
  const [editFormData, setEditFormData] = useState({
    apiKey: "",
    email: "",
    model: "",
    calendarUrl: ""
  });
  
  // Track original profile values to detect changes
  const [originalProfile, setOriginalProfile] = useState({
    firstName: "",
    lastName: "",
    username: "",
    website: "",
    biography: ""
  });

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [testingIntegration, setTestingIntegration] = useState(false);
  const [loadingIntegrations, setLoadingIntegrations] = useState(true);

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile) {
      // Map Supabase profile to existing form fields
      const fullName = profile.full_name || "";
      const nameParts = fullName.split(" ");
      const firstNameValue = nameParts[0] || "";
      const lastNameValue = nameParts.slice(1).join(" ") || "";
      
      // Use kai_persona for biography if it's a string, otherwise use description field
      let bioText = "";
      if (profile.kai_persona) {
        if (typeof profile.kai_persona === 'string') {
          bioText = profile.kai_persona;
        } else if (profile.kai_persona.description) {
          bioText = profile.kai_persona.description;
        }
      }
      
      const websiteValue = profile.profile_image_url || "";
      const usernameValue = user?.email?.split("@")[0] || "";
      
      // Set current values
      setFirstName(firstNameValue);
      setLastName(lastNameValue);
      setBiography(bioText);
      setWebsite(websiteValue);
      setUsername(usernameValue);
      
      // Store original values
      setOriginalProfile({
        firstName: firstNameValue,
        lastName: lastNameValue,
        username: usernameValue,
        website: websiteValue,
        biography: bioText
      });
    }
  }, [profile, user]);

  // Load integrations from database when component mounts
  useEffect(() => {
    const loadIntegrations = async () => {
      if (user && authEnabled) {
        setLoadingIntegrations(true);
        try {
          // First, migrate any existing localStorage integrations
          await integrationService.migrateFromLocalStorage(user.id);
          
          // Then load all integrations from database
          const dbIntegrations = await integrationService.getIntegrations(user.id);
          
          // Transform database integrations to match UI format
          const transformedIntegrations = dbIntegrations.map(dbInt => ({
            id: dbInt.id || dbInt.provider,
            type: dbInt.type,
            name: dbInt.provider === 'openai' ? 'OpenAI' : 
                  dbInt.provider === 'claude' ? 'Anthropic Claude' : 
                  dbInt.provider === 'gemini' ? 'Google Gemini' : dbInt.provider,
            provider: dbInt.provider,
            account: dbInt.config?.model || 'Default',
            status: dbInt.api_key ? 'CONNECTED' : 'ERROR',
            icon: dbInt.provider === 'openai' ? '🤖' : 
                  dbInt.provider === 'claude' ? '🧠' : 
                  dbInt.provider === 'gemini' ? '💎' : '🔗',
            hasError: !dbInt.api_key && dbInt.api_key_error
          }));
          
          setIntegrations(transformedIntegrations);
        } catch (error) {
          console.error('Failed to load integrations:', error);
          toast({
            title: "Error",
            description: "Failed to load integrations",
            variant: "destructive"
          });
        } finally {
          setLoadingIntegrations(false);
        }
      }
    };
    
    loadIntegrations();
  }, [user, authEnabled]);

  // Handle profile save - map form fields back to Supabase
  const handleProfileSave = async () => {
    if (!user) return;
    
    try {
      setProfileLoading(true);
      
      const fullName = `${firstName} ${lastName}`.trim();
      
      await updateProfile({
        full_name: fullName,
        phone: profile?.phone || "", // Keep existing phone
        profile_image_url: website, // Store website in this field for now
        kai_persona: { description: biography } // Store biography in persona
      });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      // Refresh profile to update sidebar
      await refreshProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      // AuthGuard will automatically redirect to /auth when user becomes null
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out.",
        variant: "destructive",
      });
    }
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("chatgpt_api_key");
    const savedModel = localStorage.getItem("chatgpt_model");
    
    if (savedApiKey) {
      setChatgptKey(savedApiKey);
    }
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  // Test OpenAI API connection
  const testOpenAIConnection = async (apiKey: string, model: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Test connection' }],
          max_completion_tokens: 10
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Test Claude API connection
  const testClaudeConnection = async (apiKey: string, model: string) => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test connection' }]
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Test Gemini API connection
  const testGeminiConnection = async (apiKey: string, model: string) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Test connection' }]
          }]
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Save and verify integration
  const saveAndVerifyIntegration = async (type: string, provider: string, name: string, apiKey: string, model?: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save integrations",
        variant: "destructive"
      });
      return false;
    }
    
    setTestingIntegration(true);
    
    let isConnected = false;
    
    // Test the connection
    if (provider === "openai") {
      isConnected = await testOpenAIConnection(apiKey, model || "o4-mini");
    } else if (provider === "claude") {
      isConnected = await testClaudeConnection(apiKey, model || "claude-3-5-sonnet-20241022");
    } else if (provider === "gemini") {
      isConnected = await testGeminiConnection(apiKey, model || "gemini-1.5-pro");
    }
    
    if (isConnected) {
      try {
        // Check if integration already exists
        const existingIntegrations = await integrationService.getIntegrations(user.id);
        const existing = existingIntegrations.find(i => i.provider === provider);
        
        if (existing) {
          // Update existing integration
          await integrationService.updateIntegration(existing.id!, user.id, {
            api_key: apiKey,
            config: { model: model },
            is_active: true
          });
        } else {
          // Create new integration
          await integrationService.createIntegration({
            user_id: user.id,
            type: type as 'AI' | 'CALENDAR' | 'MAIL',
            provider: provider,
            api_key: apiKey,
            config: { model: model },
            is_active: true
          });
        }
        
        // Reload integrations from database
        const updatedIntegrations = await integrationService.getIntegrations(user.id);
        const transformedIntegrations = updatedIntegrations.map(dbInt => ({
          id: dbInt.id || dbInt.provider,
          type: dbInt.type,
          name: dbInt.provider === 'openai' ? 'OpenAI' : 
                dbInt.provider === 'claude' ? 'Anthropic Claude' : 
                dbInt.provider === 'gemini' ? 'Google Gemini' : dbInt.provider,
          provider: dbInt.provider,
          account: dbInt.config?.model || 'Default',
          status: 'CONNECTED',
          icon: dbInt.provider === 'openai' ? '🤖' : 
                dbInt.provider === 'claude' ? '🧠' : 
                dbInt.provider === 'gemini' ? '💎' : '🔗'
        }));
        
        setIntegrations(transformedIntegrations);
        
        // Also update localStorage for backward compatibility
        if (provider === "openai") {
          localStorage.setItem("chatgpt_api_key", apiKey);
          localStorage.setItem("chatgpt_model", model || "o4-mini");
          setChatgptKey(apiKey);
          setSelectedModel(model || "o4-mini");
        } else if (provider === "claude") {
          localStorage.setItem("claude_api_key", apiKey);
          localStorage.setItem("claude_model", model || "claude-3-5-sonnet-20241022");
        } else if (provider === "gemini") {
          localStorage.setItem("gemini_api_key", apiKey);
          localStorage.setItem("gemini_model", model || "gemini-1.5-pro");
        }
        
        toast({
          title: "Integration connected",
          description: `${name} has been successfully connected and verified.`,
        });
      } catch (error) {
        console.error('Failed to save integration:', error);
        toast({
          title: "Error",
          description: "Failed to save integration to database",
          variant: "destructive"
        });
        setTestingIntegration(false);
        return false;
      }
    } else {
      toast({
        title: "Connection failed",
        description: `Unable to connect to ${name}. Please check your API key and try again.`,
        variant: "destructive"
      });
    }
    
    setTestingIntegration(false);
    return isConnected;
  };

  // Remove integration
  const removeIntegration = async (integrationId: string) => {
    if (!user) return;
    
    try {
      const integration = integrations.find(i => i.id === integrationId);
      if (!integration) return;
      
      // Delete from database
      const success = await integrationService.deleteIntegration(integrationId, user.id);
      
      if (success) {
        // Reload integrations
        const updatedIntegrations = await integrationService.getIntegrations(user.id);
        const transformedIntegrations = updatedIntegrations.map(dbInt => ({
          id: dbInt.id || dbInt.provider,
          type: dbInt.type,
          name: dbInt.provider === 'openai' ? 'OpenAI' : 
                dbInt.provider === 'claude' ? 'Anthropic Claude' : 
                dbInt.provider === 'gemini' ? 'Google Gemini' : dbInt.provider,
          provider: dbInt.provider,
          account: dbInt.config?.model || 'Default',
          status: 'CONNECTED',
          icon: dbInt.provider === 'openai' ? '🤖' : 
                dbInt.provider === 'claude' ? '🧠' : 
                dbInt.provider === 'gemini' ? '💎' : '🔗'
        }));
        
        setIntegrations(transformedIntegrations);
        
        // Also clear related localStorage keys for backward compatibility
        if (integration.provider === "openai") {
          localStorage.removeItem("chatgpt_api_key");
          localStorage.removeItem("chatgpt_model");
          setChatgptKey("");
          setSelectedModel("o4-mini");
        } else if (integration.provider === "claude") {
          localStorage.removeItem("claude_api_key");
          localStorage.removeItem("claude_model");
        } else if (integration.provider === "gemini") {
          localStorage.removeItem("gemini_api_key");
          localStorage.removeItem("gemini_model");
        }
        
        toast({
          title: "Integration removed",
          description: "The integration has been disconnected and removed.",
        });
      } else {
        throw new Error('Failed to delete integration');
      }
    } catch (error) {
      console.error('Failed to remove integration:', error);
      toast({
        title: "Error",
        description: "Failed to remove integration",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    setLocation("/");
  };

  const handleSave = async () => {
    // Save API settings to localStorage
    localStorage.setItem("chatgpt_api_key", chatgptKey);
    localStorage.setItem("chatgpt_model", selectedModel);
    
    // Also save profile data to Supabase if user is logged in
    if (user && activeTab === "profile") {
      await handleProfileSave();
    } else {
      toast({
        title: "Settings saved",
        description: "Your API settings have been saved locally in your browser.",
      });
      
      setLocation("/");
    }
  };

  const characterCount = biography.length;
  const maxCharacters = 160;
  const charactersLeft = maxCharacters - characterCount;
  
  // Check if profile has been modified
  const hasProfileChanged = () => {
    return firstName !== originalProfile.firstName ||
           lastName !== originalProfile.lastName ||
           username !== originalProfile.username ||
           website !== originalProfile.website ||
           biography !== originalProfile.biography;
  };

  // Helper functions
  const groupIntegrationsByType = () => {
    const grouped = {
      CALENDAR: integrations.filter((i: Integration) => i.type === "CALENDAR"),
      MAIL: integrations.filter((i: Integration) => i.type === "MAIL"), 
      AI: integrations.filter((i: Integration) => i.type === "AI")
    };
    return grouped;
  };

  const handleAddIntegration = (type: "CALENDAR" | "MAIL" | "AI") => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleAIProviderSelect = (provider: "openai" | "claude" | "gemini") => {
    setSelectedAIProvider(provider);
    setIsModalOpen(false);
    setIsAISetupModalOpen(true);
    // Reset form data for new setup
    setEditFormData({ apiKey: "", email: "", model: "", calendarUrl: "" });
  };

  const handleEditIntegration = async (integration: Integration) => {
    setEditingIntegration(integration);
    
    // Load the current values from database
    if (user && integration.provider) {
      const dbIntegration = await integrationService.getIntegrationByProvider(user.id, integration.provider);
      if (dbIntegration) {
        setEditFormData({
          apiKey: dbIntegration.api_key || "",
          email: integration.account || "",
          model: dbIntegration.config?.model || "",
          calendarUrl: ""
        });
      }
    }
    
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingIntegration || !user) return;
    
    if (editingIntegration.type === "AI" && editingIntegration.provider) {
      // Test and verify the connection
      const isConnected = await saveAndVerifyIntegration(
        "AI",
        editingIntegration.provider, 
        editingIntegration.name,
        editFormData.apiKey,
        editFormData.model
      );
      
      if (isConnected) {
        setIsEditModalOpen(false);
        setEditingIntegration(null);
        setEditFormData({ apiKey: "", email: "", model: "", calendarUrl: "" });
      }
    }
  };

  const renderIntegrationCard = (integration: Integration) => (
    <Card key={integration.id} className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{integration.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{integration.account}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-black border-gray-200 dark:border-gray-700">
              <DropdownMenuItem 
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => handleEditIntegration(integration)}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => removeIntegration(integration.id)}
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex justify-end">
          <Badge 
            variant={integration.status === "CONNECTED" ? "default" : "secondary"}
            className={`text-xs ${
              integration.status === "CONNECTED" 
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700" 
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700"
            }`}
          >
            {integration.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  const renderAddIntegrationCard = (type: "CALENDAR" | "MAIL" | "AI") => (
    <Card 
      className="bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
      onClick={() => handleAddIntegration(type)}
    >
      <CardContent className="p-4 flex items-center justify-center min-h-[120px]">
        <div className="text-center">
          <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Add {type.toLowerCase()} integration</p>
        </div>
      </CardContent>
    </Card>
  );

  // Get user's initials for avatar
  const getUserInitials = () => {
    if (!firstName && !lastName) return "U";
    const firstInitial = firstName?.[0] || '';
    const lastInitial = lastName?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase() || "U";
  };

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
      <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} onNewChat={handleNewChat} />
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
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">Settings</h1>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 !m-0 !p-0">
              <div className="mb-6 flex items-center justify-between">
                <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-gray-100 dark:bg-gray-800 p-1 text-gray-600 dark:text-gray-400 w-fit">
                  <TabsTrigger value="profile" className="w-[120px] justify-center bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 data-[state=active]:bg-white dark:data-[state=active]:bg-black text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 border-0 data-[state=active]:shadow-sm">Profile</TabsTrigger>
                  <TabsTrigger value="integrations" className="w-[120px] justify-center bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 data-[state=active]:bg-white dark:data-[state=active]:bg-black text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 border-0 data-[state=active]:shadow-sm">Integrations</TabsTrigger>
                  <TabsTrigger value="settings" className="w-[120px] justify-center bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 data-[state=active]:bg-white dark:data-[state=active]:bg-black text-gray-700 dark:text-gray-300 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100 border-0 data-[state=active]:shadow-sm">Settings</TabsTrigger>
                </TabsList>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 bg-white dark:bg-black border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"
                  onClick={handleClose}
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>

              <div className="flex-1 !m-0 !p-0">
                <TabsContent value="profile" className="h-full !m-0 !p-0 !mt-0 !pt-0 !bg-transparent data-[state=active]:block data-[state=inactive]:hidden">
                  <div className="h-full overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm !m-0 !p-6">
                    {/* Avatar Section */}
                    <div className="mb-8 flex justify-center">
                      <div className="relative">
                        <Avatar className="w-24 h-24 border-4 border-gray-200 dark:border-gray-700 shadow-lg">
                          <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                          <AvatarFallback className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 text-2xl font-semibold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="sm"
                          className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900 p-0"
                        >
                          <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* 2-Column Layout for Profile Fields */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
                        placeholder="Enter your first name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username
                      </label>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
                        placeholder="Enter your username"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Website
                      </label>
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
                        placeholder="Enter your website URL"
                      />
                    </div>
                  </div>
                </div>

                {/* Biography - Full Width */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Biography
                  </label>
                  <Textarea
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    placeholder="Write a short biography..."
                    className="w-full resize-none bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-gray-300 dark:focus:border-gray-600 transition-colors"
                    rows={4}
                    maxLength={maxCharacters}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {characterCount}/{maxCharacters}
                    </span>
                    <span className={`text-xs ${charactersLeft >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {charactersLeft >= 0 ? `${charactersLeft} characters left` : `${Math.abs(charactersLeft)} characters over limit`}
                    </span>
                  </div>
                </div>

                {/* Save Profile Button */}
                <div className="flex justify-end mt-8">
                  <Button
                    onClick={handleProfileSave}
                    disabled={profileLoading || !hasProfileChanged()}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:hover:bg-gray-400"
                  >
                    {profileLoading ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
                  </div>
                </TabsContent>

                <TabsContent value="integrations" className="h-full !m-0 !p-0 !mt-0 !pt-0 !bg-transparent data-[state=active]:block data-[state=inactive]:hidden">
                  <div className="h-full overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm !m-0 !p-6">
                {(() => {
                  const grouped = groupIntegrationsByType();
                  
                  return (
                    <>
                      {/* AI Integrations */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Brain className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Integrations</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {grouped.AI.map((integration: Integration) => renderIntegrationCard(integration))}
                          {renderAddIntegrationCard("AI")}
                        </div>
                      </div>

                      {/* Mail Integrations */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mail Integrations</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {grouped.MAIL.map((integration: Integration) => renderIntegrationCard(integration))}
                          {renderAddIntegrationCard("MAIL")}
                        </div>
                      </div>

                      {/* Calendar Integrations */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calendar Integrations</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {grouped.CALENDAR.map((integration: Integration) => renderIntegrationCard(integration))}
                          {renderAddIntegrationCard("CALENDAR")}
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Add Integration Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-gray-100">
                        Add {modalType.charAt(0) + modalType.slice(1).toLowerCase()} Integration
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {modalType === "CALENDAR" && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Connect your calendar to sync events and schedule meetings directly from the chat.
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <Button variant="outline" className="justify-start h-12 border-gray-300 dark:border-gray-600">
                              <span className="mr-3">🗓️</span>
                              Google Calendar
                            </Button>
                            <Button variant="outline" className="justify-start h-12 border-gray-300 dark:border-gray-600">
                              <span className="mr-3">📅</span>
                              Outlook Calendar
                            </Button>
                            <Button variant="outline" className="justify-start h-12 border-gray-300 dark:border-gray-600">
                              <span className="mr-3">🍎</span>
                              Apple Calendar
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {modalType === "MAIL" && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Connect your email to send messages and manage communications from the chat interface.
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <Button variant="outline" className="justify-start h-12 border-gray-300 dark:border-gray-600">
                              <span className="mr-3">📧</span>
                              Gmail
                            </Button>
                            <Button variant="outline" className="justify-start h-12 border-gray-300 dark:border-gray-600">
                              <span className="mr-3">📮</span>
                              Outlook Mail
                            </Button>
                            <Button variant="outline" className="justify-start h-12 border-gray-300 dark:border-gray-600">
                              <span className="mr-3">📬</span>
                              Apple Mail
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {modalType === "AI" && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Add AI models to enhance your chat experience with different capabilities and perspectives.
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            <Button 
                              variant="outline" 
                              className="justify-start h-12 border-gray-300 dark:border-gray-600"
                              onClick={() => handleAIProviderSelect("openai")}
                            >
                              <span className="mr-3">🤖</span>
                              OpenAI GPT
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-start h-12 border-gray-300 dark:border-gray-600"
                              onClick={() => handleAIProviderSelect("claude")}
                            >
                              <span className="mr-3">🧠</span>
                              Anthropic Claude
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-start h-12 border-gray-300 dark:border-gray-600"
                              onClick={() => handleAIProviderSelect("gemini")}
                            >
                              <span className="mr-3">💎</span>
                              Google Gemini
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* AI Provider Setup Modal */}
                <Dialog open={isAISetupModalOpen} onOpenChange={setIsAISetupModalOpen}>
                  <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-gray-100">
                        Setup {selectedAIProvider === "openai" ? "OpenAI GPT" : selectedAIProvider === "claude" ? "Anthropic Claude" : "Google Gemini"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Connect your AI service by providing an API key. We'll test the connection to ensure it works.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            API Key
                          </label>
                          <Input
                            type="password"
                            value={editFormData.apiKey}
                            onChange={(e) => setEditFormData({...editFormData, apiKey: e.target.value})}
                            placeholder={selectedAIProvider === "openai" ? "sk-..." : selectedAIProvider === "claude" ? "sk-ant-..." : "AIza..."}
                            className="w-full font-mono bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                          />
                        </div>
                        {selectedAIProvider === "openai" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Model
                            </label>
                            <Select value={editFormData.model} onValueChange={(value) => setEditFormData({...editFormData, model: value})}>
                              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black border-gray-300 dark:border-gray-700">
                                <SelectItem value="o3-mini" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">o3-mini</SelectItem>
                                <SelectItem value="o4-mini" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">o4-mini (Recommended)</SelectItem>
                                <SelectItem value="gpt-4.1" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">GPT-4.1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {selectedAIProvider === "claude" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Model
                            </label>
                            <Select value={editFormData.model} onValueChange={(value) => setEditFormData({...editFormData, model: value})}>
                              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black border-gray-300 dark:border-gray-700">
                                <SelectItem value="claude-3-5-sonnet-20241022" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Claude 3.5 Sonnet (Recommended)</SelectItem>
                                <SelectItem value="claude-3-opus-20240229" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Claude 3 Opus</SelectItem>
                                <SelectItem value="claude-3-haiku-20240307" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Claude 3 Haiku</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {selectedAIProvider === "gemini" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Model
                            </label>
                            <Select value={editFormData.model} onValueChange={(value) => setEditFormData({...editFormData, model: value})}>
                              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black border-gray-300 dark:border-gray-700">
                                <SelectItem value="gemini-1.5-pro" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Gemini 1.5 Pro (Recommended)</SelectItem>
                                <SelectItem value="gemini-1.5-flash" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Gemini 1.5 Flash</SelectItem>
                                <SelectItem value="gemini-1.0-pro" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Gemini 1.0 Pro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="flex justify-end gap-3 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsAISetupModalOpen(false)}
                            className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                            disabled={testingIntegration}
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={async () => {
                              if (editFormData.apiKey && editFormData.model && selectedAIProvider) {
                                const providerName = selectedAIProvider === "openai" ? "OpenAI" : selectedAIProvider === "claude" ? "Anthropic Claude" : "Google Gemini";
                                const isConnected = await saveAndVerifyIntegration(
                                  "AI",
                                  selectedAIProvider,
                                  providerName,
                                  editFormData.apiKey,
                                  editFormData.model
                                );
                                if (isConnected) {
                                  setIsAISetupModalOpen(false);
                                  setSelectedAIProvider(null);
                                  setEditFormData({ apiKey: "", email: "", model: "", calendarUrl: "" });
                                }
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={testingIntegration || !editFormData.apiKey || !editFormData.model}
                          >
                            {testingIntegration ? "Testing..." : "Connect & Test"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Integration Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-gray-100">
                        Edit {editingIntegration?.name} Settings
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {editingIntegration?.type === "AI" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                              API Key
                            </label>
                            <Input
                              type="password"
                              value={editFormData.apiKey}
                              onChange={(e) => setEditFormData({...editFormData, apiKey: e.target.value})}
                              placeholder="sk-..."
                              className="w-full font-mono bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Model
                            </label>
                            <Select value={editFormData.model} onValueChange={(value) => setEditFormData({...editFormData, model: value})}>
                              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black border-gray-300 dark:border-gray-700">
                                <SelectItem value="o3-mini" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">o3-mini</SelectItem>
                                <SelectItem value="o4-mini" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">o4-mini (Recommended)</SelectItem>
                                <SelectItem value="gpt-4.1" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">GPT-4.1</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                      {editingIntegration?.type === "MAIL" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                              Email Address
                            </label>
                            <Input
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                              placeholder="user@example.com"
                              className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                              API Key
                            </label>
                            <Input
                              type="password"
                              value={editFormData.apiKey}
                              onChange={(e) => setEditFormData({...editFormData, apiKey: e.target.value})}
                              placeholder="Enter your email service API key"
                              className="w-full font-mono bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                      )}

                      {editingIntegration?.type === "CALENDAR" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                              Account Email
                            </label>
                            <Input
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                              placeholder="user@example.com"
                              className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                              Calendar URL or API Key
                            </label>
                            <Input
                              type="password"
                              value={editFormData.calendarUrl}
                              onChange={(e) => setEditFormData({...editFormData, calendarUrl: e.target.value})}
                              placeholder="Enter calendar URL or API key"
                              className="w-full font-mono bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditModalOpen(false)}
                          className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSaveEdit}
                          className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="h-full !m-0 !p-0 !mt-0 !pt-0 !bg-transparent data-[state=active]:block data-[state=inactive]:hidden">
                  <div className="h-full overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-black shadow-sm !m-0 !p-6">
                    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                      <p>General settings coming soon...</p>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}