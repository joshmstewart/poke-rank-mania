diff --git a/src/components/ranking/RankingsSection.tsx b/src/components/ranking/RankingsSection.tsx
index 8891693b7e1ee37af9a1012fce705ebcfb0a0078..cdb5955fee8576f6d6b34d3ebc2e1f2f56e53f4a 100644
--- a/src/components/ranking/RankingsSection.tsx
+++ b/src/components/ranking/RankingsSection.tsx
@@ -1,67 +1,74 @@
 
 import React, { useCallback, useMemo } from "react";
 import { useDroppable } from '@dnd-kit/core';
+import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
 import { Pokemon, RankedPokemon } from "@/services/pokemon";
 import OptimizedDraggableCard from "@/components/battle/OptimizedDraggableCard";
 import { useRenderTracker } from "@/hooks/battle/useRenderTracker";
 
 interface RankingsSectionProps {
   displayRankings: (Pokemon | RankedPokemon)[];
   onManualReorder?: (draggedPokemonId: number, sourceIndex: number, destinationIndex: number) => void;
   onLocalReorder?: (newRankings: (Pokemon | RankedPokemon)[]) => void;
   pendingRefinements?: Set<number>;
   availablePokemon?: any[];
 }
 
 export const RankingsSection: React.FC<RankingsSectionProps> = React.memo(({
   displayRankings,
   onManualReorder,
   onLocalReorder,
   pendingRefinements = new Set<number>(),
   availablePokemon = []
 }) => {
   // Track renders for performance debugging
   useRenderTracker('RankingsSection', { 
     rankingsCount: displayRankings.length,
     hasManualReorder: !!onManualReorder 
   });
 
   console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] ===== RENDERING RANKINGS SECTION =====`);
   console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Display rankings count: ${displayRankings.length}`);
   console.log(`🚨🚨🚨 [RANKINGS_SECTION_ULTRA_CRITICAL] Available Pokemon for collision: ${availablePokemon.length}`);
 
   // Memoize empty state content
   const emptyStateContent = useMemo(() => (
     <div className="flex items-center justify-center h-full text-gray-500">
       <div className="text-center">
         <p className="text-lg mb-2">No Pokémon ranked yet</p>
         <p className="text-sm">Drag Pokémon from the left to start ranking!</p>
       </div>
     </div>
   ), []);
 
+  // Sortable item ids must match the ids used by OptimizedDraggableCard
+  const sortableItems = useMemo(
+    () => displayRankings.map((p) => `ranking-${p.id}`),
+    [displayRankings]
+  );
+
   // Create individual droppable slot component with enhanced debugging
   const DroppableRankingSlot: React.FC<{ index: number; pokemon?: Pokemon | RankedPokemon }> = ({ index, pokemon }) => {
     const droppableId = `ranking-${index}`;
     const { setNodeRef, isOver } = useDroppable({ 
       id: droppableId,
       data: {
         type: 'ranking-position',
         index: index,
         accepts: ['available-pokemon']
       }
     });
 
     // Enhanced logging for each droppable
     console.log(`🔍 [DROPPABLE_DETAILED] Slot ${index}:`);
     console.log(`🔍 [DROPPABLE_DETAILED] - ID: ${droppableId}`);
     console.log(`🔍 [DROPPABLE_DETAILED] - Has setNodeRef: ${!!setNodeRef}`);
     console.log(`🔍 [DROPPABLE_DETAILED] - isOver: ${isOver}`);
     console.log(`🔍 [DROPPABLE_DETAILED] - Pokemon: ${pokemon?.name || 'Empty'}`);
     console.log(`[DROPPABLE_INIT] Initialized droppable: ${droppableId}, isOver: ${isOver}`);
 
     // Enhanced collision detection logging
     React.useEffect(() => {
       if (isOver) {
         console.log(`🎯 [COLLISION_DETECTED] Slot ${index} (${droppableId}) is being hovered over!`);
         console.log(`🎯 [COLLISION_DETECTED] Pokemon in slot: ${pokemon?.name || 'Empty'}`);
diff --git a/src/components/ranking/RankingsSection.tsx b/src/components/ranking/RankingsSection.tsx
index 8891693b7e1ee37af9a1012fce705ebcfb0a0078..cdb5955fee8576f6d6b34d3ebc2e1f2f56e53f4a 100644
--- a/src/components/ranking/RankingsSection.tsx
+++ b/src/components/ranking/RankingsSection.tsx
@@ -106,48 +113,55 @@ export const RankingsSection: React.FC<RankingsSectionProps> = React.memo(({
         )}
       </div>
     );
   };
 
   // Log the creation of all droppable slots
   console.log(`🔧 [DROPPABLE_CREATION] Creating ${displayRankings.length} droppable slots`);
   for (let i = 0; i < displayRankings.length; i++) {
     console.log(`🔧 [DROPPABLE_CREATION] Slot ${i}: ranking-${i} with pokemon: ${displayRankings[i]?.name || 'Empty'}`);
   }
 
   return (
     <div className="flex flex-col h-full">
       {/* Streamlined Header */}
       <div className="bg-white border-b border-gray-200 p-4">
         <div className="flex items-center justify-between">
           <h2 className="text-lg font-semibold text-gray-900">Your Rankings</h2>
           <div className="text-sm text-gray-500 font-medium">
             {displayRankings.length} Pokémon ranked
           </div>
         </div>
       </div>
       
       {/* Rankings Grid - Each position is a separate droppable */}
       <div className="flex-1 overflow-y-auto p-4">
-        {displayRankings.length === 0 ? emptyStateContent : (
-          <div 
-            className="grid gap-4" 
-            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
+        {displayRankings.length === 0 ? (
+          emptyStateContent
+        ) : (
+          <SortableContext
+            items={sortableItems}
+            strategy={verticalListSortingStrategy}
           >
-            {displayRankings.map((pokemon, index) => {
-              console.log(`🎯 [SLOT_RENDER] Rendering slot ${index} with pokemon: ${pokemon?.name || 'Empty'}`);
-              return (
-                <DroppableRankingSlot 
-                  key={`slot-${index}`} 
-                  index={index} 
-                  pokemon={pokemon} 
-                />
-              );
-            })}
-          </div>
+            <div
+              className="grid gap-4"
+              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
+            >
+              {displayRankings.map((pokemon, index) => {
+                console.log(`🎯 [SLOT_RENDER] Rendering slot ${index} with pokemon: ${pokemon?.name || 'Empty'}`);
+                return (
+                  <DroppableRankingSlot
+                    key={`slot-${index}`}
+                    index={index}
+                    pokemon={pokemon}
+                  />
+                );
+              })}
+            </div>
+          </SortableContext>
         )}
       </div>
     </div>
   );
 });
 
 RankingsSection.displayName = 'RankingsSection';
