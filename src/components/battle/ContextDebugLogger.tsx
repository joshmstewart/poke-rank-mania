
import React, { useEffect, useContext } from 'react';

// This component helps identify which contexts are being consumed and when they update
const ContextDebugLogger: React.FC<{ componentName: string; pokemonName?: string }> = ({ componentName, pokemonName }) => {
  
  // CRITICAL: Check for any contexts that might be consumed by the cards
  // Based on the codebase structure, let's identify potential contexts:
  
  useEffect(() => {
    console.log(`🔍 [CONTEXT_DEBUG] ${componentName}${pokemonName ? ` (${pokemonName})` : ''}: Context debug logger mounted`);
    
    // Log any context consumption here
    console.log(`🔍 [CONTEXT_DEBUG] ${componentName}: Checking for context consumers...`);
    
    // If there are contexts being consumed, they would trigger re-renders here
    
    return () => {
      console.log(`🔍 [CONTEXT_DEBUG] ${componentName}${pokemonName ? ` (${pokemonName})` : ''}: Context debug logger unmounted`);
    };
  }, [componentName, pokemonName]);

  return null; // This component is only for debugging
};

export default ContextDebugLogger;
