import React, { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Pokemon } from "@/services/pokemon";
import { BattleType } from "@/hooks/battle/types";
import { usePokemonTCGCard } from "@/hooks/pokemon/usePokemonTCGCard";
import {
  useTCGBattleCardState,
  useTCGImageModeListener,
  useTCGCleanupEffect,
} from "./tcg/TCGBattleCardHooks";
import TCGBattleCardContent from "./tcg/TCGBattleCardContent";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PokemonModalContent from "@/components/pokemon/PokemonModalContent";
import { usePokemonFlavorText } from "@/hooks/pokemon/usePokemonFlavorText";
import { Star } from "lucide-react";
import { useSharedRefinementQueue } from "@/hooks/battle/useSharedRefinementQueue";
import { usePokemonContext } from "@/contexts/PokemonContext";
import { useCloudPendingBattles } from "@/hooks/battle/useCloudPendingBattles";

interface TCGBattleCardProps {
  pokemon: Pokemon;
  isSelected: boolean;
  battleType: BattleType;
  onSelect: (id: number) => void;
  isProcessing?: boolean;
}

const TCGBattleCard: React.FC<TCGBattleCardProps> = memo(
  ({ pokemon, isSelected, battleType, onSelect, isProcessing = false }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const {
      clickTimeoutRef,
      lastClickTimeRef,
      isHovered,
      setIsHovered,
      currentImageMode,
      setCurrentImageMode,
    } = useTCGBattleCardState();

    // CRITICAL FIX: Use cloud pending battles instead of local state
    const { isPokemonPending, addPendingPokemon, removePendingPokemon } =
      useCloudPendingBattles();
    const isPendingRefinement = isPokemonPending(pokemon.id);

    const { refinementQueue, hasRefinementBattles, queueBattlesForReorder } =
      useSharedRefinementQueue();
    const { allPokemon } = usePokemonContext();

    const contextAvailable = Boolean(
      refinementQueue &&
        Array.isArray(refinementQueue) &&
        typeof hasRefinementBattles === "boolean",
    );

    const hadRefinementBattlesRef = React.useRef(false);

    React.useEffect(() => {
      if (hasRefinementBattles) {
        hadRefinementBattlesRef.current = true;
      }
    }, [hasRefinementBattles]);

    React.useEffect(() => {
      if (
        contextAvailable &&
        hasRefinementBattles === false &&
        isPendingRefinement &&
        hadRefinementBattlesRef.current
      ) {
        removePendingPokemon(pokemon.id);
        hadRefinementBattlesRef.current = false;
      }
    }, [
      contextAvailable,
      hasRefinementBattles,
      isPendingRefinement,
      pokemon.id,
      removePendingPokemon,
    ]);

    const {
      tcgCard,
      isLoading: isLoadingTCG,
      hasTcgCard,
    } = usePokemonTCGCard(pokemon.name, true);
    const displayName = pokemon.name;

    // Hooks for modal content - match manual mode approach
    const { flavorText, isLoadingFlavor } = usePokemonFlavorText(
      pokemon.id,
      isOpen,
    );
    const {
      tcgCard: modalTcgCard,
      secondTcgCard,
      isLoading: modalIsLoadingTCG,
      error: tcgError,
      hasTcgCard: modalHasTcgCard,
    } = usePokemonTCGCard(pokemon.name, isOpen);

    console.log(
      `🃏 [TCG_BATTLE_CARD] ${displayName}: TCG loading=${isLoadingTCG}, hasTcgCard=${hasTcgCard}, isProcessing=${isProcessing}`,
    );

    useTCGImageModeListener(setCurrentImageMode);
    useTCGCleanupEffect(displayName, clickTimeoutRef);

    const handleClick = React.useCallback(
      (e: React.MouseEvent) => {
        console.log(
          `🖱️ [INFO_BUTTON_DEBUG] TCGBattleCard ${displayName}: Card clicked`,
        );

        // Check for info button clicks - match manual mode approach
        const target = e.target as HTMLElement;
        const isInfoButtonClick =
          target.closest('[data-info-button="true"]') ||
          target.closest("[data-radix-dialog-content]") ||
          target.closest("[data-radix-dialog-overlay]") ||
          target.closest('[role="dialog"]');
        const isStarClick = target.closest('[data-priority-button="true"]');

        if (isInfoButtonClick || isStarClick) {
          console.log(
            `ℹ️ [INFO_BUTTON_DEBUG] TCGBattleCard: Info dialog interaction for ${displayName}, preventing card selection`,
          );
          e.preventDefault();
          e.stopPropagation();
          return;
        }

        const now = Date.now();

        // Prevent rapid double-clicks
        if (now - lastClickTimeRef.current < 300) {
          console.log(
            `🚫 TCGBattleCard: Ignoring rapid click on ${displayName}`,
          );
          return;
        }

        lastClickTimeRef.current = now;

        console.log(
          `🖱️ TCGBattleCard: Click on ${displayName} (${pokemon.id}) - processing: ${isProcessing}`,
        );

        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
        }

        clickTimeoutRef.current = setTimeout(() => {
          onSelect(pokemon.id);
          clickTimeoutRef.current = null;
        }, 50);
      },
      [pokemon.id, displayName, onSelect, isProcessing],
    );

    const handleMouseEnter = React.useCallback(() => {
      console.log(
        `🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Mouse enter - isProcessing: ${isProcessing}`,
      );
      if (!isProcessing) {
        setIsHovered(true);
      }
    }, [isProcessing, displayName, setIsHovered]);

    const handleMouseLeave = React.useCallback(() => {
      console.log(`🔘 [HOVER_DEBUG] TCGBattleCard ${displayName}: Mouse leave`);
      setIsHovered(false);
    }, [displayName, setIsHovered]);

    const handlePrioritizeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      console.log(
        `⭐ [TCG_STAR_TOGGLE_FIXED] Star clicked for ${pokemon.name} - current pending: ${isPendingRefinement}`,
      );

      if (!isPendingRefinement) {
        // CRITICAL FIX: Use cloud pending system
        console.log(
          `⭐ [TCG_STAR_TOGGLE_FIXED] Adding ${pokemon.name} to CLOUD pending state`,
        );
        addPendingPokemon(pokemon.id);

        if (contextAvailable && allPokemon.length > 1) {
          const pool = allPokemon.filter((p) => p.id !== pokemon.id);
          const opponents: number[] = [];
          const copy = [...pool];
          while (opponents.length < 3 && copy.length > 0) {
            const rand = Math.floor(Math.random() * copy.length);
            opponents.push(copy.splice(rand, 1)[0].id);
          }
          try {
            queueBattlesForReorder(pokemon.id, opponents, -1);
          } catch (error) {
            console.error(
              "Failed to queue refinement battles from battle card",
              error,
            );
          }
        }
      } else {
        // CRITICAL FIX: Use cloud pending system
        console.log(
          `⭐ [TCG_STAR_TOGGLE_FIXED] Removing ${pokemon.name} from CLOUD pending state`,
        );
        removePendingPokemon(pokemon.id);
      }
    };

    const shouldShowHover =
      isHovered && !isSelected && !isProcessing && !isLoadingTCG;

    const cardClasses = `
    relative cursor-pointer transition-all duration-200 transform group
    ${isSelected ? "ring-4 ring-blue-500 bg-blue-50 scale-105 shadow-xl" : "hover:scale-105 hover:shadow-lg"}
    ${isProcessing ? "pointer-events-none" : ""}
    ${shouldShowHover ? "ring-2 ring-blue-300 ring-opacity-50" : ""}
  `.trim();

    const handleDialogClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    // Determine what content to show in modal - match manual mode
    const showLoading = modalIsLoadingTCG;
    const showTCGCards =
      !modalIsLoadingTCG && modalHasTcgCard && modalTcgCard !== null;
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
          {/* Prioritize button - only visible on card hover */}
          <button
            data-priority-button="true"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
            }}
            onClick={handlePrioritizeClick}
            className={`absolute top-1/2 right-2 -translate-y-1/2 z-30 p-2 rounded-full transition-all duration-300 ${
              isPendingRefinement
                ? "opacity-100"
                : isHovered && !isProcessing
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
            }`}
            title={
              isPendingRefinement
                ? "Remove from refinement queue"
                : "Prioritize for refinement battle"
            }
            type="button"
          >
            <Star
              className={`w-16 h-16 transition-all duration-300 ${
                isPendingRefinement
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-500 hover:text-yellow-500"
              }`}
            />
          </button>

          {/* Info Button - only visible on card hover */}
          <div
            className={`absolute top-1 right-1 z-30 transition-all duration-300 ${
              isHovered && !isProcessing
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
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
                  style={{ pointerEvents: "auto" }}
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
  },
);

TCGBattleCard.displayName = "TCGBattleCard";

export default TCGBattleCard;
