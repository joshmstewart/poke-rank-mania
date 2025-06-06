
import React from 'react';
import { Star } from 'lucide-react';

interface PriorityStarButtonProps {
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}

export const PriorityStarButton: React.FC<PriorityStarButtonProps> = ({
  isSelected,
  onClick,
  className = ""
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        relative p-1 rounded-full transition-all duration-300 hover:scale-110
        ${isSelected 
          ? 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse' 
          : 'text-gray-400 hover:text-yellow-400'
        }
        ${className}
      `}
      title={isSelected ? "Remove from priority battles" : "Add to priority battles"}
    >
      <Star
        className={`w-5 h-5 transition-all duration-300 ${
          isSelected ? 'fill-yellow-500 stroke-yellow-600' : 'fill-none stroke-current'
        }`}
      />
      {isSelected && (
        <div className="absolute inset-0 rounded-full bg-yellow-500/20 animate-ping" />
      )}
    </button>
  );
};
