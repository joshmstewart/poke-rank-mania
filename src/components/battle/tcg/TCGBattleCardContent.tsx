
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { TCGCard } from "@/hooks/pokemon/tcg/types";
import LoadingOverlay from "../LoadingOverlay";
import EnhancedTCGFallback from "../EnhancedTCGFallback";
import TCGCardImage from "../TCGCardImage";
import TCGCardInfo from "../TCGCardInfo";
import TCGCardInteractions from "../TCGCardInteractions";
import TCGCardLoading from "../TCGCardLoading";

interface TCGBattleCardContentProps {
  pokemon: Pokemon;
  displayName: string;
  isLoadingTCG: boolean;
  hasTcgCard: boolean;
  tcgCard: TCGCard | null;
  shouldShowHover: boolean;
  isSelected: boolean;
  isProcessing: boolean;
}

const TCGBattleCardContent: React.FC<TCGBattleCardContentProps> = ({
  pokemon,
  displayName,
  isLoadingTCG,
  hasTcgCard,
  tcgCard,
  shouldShowHover,
  isSelected,
  isProcessing
}) => {
  const showLoading = isLoadingTCG;
  const showTCGCard = !isLoadingTCG && hasTcgCard && tcgCard;
  const showFallback = !isLoadingTCG && !hasTcgCard;

  return (
    <>
      <TCGCardInteractions 
        isHovered={shouldShowHover}
        isSelected={isSelected}
        isProcessing={isProcessing}
        showFallback={showFallback}
        isLoading={isLoadingTCG}
      />

      <div className="relative">
        {showLoading && <TCGCardLoading />}

        {showTCGCard && (
          <div className="space-y-3">
            <TCGCardImage tcgCard={tcgCard} displayName={displayName} />
            <TCGCardInfo pokemon={pokemon} displayName={displayName} />
          </div>
        )}

        {showFallback && (
          <EnhancedTCGFallback pokemon={pokemon} />
        )}

        <LoadingOverlay isVisible={isProcessing} />
      </div>
    </>
  );
};

export default TCGBattleCardContent;
