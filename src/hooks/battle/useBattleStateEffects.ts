
import { useEffect, useRef } from "react";

export const useBattleStateEffects = (
  loadSavedSuggestions: () => Map<any, any>,
  debouncedGenerateRankings: (generateRankings: (results: any[]) => void, results: any[]) => void,
  battleResults: any[],
  generateRankings: (results: any[]) => void,
  lastSuggestionLoadTimestampRef: React.MutableRefObject<number>
) => {
  useEffect(() => {
    const preferredImageType = localStorage.getItem('preferredImageType');
    console.log("🎯 [Mount] Loaded preferredImageType from localStorage:", preferredImageType);

    if (!preferredImageType) {
      localStorage.setItem('preferredImageType', 'official');
      console.log("✅ Set default image preference to 'official'");
    }

    const savedSuggestions = localStorage.getItem('pokemon-active-suggestions');
    console.log("🔍 MOUNT VERIFICATION: Suggestions in localStorage:", savedSuggestions ? "YES" : "NO");
    
    if (savedSuggestions) {
      try {
        const parsed = JSON.parse(savedSuggestions);
        const count = Object.keys(parsed).length;
        console.log(`🔢 Found ${String(count)} suggestions in localStorage`);
        lastSuggestionLoadTimestampRef.current = Date.now();
        
        const loadedSuggestions = loadSavedSuggestions();
        console.log(`⭐ useBattleStateCore: Initial load: Loaded ${String(loadedSuggestions.size)} suggestions`);
        
        if (battleResults.length > 0) {
          console.log("⚙️ useBattleStateCore: Triggering initial generateRankings to apply loaded suggestions");
          debouncedGenerateRankings(generateRankings, battleResults);
        }
      } catch (e) {
        console.error("Error parsing saved suggestions:", e);
      }
    }
  }, [loadSavedSuggestions, debouncedGenerateRankings, battleResults.length, generateRankings, lastSuggestionLoadTimestampRef]);
};
