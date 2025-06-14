
import React, { useState, useCallback } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { formatDistanceToNow } from 'date-fns';
import { Cloud, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LastSyncDisplay = () => {
  const lastSyncTime = useTrueSkillStore(state => state.lastSyncTime);
  const [renderKey, setRenderKey] = useState(0);

  const forceRerender = useCallback(() => {
    console.log("Forcing re-render of LastSyncDisplay");
    setRenderKey(prev => prev + 1);
  }, []);

  const getSyncStatus = () => {
    console.log(`[LastSyncDisplay] Rendering with key ${renderKey}. lastSyncTime from store: ${lastSyncTime} (${lastSyncTime ? new Date(lastSyncTime).toISOString() : 'N/A'})`);
    if (!lastSyncTime) {
      return {
        text: 'Never synced',
        icon: <WifiOff className="h-4 w-4 text-yellow-500" />,
        textColor: 'text-yellow-600',
      };
    }
    const date = new Date(lastSyncTime);
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    
    const isRecent = (Date.now() - date.getTime()) < 5 * 60 * 1000;

    if (isRecent) {
        return {
            text: `Last sync: ${timeAgo}`,
            icon: <Cloud className="h-4 w-4 text-green-500" />,
            textColor: 'text-green-700',
        };
    }
    
    return {
        text: `Last sync: ${timeAgo}`,
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
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={forceRerender} title="Force refresh display">
                <RefreshCw className="h-3 w-3" />
            </Button>
        </div>
      </div>
    </div>
  );
};
