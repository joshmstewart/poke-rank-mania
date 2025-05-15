import { toast } from "@/hooks/use-toast";
import { Pokemon, UnifiedSessionData } from "./types";

// Save rankings to both local storage and unified session storage
export function saveRankings(rankings: Pokemon[], generationId: number = 1): void {
  try {
    // Save to local storage for backward compatibility
    localStorage.setItem(`pokemon-rankings-gen-${generationId}`, JSON.stringify(rankings));
    
    // Save to unified session storage
    const sessionData = loadUnifiedSessionData();
    sessionData.rankings = sessionData.rankings || {};
    sessionData.rankings[`gen-${generationId}`] = rankings;
    
    // Add timestamp for last update
    sessionData.lastUpdate = Date.now();
    
    saveUnifiedSessionData(sessionData);
    
    // No toast notification for auto-saves to avoid spam
  } catch (error) {
    console.error('Error saving rankings:', error);
    toast({
      title: "Error saving",
      description: "Failed to save rankings. Please try again."
    });
  }
}

// Load rankings from unified session storage (with fallback to local storage)
export function loadRankings(generationId: number = 1): Pokemon[] {
  try {
    // Try to get from unified session storage first
    const sessionData = loadUnifiedSessionData();
    if (sessionData.rankings && sessionData.rankings[`gen-${generationId}`]) {
      return sessionData.rankings[`gen-${generationId}`];
    }
    
    // Fall back to legacy local storage
    const savedRankings = localStorage.getItem(`pokemon-rankings-gen-${generationId}`);
    if (savedRankings) {
      return JSON.parse(savedRankings);
    }
    
    return [];
  } catch (error) {
    console.error('Error loading rankings:', error);
    toast({
      title: "Error",
      description: "Failed to load saved rankings.",
      variant: "destructive"
    });
    return [];
  }
}

// Export rankings as JSON file
export function exportRankings(rankings: Pokemon[], generationId: number = 1): void {
  try {
    const dataStr = JSON.stringify(rankings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const genLabel = generationId === 0 ? "all" : `gen-${generationId}`;
    const exportFileDefaultName = `pokemon-rankings-${genLabel}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  } catch (error) {
    console.error('Error exporting rankings:', error);
    toast({
      title: "Error",
      description: "Failed to export rankings. Please try again.",
      variant: "destructive"
    });
  }
}

// Unified session data functions
export function loadUnifiedSessionData(): UnifiedSessionData {
  try {
    const data = localStorage.getItem('pokemon-unified-session');
    if (data) {
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading unified session data:', error);
    return {};
  }
}

export function saveUnifiedSessionData(data: UnifiedSessionData): void {
  try {
    localStorage.setItem('pokemon-unified-session', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving unified session data:', error);
  }
}

// Unified session import/export functions
export function exportUnifiedSessionData(): string {
  const sessionData = loadUnifiedSessionData();
  return JSON.stringify(sessionData, null, 2);
}

export function importUnifiedSessionData(data: string): boolean {
  try {
    const sessionData = JSON.parse(data);
    if (sessionData) {
      saveUnifiedSessionData(sessionData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing unified session data:', error);
    return false;
  }
}
