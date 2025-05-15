
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Download, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SessionManagerProps {
  onImport: (sessionData: string) => void;
  onExport: () => string;
}

const SessionManager: React.FC<SessionManagerProps> = ({ onImport, onExport }) => {
  const [sessionId, setSessionId] = useState("");
  const [importValue, setImportValue] = useState("");
  
  // Generate a random session ID if not already generated
  React.useEffect(() => {
    if (!sessionId) {
      const randomId = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);
      setSessionId(randomId);
    }
  }, [sessionId]);
  
  const handleExport = () => {
    try {
      const sessionData = onExport();
      const exportData = {
        id: sessionId,
        data: sessionData
      };
      
      const dataStr = JSON.stringify(exportData);
      toast({
        title: "Session data copied!",
        description: "Your session ID and data have been copied to clipboard."
      });
      
      navigator.clipboard.writeText(dataStr);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Could not export session data.",
        variant: "destructive"
      });
    }
  };
  
  const handleImport = () => {
    try {
      const importData = JSON.parse(importValue);
      if (importData && importData.data) {
        onImport(importData.data);
        setSessionId(importData.id || sessionId);
        toast({
          title: "Session imported!",
          description: "Your battle progress has been restored."
        });
      } else {
        throw new Error("Invalid session data");
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Could not import session data. Please check the format.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Upload className="h-4 w-4" /> Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Session Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Paste your previously exported session data below:
            </p>
            <textarea 
              className="w-full min-h-[150px] p-3 border rounded-md" 
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              placeholder='{"id":"abc123","data":"..."}'
            />
            <Button onClick={handleImport} className="w-full">Import Session</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Session Data</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Your unique session ID that allows you to continue your progress on another device:
            </p>
            <div className="flex items-center gap-2">
              <Input value={sessionId} readOnly />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  navigator.clipboard.writeText(sessionId);
                  toast({ title: "Copied!" });
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={handleExport} className="w-full">
              Copy Full Session Data to Clipboard
            </Button>
            <p className="text-sm text-muted-foreground">
              Save this data somewhere safe. You can import it later to continue your progress on any device.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionManager;
