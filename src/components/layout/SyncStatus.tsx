
import React from "react";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useTrueSkillStore } from "@/stores/trueskillStore";

const SyncStatus: React.FC = () => {
  const { lastSyncTimestamp, syncInProgress } = useTrueSkillStore();

  if (syncInProgress) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <Clock className="h-4 w-4 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (!lastSyncTimestamp) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <AlertCircle className="h-4 w-4" />
        <span>Not synced</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600">
      <CheckCircle className="h-4 w-4" />
      <span>Last synced: {lastSyncTimestamp}</span>
    </div>
  );
};

export default SyncStatus;
