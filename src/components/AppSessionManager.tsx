
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Save, Cloud } from "lucide-react";
import { toast } from "sonner";
import { useCloudSync } from "@/hooks/useCloudSync";
import {
  loadUnifiedSessionData,
  saveUnifiedSessionData,
  importUnifiedSessionData
} from "@/services/pokemonService";

const AppSessionManager = () => {
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
  
  return (
    <div className="flex items-center gap-2">
      <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
          >
            <div className="relative">
              <Save className="h-4 w-4" />
              {!isInEditor && isUploading && (
                <Cloud className="h-2 w-2 absolute -top-1 -right-1 text-blue-500 animate-pulse" />
              )}
            </div>
            Session
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Your {isInEditor ? "Local" : "Cloud"} Session
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                {isInEditor 
                  ? "Your session is stored locally in the editor. Cloud saving is disabled to prevent test data from being saved."
                  : "Your session is automatically saved to the cloud as you make progress. Use your Session ID to access your data from any device:"
                }
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  className="w-full p-2 border rounded" 
                  value={sessionId} 
                  readOnly 
                />
                <Button 
                  variant="outline"
                  size="icon" 
                  onClick={handleCopySessionId}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs mt-1 flex items-center gap-1">
                {isInEditor ? (
                  <span className="text-orange-600">Local session (editor mode)</span>
                ) : (
                  <>
                    <Cloud className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">
                      {isUploading ? "Saving to cloud..." : "Saved to cloud"}
                    </span>
                  </>
                )}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">
                {isInEditor 
                  ? "To load a session from the cloud (when deployed), enter your Session ID:"
                  : "To access your session from another device, enter your Session ID:"
                }
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  className="w-full p-2 border rounded" 
                  value={importValue}
                  onChange={(e) => setImportValue(e.target.value)}
                  placeholder="Enter your Session ID"
                  disabled={isLoading}
                />
                <Button 
                  onClick={handleImport}
                  disabled={isLoading}
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
