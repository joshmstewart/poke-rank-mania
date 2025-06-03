
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AutoBattleLogsModal: React.FC = () => {
  // EXPLICIT NOTE: ImpliedBattleTracker has been permanently removed
  // This component now shows a deprecated message instead of logs
  const impliedBattles: any[] = [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          View Auto Battle Logs (Deprecated)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auto Battle Logs (Deprecated)</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="text-gray-500 text-center py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="font-medium text-yellow-800">Feature Deprecated</p>
              <p className="text-yellow-700 mt-1">
                Auto battle logs have been permanently removed. Manual drag-and-drop now uses direct TrueSkill updates instead.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoBattleLogsModal;
