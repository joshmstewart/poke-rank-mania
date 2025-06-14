
import { useEffect } from 'react';

const LEGACY_KEYS = [
  'pokemon-battle-state',
  'pokemon-battle-count',
  'pokemon-battle-results',
  'pokemon-battle-history',
  'pokemon-battle-recently-used',
  'pokemon-battle-last-battle',
  'pokemon-ranker-battle-history',
  'pokemon-battle-tracking',
  'pokemon-battle-seen',
  'pokemon-active-suggestions',
  'suggestionUsageCounts',
  'pokemon-ranker-rankings',
  'pokemon-ranker-confidence'
];

export const useLegacyBattleStateCleanup = () => {
  useEffect(() => {
    console.log('🧹 [CLEANUP] Checking for legacy battle state keys in localStorage...');
    let keysFound = false;
    LEGACY_KEYS.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        keysFound = true;
        console.log(`🧹 [CLEANUP] Removing legacy key: ${key}`);
        localStorage.removeItem(key);
      }
    });

    if (keysFound) {
      console.log('🧹 [CLEANUP] Legacy battle state cleanup complete.');
    } else {
      console.log('🧹 [CLEANUP] No legacy keys found.');
    }
  }, []);
};
