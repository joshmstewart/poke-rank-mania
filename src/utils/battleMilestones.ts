
// CRITICAL FIX: Generate milestones dynamically every 25 battles
export const DEFAULT_BATTLE_MILESTONES = (() => {
  const milestones = [];
  for (let i = 25; i <= 1000; i += 25) {
    milestones.push(i);
  }
  return milestones;
})();

export const getDefaultBattleMilestones = () => {
  console.log(`🎯 [MILESTONE_CONFIG] Generated default milestones every 25 battles:`, DEFAULT_BATTLE_MILESTONES.slice(0, 10), '...');
  return DEFAULT_BATTLE_MILESTONES;
};

// Helper function to check if a battle count is a milestone
export const isBattleMilestone = (battleCount: number): boolean => {
  return battleCount > 0 && battleCount % 25 === 0;
};

// Helper function to get the next milestone
export const getNextMilestone = (currentBattles: number): number => {
  const currentMilestone = Math.floor(currentBattles / 25) * 25;
  return currentMilestone + 25;
};

// Helper function to get milestone progress percentage
export const getMilestoneProgress = (currentBattles: number): number => {
  const currentMilestone = Math.floor(currentBattles / 25) * 25;
  const nextMilestone = currentMilestone + 25;
  const progressInCurrentRange = currentBattles - currentMilestone;
  return (progressInCurrentRange / 25) * 100;
};
