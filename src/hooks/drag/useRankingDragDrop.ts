import { useState, useCallback, useMemo } from "react";
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Rating } from "ts-trueskill";
import { useTrueSkillStore } from "@/stores/trueskillStore";

interface UseRankingDragDropOptions {
  availablePokemon?: any[];
  localRankings: any[];
  setAvailablePokemon?: React.Dispatch<React.SetStateAction<any[]>>;
  onManualReorder: (
    pokemonId: number,
    sourceIndex: number,
    destinationIndex: number
  ) => void;
  onLocalReorder?: (newRankings: any[]) => void;
  triggerReRanking?: (pokemonId: number) => Promise<void>;
}

export const useRankingDragDrop = ({
  availablePokemon = [],
  localRankings,
  setAvailablePokemon,
  onManualReorder,
  onLocalReorder,
  triggerReRanking,
}: UseRankingDragDropOptions) => {
  const [activeDraggedPokemon, setActiveDraggedPokemon] = useState<any>(null);
  const { updateRating } = useTrueSkillStore();

  const sensors = useMemo(
    () =>
      useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
      ),
    []
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id.toString();
      let pokemon: any;
      if (id.startsWith("available-")) {
        const pid = parseInt(id.replace("available-", ""));
        pokemon = availablePokemon.find((p) => p.id === pid);
      } else {
        const pid = parseInt(id);
        pokemon = localRankings.find((p) => p.id === pid);
      }
      setActiveDraggedPokemon(pokemon || null);
    },
    [availablePokemon, localRankings]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDraggedPokemon(null);
      const { active, over } = event;
      if (!over) return;
      const activeId = active.id.toString();
      const overId = over.id.toString();

      // Drag from available list
      if (activeId.startsWith("available-")) {
        const pokemonId = parseInt(activeId.replace("available-", ""));
        const pokemon = availablePokemon.find((p) => p.id === pokemonId);
        if (!pokemon) return;

        let insertIndex = localRankings.length;
        if (
          !overId.startsWith("available-") &&
          !overId.startsWith("collision-placeholder-") &&
          !isNaN(Number(overId))
        ) {
          const targetIndex = localRankings.findIndex((p) => p.id === Number(overId));
          if (targetIndex !== -1) insertIndex = targetIndex;
        }

        if (pokemon.isRanked && triggerReRanking) {
          triggerReRanking(pokemonId);
        } else {
          if (setAvailablePokemon) {
            setAvailablePokemon((prev) => prev.filter((p) => p.id !== pokemonId));
          }
          if (updateRating && !pokemon.isRanked) {
            const defaultRating = new Rating(25.0, 8.333);
            updateRating(pokemonId.toString(), defaultRating);
          }
          onManualReorder(pokemonId, -1, insertIndex);
        }
        return;
      }

      // Reorder within rankings
      if (
        !overId.startsWith("available-") &&
        !overId.startsWith("collision-placeholder-")
      ) {
        const fromIndex = localRankings.findIndex((p) => p.id === Number(activeId));
        const toIndex = localRankings.findIndex((p) => p.id === Number(overId));
        if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
          onManualReorder(Number(activeId), fromIndex, toIndex);
          if (onLocalReorder) {
            const newRankings = [...localRankings];
            const [moved] = newRankings.splice(fromIndex, 1);
            newRankings.splice(toIndex, 0, moved);
            onLocalReorder(newRankings);
          }
        }
      }
    },
    [
      availablePokemon,
      localRankings,
      setAvailablePokemon,
      onManualReorder,
      onLocalReorder,
      triggerReRanking,
      updateRating,
    ]
  );

  const handleManualReorder = useCallback(
    (id: number, source: number, destination: number) => {
      onManualReorder(id, source, destination);
    },
    [onManualReorder]
  );

  return {
    sensors,
    activeDraggedPokemon,
    handleDragStart,
    handleDragEnd,
    handleManualReorder,
  };
};

export default useRankingDragDrop;
