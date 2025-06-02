
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
import PokemonInfoModal from "@/components/pokemon/PokemonInfoModal";

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
    relative cursor-pointer transition-all duration-200 transform
    ${isSelected ? 'ring-4 ring-blue-500 bg-blue-50 scale-105 shadow-xl' : 'hover:scale-105 hover:shadow-lg'}
    ${isProcessing ? 'pointer-events-none' : ''}
    ${shouldShowHover ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
  `.trim();

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
        {/* Info Button - simplified to match manual mode */}
        <div className="absolute top-1 right-1 z-30" data-info-button="true">
          <PokemonInfoModal pokemon={pokemon} />
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
