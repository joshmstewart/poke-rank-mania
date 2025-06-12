
import React from "react";
import { useCloudSync } from "@/hooks/useCloudSync";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import SyncStatus from "./SyncStatus";

export const HeaderSyncStatus: React.FC = () => {
  const { triggerManualSync, isAuthenticated } = useCloudSync();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container max-w-7xl mx-auto px-6 py-2">
        <div className="flex items-center justify-between">
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
      </div>
    </div>
  );
};
