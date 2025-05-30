
import React, { useState, useCallback, memo, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import PokemonInfo from "./PokemonInfo";
import LoadingOverlay from "./LoadingOverlay";
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";
import EnhancedTCGFallback from "./EnhancedTCGFallback";
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
  const [isHovered, setIsHovered] = useState(false);

  // Always try to load TCG card data
  const { tcgCard, isLoading: isLoadingTCG, hasTcgCard } = usePokemonTCGCard(pokemon.name, true);
  
  const displayName = pokemon.name;
  
  console.log(`🃏 [TCG_BATTLE_CARD] ${displayName}: TCG loading=${isLoadingTCG}, hasTcgCard=${hasTcgCard}, isProcessing=${isProcessing}`);

  // Log the image URL being used
  useEffect(() => {
    if (tcgCard) {
      console.log(`📷 [TCG_BATTLE_CARD] ${displayName}: Using SMALL image URL: ${tcgCard.images.small}`);
      console.log(`📷 [TCG_BATTLE_CARD] ${displayName}: Large image URL (NOT USED): ${tcgCard.images.large}`);
    }
  }, [tcgCard, displayName]);

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
    relative cursor-pointer transition-all duration-200 transform
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50 scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
    ${isHovered && !isSelected ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
  `.trim();

  // Determine what to show
  const showLoading = isLoadingTCG;
  const showTCGCard = !isLoadingTCG && hasTcgCard && tcgCard;
  const showFallback = !isLoadingTCG && !hasTcgCard;

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-pokemon-id={pokemon.id}
      data-pokemon-name={displayName}
      data-processing={isProcessing ? "true" : "false"}
    >
      <CardContent className="p-4 text-center relative">
        {/* Info Button */}
        <div className="absolute top-1 right-1 z-30">
          <PokemonInfoModal pokemon={pokemon}>
            <button 
              className="w-6 h-6 rounded-full bg-white/80 hover:bg-white border border-gray-300/60 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm"
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

        {/* Selection feedback overlay */}
        {isHovered && !isSelected && !isProcessing && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              Choose this Pokémon
            </div>
          </div>
        )}

        {isSelected && (
          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-20">
            Winner!
          </div>
        )}

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
                  onLoad={() => {
                    console.log(`✅ [TCG_BATTLE_CARD] ${displayName}: Small TCG image loaded successfully from: ${tcgCard.images.small}`);
                    setCardImageLoaded(true);
                  }}
                  onError={(e) => {
                    console.error(`🃏 [TCG_BATTLE_CARD] Failed to load TCG card SMALL image for ${displayName} from: ${tcgCard.images.small}`);
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
              
              {/* Pokemon Name and Type info below card - FIXED: Remove the 0 line */}
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-gray-800">{displayName}</h3>
                <p className="text-sm text-gray-600">#{pokemon.id}</p>
                
                {/* Always show type tags for consistency */}
                {pokemon.types && pokemon.types.length > 0 && (
                  <div className="flex justify-center gap-1 mt-2">
                    {pokemon.types.map((type, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                        {type}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Enhanced Fallback */}
          {showFallback && (
            <EnhancedTCGFallback pokemon={pokemon} />
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
