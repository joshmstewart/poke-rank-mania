
import React from 'react';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const CloudSyncButton: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <Cloud className="h-3 w-3" />
              <span className="hidden sm:inline">Synced</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Your progress is being saved to the cloud</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <AuthDialog>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <CloudOff className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">Save Progress</span>
            </Button>
          </AuthDialog>
        </TooltipTrigger>
        <TooltipContent>
          <p>Sign in to save your progress and access it from anywhere</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
