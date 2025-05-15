
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Download, Upload, Save } from "lucide-react";
import { toast } from "sonner";
import {
  exportUnifiedSessionData,
  importUnifiedSessionData,
  loadUnifiedSessionData,
  saveUnifiedSessionData
} from "@/services/pokemonService";

const AppSessionManager = () => {
  const [sessionId, setSessionId] = useState("");
  const [importValue, setImportValue] = useState("");
  const [lastSaved, setLastSaved] = useState(Date.now());
  
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
  
  const handleManualSave = () => {
    try {
      const sessionData = loadUnifiedSessionData();
      // Just update the timestamp to show it was manually saved
      saveUnifiedSessionData({
        ...sessionData,
        lastManualSave: Date.now()
      });
      
      setLastSaved(Date.now());
      
      toast("Session saved", {
        description: "Your session data has been manually saved"
      });
    } catch (error) {
      toast("Save failed", {
        description: "Could not save session data"
      });
    }
  };
  
  const handleExport = () => {
    try {
      const sessionData = exportUnifiedSessionData();
      
      // Create downloadable file
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(sessionData);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `pokemon-session-${sessionId}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      toast("Session exported", {
        description: "Your session data has been exported to a file"
      });
    } catch (error) {
      toast("Export failed", {
        description: "Could not export session data"
      });
    }
  };
  
  const handleImport = () => {
    try {
      if (!importValue) {
        throw new Error("No data provided");
      }
      
      const success = importUnifiedSessionData(importValue);
      
      if (success) {
        // Reload the session ID from the imported data
        const sessionData = loadUnifiedSessionData();
        if (sessionData.sessionId) {
          setSessionId(sessionData.sessionId);
        }
        
        toast("Session imported", {
          description: "Your session data has been successfully imported"
        });
        
        // Force a page reload to reflect the imported data
        window.location.reload();
      } else {
        throw new Error("Invalid session data");
      }
    } catch (error) {
      toast("Import failed", {
        description: "Could not import session data. Please check the format."
      });
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Copy className="h-4 w-4" /> Session ID: {sessionId.substring(0, 6)}...
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Session ID</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Your unique session ID that identifies all your rankings and progress:
            </p>
            <div className="flex items-center gap-2">
              <input 
                className="w-full p-2 border rounded" 
                value={sessionId} 
                readOnly 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  navigator.clipboard.writeText(sessionId);
                  toast("Copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Save this ID somewhere safe. You can use it later to continue your progress on another device.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-1" 
        onClick={handleManualSave}
      >
        <Save className="h-4 w-4" /> Save
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-1" 
        onClick={handleExport}
      >
        <Download className="h-4 w-4" /> Export
      </Button>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Upload className="h-4 w-4" /> Load
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Paste your previously saved session data below:
            </p>
            <textarea 
              className="w-full min-h-[150px] p-3 border rounded-md" 
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              placeholder='Paste your exported session data here'
            />
            <Button onClick={handleImport} className="w-full">Import Session</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppSessionManager;
