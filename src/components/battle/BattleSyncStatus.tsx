
import React from "react";
import { useCloudSync } from "@/hooks/useCloudSync";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import SyncStatus from "@/components/layout/SyncStatus";

export const BattleSyncStatus: React.FC = () => {
  const { triggerManualSync, isAuthenticated } = useCloudSync();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Cloud Sync:</span>
        <SyncStatus />
      </div>
      
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
