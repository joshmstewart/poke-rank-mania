
import React from 'react';
import { Pokemon } from '@/services/pokemon';
import BattleCard from './BattleCard';
import { Button } from '@/components/ui/button';

interface PairBattleUIProps {
  pokemon: Pokemon[];
  onSelect: (id: number) => void;
  onGoBack: () => void;
  disabled?: boolean;
}

const PairBattleUI: React.FC<PairBattleUIProps> = ({ 
  pokemon, 
  onSelect, 
  onGoBack, 
  disabled = false 
}) => {
  if (!pokemon || pokemon.length !== 2) {
    return <div>Invalid battle pair</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {pokemon.map((poke) => (
        <div key={poke.id} className="flex flex-col items-center">
          <BattleCard
            pokemon={poke}
            onClick={() => onSelect(poke.id)}
            disabled={disabled}
          />
        </div>
      ))}
      <div className="col-span-1 md:col-span-2 flex justify-center mt-4">
        <Button 
          onClick={onGoBack} 
          variant="outline"
          disabled={disabled}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default PairBattleUI;
