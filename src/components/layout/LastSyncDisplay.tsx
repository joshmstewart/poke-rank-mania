
import React from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { format } from 'date-fns';
import { Cloud, WifiOff, Loader2 } from 'lucide-react';

export const LastSyncDisplay = () => {
  const lastSyncTime = useTrueSkillStore(state => state.lastSyncTime);
  const syncInProgress = useTrueSkillStore(state => state.syncInProgress);

  if (syncInProgress) {
    return (
      <div className="bg-gray-50 border-b border-gray-200 w-full">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center h-8 text-xs font-medium">
              <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Syncing...</span>
              </div>
          </div>
        </div>
      </div>
    );
  }

  const getSyncStatus = () => {
    if (!lastSyncTime) {
      return {
        text: 'Never synced',
        icon: <WifiOff className="h-4 w-4 text-yellow-500" />,
        textColor: 'text-yellow-600',
      };
    }
    const date = new Date(lastSyncTime);
    const formattedTime = format(date, 'h:mm:ss a');
    
    // Consider a sync recent if it was in the last 5 minutes
    const isRecent = (Date.now() - date.getTime()) < 5 * 60 * 1000;

    if (isRecent) {
        return {
            text: `Last sync: ${formattedTime}`,
            icon: <Cloud className="h-4 w-4 text-green-500" />,
            textColor: 'text-green-700',
        };
    }
    
    return {
        text: `Last sync: ${formattedTime}`,
        icon: <Cloud className="h-4 w-4 text-gray-400" />,
        textColor: 'text-gray-500',
    };
  };

  const { text, icon, textColor } = getSyncStatus();

  return (
    <div className="bg-gray-50 border-b border-gray-200 w-full">
      <div className="container max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center h-8 text-xs font-medium">
            <div className={`flex items-center gap-2 ${textColor}`}>
                {icon}
                <span>{text}</span>
            </div>
        </div>
      </div>
    </div>
  );
};
