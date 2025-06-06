
import React, { memo, useEffect, useState } from "react";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { getPreferredImage, ImageType } from "@/utils/imageUtils";
import { getCurrentImageMode } from "@/components/settings/imagePreferenceHelpers";
import TCGBattleCard from "./TCGBattleCard";
import BattleCardContainer from "./BattleCardContainer";

interface BattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: BattleType;
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

const BattleCard: React.FC<BattleCardProps> = memo(({
  pokemon,
  isSelected,
  battleType,
  onSelect,
  isProcessing = false
}) => {
  const [currentImageMode, setCurrentImageMode] = useState<'pokemon' | 'tcg'>(() => getCurrentImageMode());
  
  // Listen for image mode changes - both storage events and custom events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only respond to the pokemon-image-mode key change, which happens when Done is clicked
      if (e.key === "pokemon-image-mode") {
        const newMode = getCurrentImageMode();
        console.log(`🎯 [BATTLE_CARD] Image mode changed to: ${newMode} (Storage event)`);
        setCurrentImageMode(newMode);
      }
    };

    const handlePreferencesSaved = (e: CustomEvent) => {
      const newMode = e.detail.mode;
      console.log(`🎯 [BATTLE_CARD] Image mode changed to: ${newMode} (Done clicked)`);
      setCurrentImageMode(newMode);
    };

    // Set up listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('pokemon-preferences-saved', handlePreferencesSaved as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('pokemon-preferences-saved', handlePreferencesSaved as EventListener);
    };
  }, []);
  
  console.log(`🎯 [BATTLE_CARD] Pokemon ${pokemon.id}: Image mode is ${currentImageMode}`);
  
  // If TCG mode is selected, use the TCG Battle Card component
  if (currentImageMode === 'tcg') {
    return (
      <TCGBattleCard
        pokemon={pokemon}
        isSelected={isSelected}
        battleType={battleType}
        onSelect={onSelect}
        isProcessing={isProcessing}
      />
    );
  }

  // CRITICAL FIX: Use the Pokemon name directly
  const displayName = pokemon.name;
  
  console.log(`🎯 [BATTLE_CARD_CRITICAL] Pokemon ${pokemon.id}: using name "${displayName}"`);
  console.log(`🎯 [LOADING_CIRCLES] BattleCard ${displayName} received isProcessing: ${isProcessing}`);

  const preferredImageType: ImageType = 
    (localStorage.getItem('preferredImageType') as ImageType) || 'official';
  
  console.log(`🖼️ [DEV] Getting preferred image type: ${preferredImageType}`);
  
  const imageUrl = getPreferredImage(pokemon, preferredImageType);
  
  console.log(`🏆 BattleCard: Rendering Pokemon ${displayName} (#${pokemon.id}) with isSelected=${isSelected}`);
  console.log(`🖼️ BattleCard: Loading "${preferredImageType}" image for ${displayName} (#${pokemon.id}): ${imageUrl}`);

  return (
    <BattleCardContainer
      pokemon={pokemon}
      isSelected={isSelected}
      onSelect={onSelect}
      isProcessing={isProcessing}
      imageUrl={imageUrl}
      displayName={displayName}
    />
  );
});

BattleCard.displayName = "BattleCard";

export default BattleCard;
