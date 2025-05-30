
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Save, Cloud, CloudOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCloudSync } from "@/hooks/useCloudSync";
import {
  loadUnifiedSessionData,
  saveUnifiedSessionData,
  importUnifiedSessionData
} from "@/services/pokemonService";

const AppSessionManager = () => {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState("");
  const [importValue, setImportValue] = useState("");
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { saveSessionToCloud, loadSessionFromCloud } = useCloudSync();
  
  // Check if we're in the Lovable editor environment
  const isInEditor = window.location.hostname === 'localhost' || 
                    window.location.hostname.includes('lovable.app') ||
                    window.location.hostname.includes('lovable.dev');
  
  // Generate a random session ID if not already generated or load from storage
  useEffect(() => {
    const sessionData = loadUnifiedSessionData();
    
    if (sessionData.sessionId) {
      setSessionId(sessionData.sessionId);
    } else {
      const randomId = Math.random().toString(36).substring(2, 8) + 
                      Math.random().toString(36).substring(2, 8);
      setSessionId(randomId);
      
      // Save the new session ID
      saveUnifiedSessionData({
        ...sessionData,
        sessionId: randomId
      });
    }
  }, []);

  // Auto-save to cloud when session data changes (only if not in editor)
  useEffect(() => {
    // Skip cloud saving if we're in the editor environment
    if (isInEditor) {
      console.log("Cloud saving disabled in editor environment");
      return;
    }

    const saveToCloud = async () => {
      if (!sessionId) return;
      
      setIsUploading(true);
      const sessionData = loadUnifiedSessionData();
      const success = await saveSessionToCloud(sessionId, sessionData);
      
      if (success) {
        console.log("Session automatically saved to cloud");
      }
      setIsUploading(false);
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveToCloud, 2000);
    return () => clearTimeout(timeoutId);
  }, [sessionId, saveSessionToCloud, isInEditor]);
  
  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    if (isInEditor) {
      toast("Session ID copied", {
        description: "Your session ID has been copied to clipboard (cloud saving disabled in editor)"
      });
    } else {
      toast("Session ID copied", {
        description: "Your session ID has been copied to clipboard and is saved in the cloud"
      });
    }
  };
  
  const handleImport = async () => {
    if (!importValue) {
      toast("No session ID provided", {
        description: "Please enter a session ID to load"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Check if this is a full JSON session data or just an ID
      let sessionIdToLoad = importValue.trim();
      
      // Try parsing as JSON in case it's full session data
      try {
        const parsedData = JSON.parse(importValue);
        if (parsedData.sessionId) {
          sessionIdToLoad = parsedData.sessionId;
        }
      } catch (e) {
        // Not valid JSON, assume it's just a session ID
      }
      
      // Load session data from cloud (only if not in editor)
      let cloudSessionData = null;
      if (!isInEditor) {
        cloudSessionData = await loadSessionFromCloud(sessionIdToLoad);
      }
      
      if (cloudSessionData) {
        // Load the existing session data
        const sessionData = loadUnifiedSessionData();
        
        // Update with the new session ID and cloud data
        // Ensure cloudSessionData is a valid object before spreading
        const updatedSessionData = {
          ...sessionData,
          sessionId: sessionIdToLoad,
          // Only spread if cloudSessionData is a plain object
          ...(cloudSessionData && typeof cloudSessionData === 'object' && !Array.isArray(cloudSessionData) ? cloudSessionData : {})
        };
        
        saveUnifiedSessionData(updatedSessionData);
        
        // Update UI
        setSessionId(sessionIdToLoad);
        
        toast("Session loaded from cloud", {
          description: "Your session has been successfully loaded from the cloud"
        });
        
        // Force a page reload to reflect the imported session
        window.location.reload();
      } else {
        // Try local fallback (old behavior)
        const sessionData = loadUnifiedSessionData();
        sessionData.sessionId = sessionIdToLoad;
        saveUnifiedSessionData(sessionData);
        setSessionId(sessionIdToLoad);
        
        const description = isInEditor 
          ? "Session ID updated (cloud features disabled in editor)"
          : "Session ID updated. Note: No cloud data found for this ID.";
        
        toast("Session ID updated", {
          description
        });
        
        window.location.reload();
      }
    } catch (error) {
      toast("Import failed", {
        description: "Could not load session. Please check the ID format."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user is signed in, show cloud sync status
  if (user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <Cloud className="h-3 w-3" />
              <span className="hidden sm:inline">Synced</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Your progress is being saved to the cloud</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // If user is not signed in, show combined save progress button
  return (
    <div className="flex items-center gap-2">
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1 h-8"
                >
                  <div className="relative">
                    <CloudOff className="h-4 w-4 text-muted-foreground" />
                    {!isInEditor && isUploading && (
                      <Cloud className="h-2 w-2 absolute -top-1 -right-1 text-blue-500 animate-pulse" />
                    )}
                  </div>
                  <span className="hidden sm:inline text-xs">Save Progress</span>
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sign in to save your progress to the cloud, or save/load session data</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CloudOff className="h-5 w-5" />
              Save Your Progress
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Sign in option */}
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-start gap-3">
                <Cloud className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">Save to Cloud (Recommended)</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Sign in to automatically save your progress and access it from any device.
                  </p>
                  <AuthDialog>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Sign In to Save Progress
                    </Button>
                  </AuthDialog>
                </div>
              </div>
            </div>

            {/* Session ID option */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <Save className="h-5 w-5 text-gray-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Local Session</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {isInEditor 
                      ? "Your session is stored locally in the editor. Use your Session ID to transfer progress."
                      : "Your session is saved locally. Use your Session ID to access from other devices."
                    }
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input 
                        className="w-full p-2 border rounded text-sm" 
                        value={sessionId} 
                        readOnly 
                      />
                      <Button 
                        variant="outline"
                        size="sm" 
                        onClick={handleCopySessionId}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {isInEditor ? (
                        <span className="text-orange-600">Local session (editor mode)</span>
                      ) : (
                        <>
                          {isUploading ? "Saving..." : "Saved locally"}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Load session option */}
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">
                Load a session from another device:
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  className="w-full p-2 border rounded text-sm" 
                  value={importValue}
                  onChange={(e) => setImportValue(e.target.value)}
                  placeholder="Enter Session ID"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleImport}
                  disabled={isLoading}
                  size="sm"
                >
                  {isLoading ? "Loading..." : "Load"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppSessionManager;
