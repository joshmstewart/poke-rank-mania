
import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface FormFilterDebugProps {
  getMiscategorizedExamples: () => Record<string, string[]>;
}

export function FormFilterDebug({ getMiscategorizedExamples }: FormFilterDebugProps) {
  const showMiscategorizedExamples = useCallback(() => {
    const examples = getMiscategorizedExamples();
    console.log(`🔍 [DEBUG_EXAMPLES] Full miscategorized examples:`, examples);
    
    // Show detailed breakdown in console with full lists
    Object.entries(examples).forEach(([category, pokemonList]) => {
      if (pokemonList.length > 0) {
        console.log(`🔍 [DEBUG_${category.toUpperCase()}_FULL]`, pokemonList);
        console.log(`🔍 [DEBUG_${category.toUpperCase()}_COUNT] Total: ${pokemonList.length}`);
      }
    });
    
    // Also create a comprehensive summary
    const summary = Object.entries(examples)
      .map(([category, pokemonList]) => `${category}: ${pokemonList.length}`)
      .join(', ');
    
    console.log(`🔍 [DEBUG_SUMMARY] Category counts: ${summary}`);
    
    // Create a downloadable JSON file with all the data
    const dataStr = JSON.stringify(examples, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pokemon-categorization-debug.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Debug Data Exported",
      description: "Full categorization data logged to console and downloaded as JSON file",
    });
  }, [getMiscategorizedExamples]);

  return (
    <div className="flex justify-center">
      <Button 
        variant="outline" 
        size="sm"
        onClick={showMiscategorizedExamples}
        className="text-xs"
      >
        Debug Categorization
      </Button>
    </div>
  );
}
