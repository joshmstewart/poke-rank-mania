
import React, { useState, useEffect } from 'react';
import { useTrueSkillStore } from '@/stores/trueskillStore';
import { formatDistanceToNow } from 'date-fns';
import { Clock, ClockArrowUp } from 'lucide-react';

export const LastSyncDisplay = () => {
  const { lastSyncTime, syncInProgress } = useTrueSkillStore(state => ({
    lastSyncTime: state.lastSyncTime,
    syncInProgress: state.syncInProgress
  }));

  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const updateSyncTime = () => {
      if (lastSyncTime > 0) {
        setTimeAgo(formatDistanceToNow(new Date(lastSyncTime), { addSuffix: true }));
      }
    };

    updateSyncTime();
    interval = setInterval(updateSyncTime, 60000); // Update every minute

    return () => {
      clearInterval(interval);
    };
  }, [lastSyncTime]);

  if (syncInProgress) {
    return (
      <div className="flex items-center text-xs text-gray-500 animate-pulse">
        <ClockArrowUp className="h-3 w-3 mr-1" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (lastSyncTime === 0) {
    return (
      <div className="flex items-center text-xs text-gray-500">
        <Clock className="h-3 w-3 mr-1" />
        <span>Waiting for first sync...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-xs text-gray-500">
      <Clock className="h-3 w-3 mr-1" />
      <span>Last sync: {timeAgo}</span>
    </div>
  );
};
