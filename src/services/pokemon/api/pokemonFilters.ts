// More specific filter for Cramorant forms - only exclude the ones the user mentioned
export const isCramorantFormToExclude = (pokemon: any): boolean => {
  if (pokemon.id !== 845) return false; // Not Cramorant at all
  
  // Keep base Cramorant (regular form)
  if (!pokemon.name.includes('-')) return false;
  
  // Only exclude these specific forms the user mentioned
  const formsToExclude = ['cramorant-gulping', 'cramorant-gorging'];
  return formsToExclude.includes(pokemon.name);
};
