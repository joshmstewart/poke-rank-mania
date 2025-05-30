
import React from 'react';
import { useImpliedBattleTracker } from '@/contexts/ImpliedBattleTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Trophy } from 'lucide-react';

interface ImpliedBattleValidatorProps {
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

const ImpliedBattleValidator: React.FC<ImpliedBattleValidatorProps> = ({
  isVisible = true,
  onToggleVisibility
}) => {
  const { impliedBattleRecords, clearRecords } = useImpliedBattleTracker();

  if (!isVisible) {
    return null;
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getBattleTypeColor = (battleType: string) => {
    switch (battleType) {
      case 'P_above_1':
      case 'P_above_2':
        return 'bg-red-100 text-red-800';
      case 'P_below_1':
      case 'P_below_2':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBattleTypeLabel = (battleType: string) => {
    switch (battleType) {
      case 'P_above_1':
        return 'Above (1)';
      case 'P_above_2':
        return 'Above (2)';
      case 'P_below_1':
        return 'Below (1)';
      case 'P_below_2':
        return 'Below (2)';
      default:
        return battleType;
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-80 overflow-hidden z-50 shadow-xl border-2 border-blue-200 bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Implied Battle Validator
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecords}
              className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
              title="Clear all records"
            >
              <X className="h-3 w-3" />
            </Button>
            {onToggleVisibility && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleVisibility}
                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                title="Hide validator"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Last 5 automatic TrueSkill updates from manual ranking
        </p>
      </CardHeader>
      <CardContent className="p-3 max-h-48 overflow-y-auto">
        {impliedBattleRecords.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-4">
            No implied battles recorded yet.
            <br />
            <span className="text-xs">Drag and drop Pokémon to see automatic TrueSkill updates.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {impliedBattleRecords.map((record) => (
              <div
                key={record.id}
                className="bg-gray-50 rounded-md p-2 border border-gray-200"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-xs text-gray-500 font-mono">
                    #{record.sequence} - {formatTimestamp(record.timestamp)}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getBattleTypeColor(record.battleType)}`}
                  >
                    {getBattleTypeLabel(record.battleType)}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="font-medium text-green-700">{record.winner}</span>
                  <span className="text-gray-600"> defeated </span>
                  <span className="font-medium text-red-700">
                    {record.winner === record.draggedPokemon ? record.opponent : record.draggedPokemon}
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  (Implied from manual rank)
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImpliedBattleValidator;
