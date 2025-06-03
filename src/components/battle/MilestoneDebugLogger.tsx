
import { useEffect } from "react";
import { Pokemon, RankedPokemon } from "@/services/pokemon";

// CRITICAL: Persistent logging utility that survives DevTools crashes
const persistentLog = {
  logs: [] as string[],
  
  add: (message: string) => {
    const timestamp = Date.now();
    const logEntry = `[${timestamp}] ${message}`;
    persistentLog.logs.push(logEntry);
    
    // Save to localStorage immediately
    try {
      localStorage.setItem('debugPerfLogs', JSON.stringify(persistentLog.logs));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
    
    // Also log to console for immediate viewing
    console.log(`🔍 [PERSISTENT_LOG] ${logEntry}`);
  }
};

interface MilestoneDebugLoggerProps {
  formattedRankings: (Pokemon | RankedPokemon)[];
  localRankings: (Pokemon | RankedPokemon)[];
  displayRankings: (Pokemon | RankedPokemon)[];
  isManualOperationInProgress: boolean;
  manualOperationTimestamp: number | null;
}

const MilestoneDebugLogger: React.FC<MilestoneDebugLoggerProps> = ({
  formattedRankings,
  localRankings,
  displayRankings,
  isManualOperationInProgress,
  manualOperationTimestamp
}) => {
  // CRITICAL DEBUG: Log incoming props to track visual updates with persistent logs
  useEffect(() => {
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== MILESTONE VIEW RENDER =====`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length: ${formattedRankings.length}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] First 5 rankings: ${formattedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`).join(', ')}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Render timestamp: ${Date.now()}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Manual operation in progress: ${isManualOperationInProgress}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Manual operation timestamp: ${manualOperationTimestamp}`);
    
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== MILESTONE VIEW RENDER =====');
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] formattedRankings length:', formattedRankings.length);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] First 5 rankings:', formattedRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`));
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] Render timestamp:', Date.now());
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] Manual operation in progress:', isManualOperationInProgress);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] Manual operation timestamp:', manualOperationTimestamp);
  }, [formattedRankings, isManualOperationInProgress, manualOperationTimestamp]);

  // CRITICAL DEBUG: Log local state changes with persistent logs
  useEffect(() => {
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== LOCAL STATE UPDATE =====`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] localRankings updated to: ${localRankings.length} items`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] First 5 local rankings: ${localRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`).join(', ')}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Local state timestamp: ${Date.now()}`);
    
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== LOCAL STATE UPDATE =====');
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] localRankings updated to:', localRankings.length, 'items');
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] First 5 local rankings:', localRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`));
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] Local state timestamp:', Date.now());
  }, [localRankings]);

  // CRITICAL DEBUG: Log before rendering DragDropGrid with persistent logs
  useEffect(() => {
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] ===== ABOUT TO RENDER GRID =====`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] displayRankings passed to grid: ${displayRankings.length}`);
    persistentLog.add(`🎨 [MILESTONE_VISUAL_DEBUG] Grid will show: ${displayRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`).join(', ')}`);
    
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] ===== ABOUT TO RENDER GRID =====');
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] displayRankings passed to grid:', displayRankings.length);
    console.log('🎨 [MILESTONE_VISUAL_DEBUG] Grid will show:', displayRankings.slice(0, 5).map((p, i) => `${i+1}. ${p.name} (${('score' in p ? p.score.toFixed(2) : 'N/A')})`));
  }, [displayRankings]);

  return null; // This component only handles logging
};

export default MilestoneDebugLogger;
