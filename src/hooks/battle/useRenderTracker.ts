
import { useRef, useEffect } from 'react';

// Global render tracking state
const renderCounts = new Map<string, number>();
const lastRenderTimes = new Map<string, number>();

export const useRenderTracker = (componentName: string, additionalInfo?: any) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  
  renderCountRef.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTimeRef.current;
  lastRenderTimeRef.current = currentTime;
  
  // Update global tracking
  renderCounts.set(componentName, (renderCounts.get(componentName) || 0) + 1);
  lastRenderTimes.set(componentName, currentTime);
  
  // Log render information for performance monitoring
  console.log(`🔍 [RENDER_TRACKER] ${componentName}: Render #${renderCountRef.current} (${timeSinceLastRender}ms since last)`, additionalInfo || '');
  
  // Log performance warning if component is rendering too frequently
  if (renderCountRef.current > 10 && timeSinceLastRender < 100) {
    console.warn(`⚠️ [RENDER_TRACKER] ${componentName}: High render frequency detected! ${renderCountRef.current} renders, last ${timeSinceLastRender}ms ago`);
  }
  
  return {
    renderCount: renderCountRef.current,
    timeSinceLastRender
  };
};

// Global function to get render statistics
export const getRenderStats = () => {
  const stats = Array.from(renderCounts.entries()).map(([componentName, count]) => ({
    component: componentName,
    totalRenders: count,
    lastRenderTime: lastRenderTimes.get(componentName) || 0
  }));
  
  console.table(stats);
  return stats;
};

// Expose globally for debugging
if (typeof window !== 'undefined') {
  (window as any).getRenderStats = getRenderStats;
}
