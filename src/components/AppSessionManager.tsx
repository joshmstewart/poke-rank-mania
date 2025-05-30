
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

  // Auto-save to cloud when session data changes
  useEffect(() => {
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
  }, [sessionId, saveSessionToCloud]);
  
  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast("Session ID copied", {
      description: "Your session ID has been copied to clipboard and is saved in the cloud"
    });
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
      
      // Load session data from cloud
      const cloudSessionData = await loadSessionFromCloud(sessionIdToLoad);
      
      if (cloudSessionData) {
        // Load the existing session data
        const sessionData = loadUnifiedSessionData();
        
        // Update with the new session ID and cloud data
        const updatedSessionData = {
          ...sessionData,
          ...cloudSessionData,
          sessionId: sessionIdToLoad
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
        
        toast("Session ID updated", {
          description: "Session ID updated. Note: No cloud data found for this ID."
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
              {isUploading && (
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
              Your Cloud Session
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Your session is automatically saved to the cloud as you make progress. 
                Use your Session ID to access your data from any device:
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
              
              <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Cloud className="h-3 w-3" />
                {isUploading ? "Saving to cloud..." : "Saved to cloud"}
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">
                To access your session from another device, enter your Session ID:
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
