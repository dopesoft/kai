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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { WavyBackground } from "@/components/ui/wavy-background";
import { SparklesCore } from "@/components/ui/sparkles";
import { useAuth } from "@/lib/auth-context";

// Add interface for integration type
interface Integration {
  id: string;
  type: "CALENDAR" | "MAIL" | "AI";
  name: string;
  provider?: string;
  account: string;
  status: string;
  icon?: string;
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user, profile, signOut, updateProfile, refreshProfile, loading, authEnabled, session } = useAuth();
  
  // Debug: Log current auth state
  console.log('Settings - Auth State:', {
    user: user ? 'exists' : 'null',
    profile: profile ? 'exists' : 'null',
    loading,
    authEnabled,
    session: session ? 'exists' : 'null'
  });
  
  const [activeTab, setActiveTab] = useState("profile");
  
  // Original profile form data - keeping the existing fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [biography, setBiography] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Legacy integration states
  const [chatgptKey, setChatgptKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
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

  // Get real integrations based on what's actually configured and tested
  const getConfiguredIntegrations = () => {
    const integrations = [];
    
    // Only show integrations that have been tested and verified
    const verifiedIntegrations = JSON.parse(localStorage.getItem("verified_integrations") || "[]");
    
    return verifiedIntegrations;
  };

  const [integrations, setIntegrations] = useState(getConfiguredIntegrations());
  const [testingIntegration, setTestingIntegration] = useState(false);

  // Load profile data when component mounts or profile changes
  useEffect(() => {
    if (profile) {
      // Map Supabase profile to existing form fields
      const fullName = profile.full_name || "";
      const nameParts = fullName.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      
      // Use kai_persona for biography if it's a string, otherwise use description field
      let bioText = "";
      if (profile.kai_persona) {
        if (typeof profile.kai_persona === 'string') {
          bioText = profile.kai_persona;
        } else if (profile.kai_persona.description) {
          bioText = profile.kai_persona.description;
        }
      }
      setBiography(bioText);
      
      // Set website from profile_image_url for now (or we could add a separate website field to DB)
      setWebsite(profile.profile_image_url || "");
      
      // Username could be derived from email
      setUsername(user?.email?.split("@")[0] || "");
    }
  }, [profile, user]);

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
    
    // Clean up any old mock integrations and refresh
    setIntegrations(getConfiguredIntegrations());
  }, []);

  // Update integrations when API keys change
  useEffect(() => {
    setIntegrations(getConfiguredIntegrations());
  }, [chatgptKey]);

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
          max_tokens: 10
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
    setTestingIntegration(true);
    
    let isConnected = false;
    
    if (provider === "openai") {
      isConnected = await testOpenAIConnection(apiKey, model || "gpt-4o");
    } else if (provider === "claude") {
      isConnected = await testClaudeConnection(apiKey, model || "claude-3-5-sonnet-20241022");
    } else if (provider === "gemini") {
      isConnected = await testGeminiConnection(apiKey, model || "gemini-1.5-pro");
    }
    
    if (isConnected) {
      const newIntegration = {
        id: provider,
        type: type,
        name: name,
        provider: provider,
        account: "API Key verified",
        status: "CONNECTED",
        icon: provider === "openai" ? "🤖" : provider === "claude" ? "🧠" : "💎"
      };
      
      // Save to verified integrations
      const verifiedIntegrations = JSON.parse(localStorage.getItem("verified_integrations") || "[]");
      const existingIndex = verifiedIntegrations.findIndex((i: any) => i.provider === provider);
      
      if (existingIndex >= 0) {
        verifiedIntegrations[existingIndex] = newIntegration;
      } else {
        verifiedIntegrations.push(newIntegration);
      }
      
      localStorage.setItem("verified_integrations", JSON.stringify(verifiedIntegrations));
      setIntegrations(verifiedIntegrations);
      
      // Save API keys and model for the specific provider
      if (provider === "openai") {
        localStorage.setItem("chatgpt_api_key", apiKey);
        localStorage.setItem("chatgpt_model", model || "gpt-4o");
        setChatgptKey(apiKey);
        setSelectedModel(model || "gpt-4o");
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
  const removeIntegration = (integrationId: string) => {
    const verifiedIntegrations = JSON.parse(localStorage.getItem("verified_integrations") || "[]");
    const filteredIntegrations = verifiedIntegrations.filter((i: any) => i.id !== integrationId);
    localStorage.setItem("verified_integrations", JSON.stringify(filteredIntegrations));
    setIntegrations(filteredIntegrations);
    
    // Also clear related localStorage keys
    if (integrationId === "openai") {
      localStorage.removeItem("chatgpt_api_key");
      localStorage.removeItem("chatgpt_model");
      setChatgptKey("");
      setSelectedModel("gpt-4o");
    }
    
    toast({
      title: "Integration removed",
      description: "The integration has been disconnected and removed.",
    });
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

  const handleEditIntegration = (integration: Integration) => {
    setEditingIntegration(integration);
    setEditFormData({
      apiKey: integration.type === "AI" ? chatgptKey : "",
      email: integration.account || "",
      model: integration.type === "AI" ? selectedModel : "",
      calendarUrl: ""
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (editingIntegration?.type === "AI" && editingIntegration?.provider === "openai") {
      // Save to localStorage first
      localStorage.setItem("chatgpt_api_key", editFormData.apiKey);
      localStorage.setItem("chatgpt_model", editFormData.model);
      setChatgptKey(editFormData.apiKey);
      setSelectedModel(editFormData.model);
      
      // Test and verify the connection
      const isConnected = await saveAndVerifyIntegration(
        "AI",
        "openai", 
        "OpenAI",
        editFormData.apiKey,
        editFormData.model
      );
      
      if (isConnected) {
        setIsEditModalOpen(false);
        setEditingIntegration(null);
      }
    }
  };

  const renderIntegrationCard = (integration: Integration) => (
    <Card key={integration.id} className="bg-white dark:bg-black border-gray-300 dark:border-white hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1">{integration.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{integration.account}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-black border-gray-300 dark:border-white">
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
      className="bg-white dark:bg-black border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
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

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 relative">
      {/* Sparkles Background */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          background="transparent"
          minSize={0.4}
          maxSize={1}
          particleDensity={120}
          className="w-full h-full"
          particleColor="#000000"
        />
        <div className="dark:block hidden absolute inset-0">
          <SparklesCore
            background="transparent"
            minSize={0.4}
            maxSize={1}
            particleDensity={120}
            className="w-full h-full"
            particleColor="#ffffff"
          />
        </div>
      </div>
      
      <div className="bg-white dark:bg-black border-2 border-black dark:border-white rounded-lg shadow-xl w-full max-w-6xl mx-auto relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Header with Tabs / Mobile Dropdown */}
          <div className="border-b border-gray-200 dark:border-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
              
              {/* Desktop Tabs */}
              {!isMobile && (
                <div className="absolute left-1/2 transform -translate-x-1/2">
                  <TabsList className="grid grid-cols-3 bg-gray-100 dark:bg-white">
                    <TabsTrigger 
                      value="profile" 
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:text-black text-sm px-3 py-1"
                    >
                      <Check className="w-3 h-3" />
                      Profile
                    </TabsTrigger>
                    <TabsTrigger 
                      value="integrations" 
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:text-black text-sm px-3 py-1"
                    >
                      <Database className="w-3 h-3" />
                      Integrations
                    </TabsTrigger>
                    <TabsTrigger 
                      value="settings" 
                      className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-black dark:data-[state=active]:bg-black dark:data-[state=active]:text-white dark:text-black text-sm px-3 py-1"
                    >
                      <Cloud className="w-3 h-3" />
                      Settings
                    </TabsTrigger>
                  </TabsList>
                </div>
              )}

              {/* Mobile Dropdown */}
              {isMobile && (
                <div className="absolute left-1/2 transform -translate-x-1/2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 bg-gray-100 dark:bg-white border-gray-300 dark:border-white text-black dark:text-black px-4 py-2">
                        {activeTab === "profile" && (
                          <>
                            <Check className="w-3 h-3" />
                            Profile
                          </>
                        )}
                        {activeTab === "integrations" && (
                          <>
                            <Database className="w-3 h-3" />
                            Integrations
                          </>
                        )}
                        {activeTab === "settings" && (
                          <>
                            <Cloud className="w-3 h-3" />
                            Settings
                          </>
                        )}
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="bg-white dark:bg-black border-gray-300 dark:border-white">
                      <DropdownMenuItem 
                        onClick={() => setActiveTab("profile")}
                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setActiveTab("integrations")}
                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <Database className="w-3 h-3" />
                        Integrations
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setActiveTab("settings")}
                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <Cloud className="w-3 h-3" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Background Image with Wavy Effect */}
          <div className="relative h-20 overflow-hidden">
            <WavyBackground
              className="w-full h-full"
              containerClassName="w-full h-full"
              colors={["#000000", "#00ff41", "#ffffff", "#00bfff"]}
              waveWidth={30}
              backgroundFill="transparent"
              speed="slow"
              waveOpacity={0.3}
            />
          </div>

          {/* Avatar */}
          <div className="relative -mt-10 mb-6 flex justify-center">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white dark:border-black shadow-lg">
                <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                <AvatarFallback className="bg-gray-200 dark:bg-white text-gray-600 dark:text-black text-lg font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 bg-white dark:bg-black border border-gray-300 dark:border-white shadow-sm hover:bg-gray-50 dark:hover:bg-gray-900 p-0"
              >
                <Camera className="w-4 h-4 text-gray-600 dark:text-white" />
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6 h-[500px] overflow-y-auto">
            <div>
              <TabsContent value="profile" className="space-y-4 mt-0">
                {/* 2-Column Layout for Profile Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {/* First Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                        First Name
                      </label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white"
                        placeholder="Enter your first name"
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                        Last Name
                      </label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                        Username
                      </label>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white"
                        placeholder="Enter your username"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                        Website
                      </label>
                      <Input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white"
                        placeholder="Enter your website URL"
                      />
                    </div>
                  </div>
                </div>

                {/* Biography - Full Width */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Biography
                  </label>
                  <Textarea
                    value={biography}
                    onChange={(e) => setBiography(e.target.value)}
                    placeholder="Write a short biography..."
                    className="w-full resize-none bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
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
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    onClick={handleProfileSave}
                    disabled={profileLoading}
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    {profileLoading ? "Saving..." : "Save Profile"}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Clear all local storage and force reload
                        localStorage.clear();
                        window.location.href = '/auth';
                      }}
                      className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20 text-sm px-3 py-1"
                    >
                      Force Clear
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="integrations" className="space-y-8 mt-0">
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
                  <DialogContent className="bg-white dark:bg-black border-gray-300 dark:border-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-white">
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
                  <DialogContent className="bg-white dark:bg-black border-gray-300 dark:border-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-white">
                        Setup {selectedAIProvider === "openai" ? "OpenAI GPT" : selectedAIProvider === "claude" ? "Anthropic Claude" : "Google Gemini"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Connect your AI service by providing an API key. We'll test the connection to ensure it works.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                            API Key
                          </label>
                          <Input
                            type="password"
                            value={editFormData.apiKey}
                            onChange={(e) => setEditFormData({...editFormData, apiKey: e.target.value})}
                            placeholder={selectedAIProvider === "openai" ? "sk-..." : selectedAIProvider === "claude" ? "sk-ant-..." : "AIza..."}
                            className="w-full font-mono bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                          />
                        </div>
                        {selectedAIProvider === "openai" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                              Model
                            </label>
                            <Select value={editFormData.model} onValueChange={(value) => setEditFormData({...editFormData, model: value})}>
                              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white">
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black border-gray-300 dark:border-white">
                                <SelectItem value="gpt-4o" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">GPT-4o (Recommended)</SelectItem>
                                <SelectItem value="gpt-4o-mini" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">GPT-4o Mini</SelectItem>
                                <SelectItem value="gpt-4-turbo" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">GPT-4 Turbo</SelectItem>
                                <SelectItem value="gpt-3.5-turbo" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">GPT-3.5 Turbo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {selectedAIProvider === "claude" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                              Model
                            </label>
                            <Select value={editFormData.model} onValueChange={(value) => setEditFormData({...editFormData, model: value})}>
                              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white">
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black border-gray-300 dark:border-white">
                                <SelectItem value="claude-3-5-sonnet-20241022" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Claude 3.5 Sonnet (Recommended)</SelectItem>
                                <SelectItem value="claude-3-opus-20240229" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Claude 3 Opus</SelectItem>
                                <SelectItem value="claude-3-haiku-20240307" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Claude 3 Haiku</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {selectedAIProvider === "gemini" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                              Model
                            </label>
                            <Select value={editFormData.model} onValueChange={(value) => setEditFormData({...editFormData, model: value})}>
                              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white">
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black border-gray-300 dark:border-white">
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
                            className="border-gray-300 dark:border-white text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
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
                            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
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
                  <DialogContent className="bg-white dark:bg-black border-gray-300 dark:border-white max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-gray-900 dark:text-white">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                              Model
                            </label>
                            <Select value={editFormData.model} onValueChange={(value) => setEditFormData({...editFormData, model: value})}>
                              <SelectTrigger className="w-full bg-white dark:bg-black border-gray-300 dark:border-white text-black dark:text-white">
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black border-gray-300 dark:border-white">
                                <SelectItem value="gpt-4o" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">GPT-4o (Recommended)</SelectItem>
                                <SelectItem value="gpt-4o-mini" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">GPT-4o Mini</SelectItem>
                                <SelectItem value="claude-3-opus" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Claude 3 Opus</SelectItem>
                                <SelectItem value="claude-3-sonnet" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Claude 3 Sonnet</SelectItem>
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
                          className="border-gray-300 dark:border-white text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
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
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-0">
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <p>General settings coming soon...</p>
                </div>
              </TabsContent>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-white">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="border-gray-300 dark:border-white text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              Save changes
            </Button>
          </div>
        </Tabs>
      </div>
    </div>
  );
}