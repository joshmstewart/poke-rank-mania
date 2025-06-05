
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useImpliedBattleTracker } from '@/contexts/ImpliedBattleTracker';

const AutoBattleLogsModal: React.FC = () => {
  const { impliedBattles } = useImpliedBattleTracker();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          View Auto Battle Logs ({impliedBattles.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auto Battle Logs (Latest 6)</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {impliedBattles.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No auto battles recorded yet
            </div>
          ) : (
            impliedBattles.map((battle) => (
              <div key={battle.id} className="bg-gray-50 rounded p-3 border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Battle #{battle.sequence}</span>
                  <span className="text-xs text-gray-500">{battle.timestamp}</span>
                </div>
                <div className="text-sm">
                  <div className="mb-1">
                    <strong>Winner:</strong> {battle.winner}
                  </div>
                  <div className="mb-1">
                    <strong>Opponent:</strong> {battle.opponent}
                  </div>
                  <div className="mb-1">
                    <strong>Dragged Pokemon:</strong> {battle.draggedPokemon}
                  </div>
                  <div className="text-xs text-gray-600">
                    <strong>Type:</strong> {battle.battleType}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoBattleLogsModal;
