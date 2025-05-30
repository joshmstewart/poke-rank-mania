
import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import PokemonInfo from "./PokemonInfo";
import LoadingOverlay from "./LoadingOverlay";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import Logo from "@/components/ui/Logo";

interface TCGBattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: BattleType;
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

const TCGBattleCard: React.FC<TCGBattleCardProps> = memo(({
  pokemon,
  isSelected,
  battleType,
  onSelect,
  isProcessing = false
}) => {
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickTimeRef = useRef(0);
  const [cardImageLoaded, setCardImageLoaded] = useState(false);

  // Always try to load TCG card data
  const { tcgCard, isLoading: isLoadingTCG, hasTcgCard } = usePokemonTCGCard(pokemon.name, true);
  
  const displayName = pokemon.name;
  
  console.log(`🃏 [TCG_BATTLE_CARD] ${displayName}: TCG loading=${isLoadingTCG}, hasTcgCard=${hasTcgCard}, isProcessing=${isProcessing}`);

  useEffect(() => {
    console.log(`🃏 [TCG_BATTLE_CARD] ${displayName}: Component mounted/updated`);
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, [displayName]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    console.log(`🖱️ [TCG_BATTLE_CARD] ${displayName}: Card clicked`);
    
    // Enhanced check for info button clicks
    const target = e.target as HTMLElement;
    const isInfoButtonClick = target.closest('[data-info-button]') || 
        target.closest('[role="dialog"]') || 
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-dialog-overlay]');
    
    if (isInfoButtonClick) {
      console.log(`ℹ️ [TCG_BATTLE_CARD] Info dialog interaction for ${displayName}, preventing card selection`);
      return;
    }

    const now = Date.now();
    
    // Prevent rapid double-clicks
    if (now - lastClickTimeRef.current < 300) {
      console.log(`🚫 [TCG_BATTLE_CARD] Ignoring rapid click on ${displayName}`);
      return;
    }
    
    lastClickTimeRef.current = now;
    
    console.log(`🖱️ [TCG_BATTLE_CARD] Click on ${displayName} (${pokemon.id}) - processing: ${isProcessing}`);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      onSelect(pokemon.id);
      clickTimeoutRef.current = null;
    }, 50);
  }, [pokemon.id, displayName, onSelect, isProcessing]);

  const cardClasses = `
    relative cursor-pointer transition-all duration-200 transform hover:scale-105 
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50' : 'hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
  `.trim();

  // Determine what to show
  const showLoading = isLoadingTCG;
  const showTCGCard = !isLoadingTCG && hasTcgCard && tcgCard;
  const showFallback = !isLoadingTCG && !hasTcgCard;

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
      data-pokemon-id={pokemon.id}
      data-pokemon-name={displayName}
      data-processing={isProcessing ? "true" : "false"}
    >
      <CardContent className="p-4 text-center relative">
        {/* Info Button */}
        <div className="absolute top-1 right-1 z-30">
          <PokemonInfoModal pokemon={pokemon}>
            <button 
              className="w-5 h-5 rounded-full bg-white/60 hover:bg-white/80 border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
              onClick={(e) => {
                console.log(`🔘 [TCG_BATTLE_CARD] ${displayName}: Info button clicked`);
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              i
            </button>
          </PokemonInfoModal>
        </div>

        <div className="relative">
          {/* Loading State */}
          {showLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-pulse">
                <Logo />
              </div>
              <p className="text-sm text-gray-600">Loading card...</p>
            </div>
          )}

          {/* TCG Card Display */}
          {showTCGCard && (
            <div className="space-y-3">
              <div className="relative">
                <img 
                  src={tcgCard.images.small} 
                  alt={tcgCard.name}
                  className={`w-full max-w-[200px] mx-auto rounded-lg shadow-md transition-opacity duration-300 ${
                    cardImageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setCardImageLoaded(true)}
                  onError={(e) => {
                    console.error(`🃏 [TCG_BATTLE_CARD] Failed to load TCG card image for ${displayName}`);
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                {!cardImageLoaded && showTCGCard && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-pulse">
                      <Logo />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Pokemon Name below card */}
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-800">{displayName}</h3>
                <p className="text-sm text-gray-600">#{pokemon.id}</p>
              </div>
            </div>
          )}

          {/* Fallback to regular Pokemon info */}
          {showFallback && (
            <div className="space-y-3">
              <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-sm text-gray-500">No TCG card</p>
              </div>
              
              <PokemonInfo 
                displayName={displayName}
                pokemonId={pokemon.id}
                types={pokemon.types}
              />
            </div>
          )}

          {/* Loading overlay that keeps content visible */}
          <LoadingOverlay isVisible={isProcessing} />
        </div>
      </CardContent>
    </Card>
  );
});

TCGBattleCard.displayName = "TCGBattleCard";

export default TCGBattleCard;
