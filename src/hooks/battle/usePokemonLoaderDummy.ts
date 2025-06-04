
// ITEM 3: Dummy implementation to test for hook violations
export const usePokemonLoaderDummy = () => {
  console.log("Using dummy Pokemon loader to test for hook violations");
  
  return {
    allPokemon: [],
    rawUnfilteredPokemon: [],
    isLoading: false,
    isBackgroundLoading: false,
    loadPokemon: async () => [],
    clearCache: () => {}
  };
};
