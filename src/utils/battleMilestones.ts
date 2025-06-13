
export const DEFAULT_BATTLE_MILESTONES: number[] = [
  25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400,
  425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700, 725, 750, 775, 800,
  825, 850, 875, 900, 925, 950, 975, 1000
];

export const getDefaultBattleMilestones = (): number[] => [...DEFAULT_BATTLE_MILESTONES];

// New function to check if a battle count is a milestone using modulo arithmetic
export const isMilestone = (battleCount: number): boolean => {
  if (battleCount <= 0) {
    return false;
  }
  return battleCount % 25 === 0;
};

// Function to get the next milestone after a given battle count
export const getNextMilestone = (battleCount: number): number => {
  return Math.ceil(battleCount / 25) * 25;
};

// Function to get the previous milestone before a given battle count
export const getPreviousMilestone = (battleCount: number): number => {
  if (battleCount <= 25) {
    return 0;
  }
  return Math.floor((battleCount - 1) / 25) * 25;
};

// Function to calculate progress toward next milestone
export const getMilestoneProgress = (battleCount: number): { current: number; next: number; progress: number } => {
  const previous = getPreviousMilestone(battleCount);
  const next = getNextMilestone(battleCount);
  const progress = battleCount <= 0 ? 0 : ((battleCount - previous) / (next - previous)) * 100;
  
  return {
    current: battleCount,
    next,
    progress: Math.min(100, Math.max(0, progress))
  };
};
