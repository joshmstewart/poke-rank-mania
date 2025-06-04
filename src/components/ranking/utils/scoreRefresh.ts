
import { Rating } from 'ts-trueskill';

export const refreshRankingsWithUpdatedScores = (rankings: any[], getRating: (id: string) => Rating) => {
  const updatedRankings = rankings.map(pokemon => {
    const rating = getRating(pokemon.id.toString());
    const newScore = rating.mu - rating.sigma;
    
    return {
      ...pokemon,
      score: newScore,
      rating: rating,
      mu: rating.mu,
      sigma: rating.sigma
    };
  });
  
  console.log(`🔄 [SCORE_REFRESH] Updated scores for ${updatedRankings.length} Pokemon`);
  return updatedRankings;
};
