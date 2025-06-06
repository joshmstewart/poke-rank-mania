
import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import { 
  useTCGBattleCardState, 
  useTCGImageModeListener, 
  useTCGCleanupEffect 
} from "./tcg/TCGBattleCardHooks";
import TCGBattleCardContent from "./tcg/TCGBattleCardContent";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PokemonModalContent from "@/components/pokemon/PokemonModalContent";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";

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
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    clickTimeoutRef,
    lastClickTimeRef,
    isHovered,
    setIsHovered,
    currentImageMode,
    setCurrentImageMode
  } = useTCGBattleCardState();

  const { tcgCard, isLoading: isLoadingTCG, hasTcgCard } = usePokemonTCGCard(pokemon.name, true);
  const displayName = pokemon.name;
  
  // Hooks for modal content - match manual mode approach
  const { flavorText, isLoadingFlavor } = usePokemonFlavorText(pokemon.id, isOpen);
  const { tcgCard: modalTcgCard, secondTcgCard, isLoading: modalIsLoadingTCG, error: tcgError, hasTcgCard: modalHasTcgCard } = usePokemonTCGCard(pokemon.name, isOpen);
  
  console.log(`🃏 [TCG_BATTLE_CARD] ${displayName}: TCG loading=${isLoadingTCG}, hasTcgCard=${hasTcgCard}, isProcessing=${isProcessing}`);

  useTCGImageModeListener(setCurrentImageMode);
  useTCGCleanupEffect(displayName, clickTimeoutRef);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    console.log(`🖱️ [INFO_BUTTON_DEBUG] TCGBattleCard ${displayName}: Card clicked`);
    
    // Check for info button clicks - match manual mode approach
    const target = e.target as HTMLElement;
    const isInfoButtonClick = target.closest('[data-info-button="true"]') || 
        target.closest('[data-radix-dialog-content]') ||
        target.closest('[data-radix-dialog-overlay]') ||
        target.closest('[role="dialog"]');
    
    if (isInfoButtonClick) {
      console.log(`ℹ️ [INFO_BUTTON_DEBUG] TCGBattleCard: Info dialog interaction for ${displayName}, preventing card selection`);
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    const now = Date.now();
    
    // Prevent rapid double-clicks
    if (now - lastClickTimeRef.current < 300) {
      console.log(`🚫 TCGBattleCard: Ignoring rapid click on ${displayName}`);
      return;
    }
    
    lastClickTimeRef.current = now;
    
    console.log(`🖱️ TCGBattleCard: Click on ${displayName} (${pokemon.id}) - processing: ${isProcessing}`);
    
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    clickTimeoutRef.current = setTimeout(() => {
      onSelect(pokemon.id);
      clickTimeoutRef.current = null;
    }, 50);
  }, [pokemon.id, displayName, onSelect, isProcessing]);

  const handleMouseEnter = React.useCallback(() => {
    console.log(`🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Mouse enter - isProcessing: ${isProcessing}`);
    if (!isProcessing) {
      setIsHovered(true);
    }
  }, [isProcessing, displayName, setIsHovered]);

  const handleMouseLeave = React.useCallback(() => {
    console.log(`🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Mouse leave`);
    setIsHovered(false);
  }, [displayName, setIsHovered]);

  const shouldShowHover = isHovered && !isSelected && !isProcessing && !isLoadingTCG;

  const cardClasses = `
    relative cursor-pointer transition-all duration-200 transform group
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50 scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
    ${shouldShowHover ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
  `.trim();

  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Determine what content to show in modal - match manual mode
  const showLoading = modalIsLoadingTCG;
  const showTCGCards = !modalIsLoadingTCG && modalHasTcgCard && modalTcgCard !== null;
  const showFallbackInfo = !modalIsLoadingTCG && !modalHasTcgCard;

  return (
    <Card 
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-pokemon-id={pokemon.id}
      data-pokemon-name={displayName}
      data-processing={isProcessing ? "true" : "false"}
      data-hovered={shouldShowHover ? "true" : "false"}
    >
      <CardContent className="p-4 text-center relative">
        {/* Info Button - exact copy from manual mode */}
        <div className="absolute top-1 right-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button 
                className="w-5 h-5 rounded-full bg-white/80 hover:bg-white border border-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center text-xs font-medium shadow-sm transition-all duration-200 backdrop-blur-sm cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`Info button clicked for ${pokemon.name}`);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                type="button"
                style={{ pointerEvents: 'auto' }}
              >
                i
              </button>
            </DialogTrigger>
            
            <DialogContent 
              className="max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto"
              onClick={handleDialogClick}
              data-radix-dialog-content="true"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">
                  {pokemon.name}
                </DialogTitle>
              </DialogHeader>

              <PokemonModalContent
                pokemon={pokemon}
                showLoading={showLoading}
                showTCGCards={showTCGCards}
                showFallbackInfo={showFallbackInfo}
                tcgCard={modalTcgCard}
                secondTcgCard={secondTcgCard}
                flavorText={flavorText}
                isLoadingFlavor={isLoadingFlavor}
              />
            </DialogContent>
          </Dialog>
        </div>

        <TCGBattleCardContent
          pokemon={pokemon}
          displayName={displayName}
          isLoadingTCG={isLoadingTCG}
          hasTcgCard={hasTcgCard}
          tcgCard={tcgCard}
          shouldShowHover={shouldShowHover}
          isSelected={isSelected}
          isProcessing={isProcessing}
        />
      </CardContent>
    </Card>
  );
});

TCGBattleCard.displayName = "TCGBattleCard";

export default TCGBattleCard;
