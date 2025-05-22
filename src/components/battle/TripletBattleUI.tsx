
import React, { useState } from 'react';
import { Pokemon } from '@/services/pokemon';
import BattleCard from './BattleCard';
import { Button } from '@/components/ui/button';

interface TripletBattleUIProps {
  pokemon: Pokemon[];
  onSelect: (ids: number[]) => void;
  onGoBack: () => void;
  disabled?: boolean;
}

const TripletBattleUI: React.FC<TripletBattleUIProps> = ({
  pokemon,
  onSelect,
  onGoBack,
  disabled = false
}) => {
  const [selected, setSelected] = useState<number[]>([]);

  if (!pokemon || pokemon.length !== 3) {
    return <div>Invalid battle triplet</div>;
  }

  const handleSelect = (id: number) => {
    if (disabled) return;
    
    if (selected.includes(id)) {
      setSelected(selected.filter(pokemonId => pokemonId !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const handleSubmit = () => {
    if (selected.length > 0) {
      onSelect(selected);
      setSelected([]);
    }
  };

  return (
    <div className="flex flex-col items-center mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {pokemon.map((poke) => (
          <div key={poke.id} className="flex flex-col items-center">
            <BattleCard
              pokemon={poke}
              onClick={() => handleSelect(poke.id)}
              selected={selected.includes(poke.id)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-8">
        <Button 
          onClick={onGoBack} 
          variant="outline"
          disabled={disabled}
        >
          Go Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={selected.length === 0 || disabled}
        >
          Submit Selection
        </Button>
      </div>
    </div>
  );
};

export default TripletBattleUI;
