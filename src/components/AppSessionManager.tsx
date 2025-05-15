
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Save } from "lucide-react";
import { toast } from "sonner";
import {
  loadUnifiedSessionData,
  saveUnifiedSessionData,
  importUnifiedSessionData
} from "@/services/pokemonService";

const AppSessionManager = () => {
  const [sessionId, setSessionId] = useState("");
  const [importValue, setImportValue] = useState("");
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  
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

  // Auto-save reminder
  useEffect(() => {
    // Show a toast when the component mounts to inform about auto-saving
    toast("Auto-save enabled", {
      description: "Your progress is automatically saved to your session ID"
    });
  }, []);
  
  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast("Session ID copied", {
      description: "Your session ID has been copied to clipboard"
    });
  };
  
  const handleImport = () => {
    try {
      if (!importValue) {
        throw new Error("No session ID provided");
      }
      
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
      
      // Load the existing session data
      const sessionData = loadUnifiedSessionData();
      
      // Update with the new session ID
      sessionData.sessionId = sessionIdToLoad;
      saveUnifiedSessionData(sessionData);
      
      // Update UI
      setSessionId(sessionIdToLoad);
      
      toast("Session loaded", {
        description: "Your session has been successfully loaded"
      });
      
      // Force a page reload to reflect the imported session
      window.location.reload();
    } catch (error) {
      toast("Import failed", {
        description: "Could not load session. Please check the ID format."
      });
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
            <Save className="h-4 w-4" /> Session
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Session</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            <div>
              <div className="text-sm text-muted-foreground mb-2">
                Your session is automatically saved as you make progress. To continue on another device, 
                save your unique Session ID:
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
            </div>
            
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">
                To load a previous session, paste your Session ID here:
              </div>
              
              <div className="flex items-center gap-2">
                <input 
                  className="w-full p-2 border rounded" 
                  value={importValue}
                  onChange={(e) => setImportValue(e.target.value)}
                  placeholder="Paste your Session ID here"
                />
                <Button 
                  onClick={handleImport}
                >
                  Load
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
