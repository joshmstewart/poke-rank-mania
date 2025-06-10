import { useEffect, useRef } from "react";
import { Pokemon } from "@/services/pokemon";
import { useCloudPendingBattles } from "./useCloudPendingBattles";

export const useBattleStarterEvents = (
  filteredPokemon: Pokemon[],
  currentBattle: Pokemon[],
  initialBattleStartedRef: React.MutableRefObject<boolean>,
  autoTriggerDisabledRef: React.MutableRefObject<boolean>,
  startNewBattleCallbackRef: React.MutableRefObject<
    ((battleType: any) => any[]) | null
  >,
  initializationTimerRef: React.MutableRefObject<NodeJS.Timeout | null>,
  initializationCompleteRef: React.MutableRefObject<boolean>,
  stableSetCurrentBattle: (battle: Pokemon[]) => void,
  stableSetSelectedPokemon: (pokemon: number[]) => void,
) => {
  const { getAllPendingIds, isHydrated } = useCloudPendingBattles();
  const pendingCheckRef = useRef(false);

  // Check for pending Pokémon when battle mode initializes
  useEffect(() => {
    console.log(
      `🔍 [BATTLE_STARTER_EVENTS] Init effect fired. isHydrated=${isHydrated}, pendingChecked=${pendingCheckRef.current}, filteredLength=${filteredPokemon.length}`,
    );
    if (filteredPokemon.length === 0) {
      console.log(
        `🔍 [BATTLE_STARTER_EVENTS] Exiting init check early - no filtered Pokémon yet`,
      );
      return;
    }
    if (!isHydrated || pendingCheckRef.current) {
      console.log(
        `🔍 [BATTLE_STARTER_EVENTS] Skipping init check - isHydrated=${isHydrated}, alreadyChecked=${pendingCheckRef.current}`,
      );
      return;
    }

    const checkPendingOnInit = () => {
      const pendingIds = getAllPendingIds();
      console.log(
        `🎯 [BATTLE_STARTER_EVENTS] Checking pending Pokemon on init: ${pendingIds}`,
      );

      if (pendingIds.length > 0) {
        console.log(
          `🎯 [BATTLE_STARTER_EVENTS] Found ${pendingIds.length} pending Pokemon, starting battle`,
        );

        // Set flag to prevent duplicate checks
        pendingCheckRef.current = true;

        // Small delay to ensure all components are ready
        setTimeout(() => {
          if (startNewBattleCallbackRef.current && currentBattle.length === 0) {
            console.log(
              `🎯 [BATTLE_STARTER_EVENTS] Triggering battle for pending Pokemon`,
            );
            const result = startNewBattleCallbackRef.current("pairs");
            console.log(
              `🎯 [BATTLE_STARTER_EVENTS] Battle result:`,
              result?.map((p) => p.name),
            );
          } else {
            console.log(
              `🎯 [BATTLE_STARTER_EVENTS] Battle callback not ready or battle already exists`,
            );
          }
        }, 100);
      } else {
        console.log(
          `🎯 [BATTLE_STARTER_EVENTS] No pending Pokemon found on init`,
        );
        pendingCheckRef.current = true;
      }
    };

    // Run the check immediately if hydrated
    checkPendingOnInit();
  }, [
    isHydrated,
    getAllPendingIds,
    currentBattle.length,
    startNewBattleCallbackRef,
    filteredPokemon.length,
  ]);

  // CRITICAL FIX: Auto-trigger first battle when no battle exists and we have Pokemon
  useEffect(() => {
    if (
      !initialBattleStartedRef.current &&
      !autoTriggerDisabledRef.current &&
      filteredPokemon.length > 0 &&
      currentBattle.length === 0 &&
      startNewBattleCallbackRef.current &&
      isHydrated
    ) {
      console.log(
        `🔥 [BATTLE_STARTER_EVENTS] Auto-triggering first battle with ${filteredPokemon.length} Pokemon`,
      );

      // Small delay to ensure all hooks are ready
      const triggerTimer = setTimeout(() => {
        if (startNewBattleCallbackRef.current) {
          console.log(
            `🔥 [BATTLE_STARTER_EVENTS] Executing auto-trigger for first battle`,
          );
          const result = startNewBattleCallbackRef.current("pairs");
          console.log(
            `🔥 [BATTLE_STARTER_EVENTS] Auto-trigger result:`,
            result?.map((p) => p.name),
          );
          initialBattleStartedRef.current = true;
        }
      }, 200);

      return () => clearTimeout(triggerTimer);
    }
  }, [
    filteredPokemon.length,
    currentBattle.length,
    initialBattleStartedRef,
    autoTriggerDisabledRef,
    startNewBattleCallbackRef,
    isHydrated,
  ]);

  // CRITICAL FIX: Listen for mode switch events and check for pending battles
  useEffect(() => {
    console.log(
      `🔍 [BATTLE_STARTER_EVENTS] Mode switch listener effect fired. isHydrated=${isHydrated}, filteredLength=${filteredPokemon.length}`,
    );
    if (filteredPokemon.length === 0) {
      console.log(
        `🔍 [BATTLE_STARTER_EVENTS] Exiting mode switch listener - no filtered Pokémon yet`,
      );
      return;
    }
    if (!isHydrated) {
      console.log(
        `🔍 [BATTLE_STARTER_EVENTS] Mode switch listener waiting for hydration`,
      );
      return;
    }
    const handleModeSwitch = (event: CustomEvent) => {
      console.log(
        `🎯 [BATTLE_STARTER_EVENTS] Mode switch detected:`,
        event.detail,
      );

      if (event.detail?.mode === "battle" && isHydrated) {
        // Reset pending check flag when switching to battle mode
        pendingCheckRef.current = false;

        // Check for pending Pokemon after mode switch
        setTimeout(() => {
          const pendingIds = getAllPendingIds();
          console.log(
            `🎯 [BATTLE_STARTER_EVENTS] Post-switch pending check: ${pendingIds}`,
          );

          if (pendingIds.length > 0 && currentBattle.length === 0) {
            console.log(
              `🎯 [BATTLE_STARTER_EVENTS] Triggering battle after mode switch`,
            );
            if (startNewBattleCallbackRef.current) {
              const result = startNewBattleCallbackRef.current("pairs");
              console.log(
                `🎯 [BATTLE_STARTER_EVENTS] Post-switch battle result:`,
                result?.map((p) => p.name),
              );
            }
          }
        }, 300);
      }
    };

    // Listen for mode switch events
    document.addEventListener("mode-switch", handleModeSwitch as EventListener);

    return () => {
      document.removeEventListener(
        "mode-switch",
        handleModeSwitch as EventListener,
      );
    };
  }, [
    getAllPendingIds,
    currentBattle.length,
    startNewBattleCallbackRef,
    isHydrated,
    filteredPokemon.length,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initializationTimerRef.current) {
        clearTimeout(initializationTimerRef.current);
        initializationTimerRef.current = null;
      }
    };
  }, [initializationTimerRef]);
};
