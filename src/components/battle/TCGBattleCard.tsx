
import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import { 
  useTCGBattleCardState, 
  useTCGImageModeListener, 
  useTCGCleanupEffect, 
  useTCGModalEffect 
} from "./tcg/TCGBattleCardHooks";
import { useTCGBattleCardHandlers } from "./tcg/TCGBattleCardHandlers";
import TCGBattleCardContent from "./tcg/TCGBattleCardContent";
import TCGBattleCardInfoButton from "./tcg/TCGBattleCardInfoButton";

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
    modalOpen,
    setModalOpen,
    currentImageMode,
    setCurrentImageMode
  } = useTCGBattleCardState();

  const { tcgCard, isLoading: isLoadingTCG, hasTcgCard } = usePokemonTCGCard(pokemon.name, true);
  const displayName = pokemon.name;
  
  console.log(`🃏 [TCG_BATTLE_CARD] ${displayName}: TCG loading=${isLoadingTCG}, hasTcgCard=${hasTcgCard}, isProcessing=${isProcessing}`);

  useTCGImageModeListener(setCurrentImageMode);
  useTCGCleanupEffect(displayName, clickTimeoutRef);
  useTCGModalEffect(modalOpen, displayName, setIsHovered);

  const {
    handleClick,
    handleMouseEnter,
    handleMouseLeave,
    handleInfoButtonInteraction,
    handleModalStateChange
  } = useTCGBattleCardHandlers({
    displayName,
    pokemonId: pokemon.id,
    onSelect,
    isProcessing,
    clickTimeoutRef,
    lastClickTimeRef,
    modalOpen,
    setIsHovered,
    setModalOpen
  });

  const shouldShowHover = isHovered && !isSelected && !modalOpen && !isProcessing && !isLoadingTCG;

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
      data-modal-open={modalOpen ? "true" : "false"}
      data-hovered={shouldShowHover ? "true" : "false"}
    >
      <CardContent className="p-4 text-center relative">
        <TCGBattleCardInfoButton
          pokemon={pokemon}
          onModalStateChange={handleModalStateChange}
          onInfoButtonInteraction={handleInfoButtonInteraction}
          onMouseEnter={() => setIsHovered(false)}
        />

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
