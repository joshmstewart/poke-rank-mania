
import { Rating } from 'ts-trueskill';

export const findIdenticalNeighborsAbove = (rankings: any[], startIndex: number, getRating: (id: string) => Rating) => {
  const identicalNeighbors: any[] = [];
  if (startIndex <= 0) return identicalNeighbors;
  
  const startScore = getRating(rankings[startIndex].id.toString()).mu - getRating(rankings[startIndex].id.toString()).sigma;
  
  // Go upward from startIndex to find all identical scores
  for (let i = startIndex - 1; i >= 0; i--) {
    const currentScore = getRating(rankings[i].id.toString()).mu - getRating(rankings[i].id.toString()).sigma;
    if (Math.abs(currentScore - startScore) < 0.000001) { // identical within tolerance
      identicalNeighbors.unshift(rankings[i]); // add to beginning
    } else {
      break; // stop when we find a different score
    }
  }
  
  return identicalNeighbors;
};

export const findIdenticalNeighborsBelow = (rankings: any[], startIndex: number, getRating: (id: string) => Rating) => {
  const identicalNeighbors: any[] = [];
  if (startIndex >= rankings.length - 1) return identicalNeighbors;
  
  const startScore = getRating(rankings[startIndex].id.toString()).mu - getRating(rankings[startIndex].id.toString()).sigma;
  
  // Go downward from startIndex to find all identical scores
  for (let i = startIndex + 1; i < rankings.length; i++) {
    const currentScore = getRating(rankings[i].id.toString()).mu - getRating(rankings[i].id.toString()).sigma;
    if (Math.abs(currentScore - startScore) < 0.000001) { // identical within tolerance
      identicalNeighbors.push(rankings[i]);
    } else {
      break; // stop when we find a different score
    }
  }
  
  return identicalNeighbors;
};

export const applyCascadingAdjustmentsAbove = (identicalNeighbors: any[], topDistinctScore: number, updateRating: (id: string, rating: Rating) => void, getRating: (id: string) => Rating) => {
  console.log(`🔧 [CASCADING] Applying cascading adjustments above for ${identicalNeighbors.length} neighbors`);
  
  let currentScore = topDistinctScore;
  
  // Cascade downward from topmost to bottommost
  identicalNeighbors.forEach((neighbor, index) => {
    const originalRating = getRating(neighbor.id.toString());
    const adjustedSigma = originalRating.sigma * 0.9999;
    const adjustedScore = currentScore - 0.00001; // slightly below the Pokemon above
    const adjustedMu = adjustedScore + adjustedSigma;
    
    console.log(`🔧 [CASCADING] ${neighbor.name} (${index + 1}/${identicalNeighbors.length}): ${originalRating.mu - originalRating.sigma} → ${adjustedScore}`);
    
    updateRating(neighbor.id.toString(), new Rating(adjustedMu, adjustedSigma));
    currentScore = adjustedScore; // update for next iteration
  });
};

export const applyCascadingAdjustmentsBelow = (identicalNeighbors: any[], bottomDistinctScore: number, updateRating: (id: string, rating: Rating) => void, getRating: (id: string) => Rating) => {
  console.log(`🔧 [CASCADING] Applying cascading adjustments below for ${identicalNeighbors.length} neighbors`);
  
  let currentScore = bottomDistinctScore;
  
  // Cascade upward from bottommost to topmost
  identicalNeighbors.reverse().forEach((neighbor, index) => {
    const originalRating = getRating(neighbor.id.toString());
    const adjustedSigma = originalRating.sigma * 0.9999;
    const adjustedScore = currentScore + 0.00001; // slightly above the Pokemon below
    const adjustedMu = adjustedScore + adjustedSigma;
    
    console.log(`🔧 [CASCADING] ${neighbor.name} (${index + 1}/${identicalNeighbors.length}): ${originalRating.mu - originalRating.sigma} → ${adjustedScore}`);
    
    updateRating(neighbor.id.toString(), new Rating(adjustedMu, adjustedSigma));
    currentScore = adjustedScore; // update for next iteration
  });
};
