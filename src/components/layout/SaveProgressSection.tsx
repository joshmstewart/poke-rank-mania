
import React from "react";
import { useCloudSync } from "@/hooks/useCloudSync";
import { Button } from "@/components/ui/button";
import { Save, RefreshCw } from "lucide-react";
import SyncStatus from "./SyncStatus";

export const SaveProgressSection: React.FC = () => {
  const { triggerManualSync, isAuthenticated } = useCloudSync();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Sign in to sync</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Sync Status Display */}
      <SyncStatus />
      
      {/* Manual Sync Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={triggerManualSync}
        className="flex items-center gap-2 h-8 text-sm px-4"
      >
        <RefreshCw className="h-4 w-4" />
        Manual Sync
      </Button>
    </div>
  );
};
