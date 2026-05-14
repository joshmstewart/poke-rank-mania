
import React from "react";

interface TypeBadgeProps {
  type: string;
}

const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  const getTypeColor = (type: string): string => {
    const typeColors: Record<string, string> = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
    };
    
    return typeColors[type.toLowerCase()] || '#68A090';
  };

  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-semibold text-white capitalize ring-1 ring-black/20 shadow-sm"
      style={{
        backgroundColor: getTypeColor(type),
        textShadow: '0 1px 1px rgba(0,0,0,0.55)',
      }}
    >
      {type}
    </span>
  );
};

export default TypeBadge;
