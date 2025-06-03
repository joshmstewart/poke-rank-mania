
import React, { useMemo } from "react";

interface PokemonMilestoneImageProps {
  pokemon: { id: number; name: string; image: string };
  isDragging: boolean;
}

const PokemonMilestoneImage: React.FC<PokemonMilestoneImageProps> = ({
  pokemon,
  isDragging
}) => {
  return (
    <div className="flex-1 flex justify-center items-center px-2 pt-6 pb-1">
      <img 
        src={pokemon.image} 
        alt={pokemon.name}
        className={`w-20 h-20 object-contain transition-all duration-200 ${
          isDragging ? 'scale-110' : ''
        }`}
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
};

export default PokemonMilestoneImage;
