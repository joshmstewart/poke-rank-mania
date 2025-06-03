
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ScoreDebugInfo {
  name: string;
  position: string; // e.g., 'Dragged', 'Above 1', 'Below 1', etc.
  muBefore: number;
  sigmaBefore: number;
  scoreBefore: number;
  muAfter?: number;
  sigmaAfter?: number;
  scoreAfter?: number;
  adjusted?: boolean; // explicitly indicates if adjusted by cascading logic
}

interface Props {
  open: boolean;
  onClose: () => void;
  debugData: ScoreDebugInfo[];
}

const ScoreAdjustmentDebugModal: React.FC<Props> = ({ open, onClose, debugData }) => {
  // Sort data in the order: Above 3, Above 2, Above 1, Dragged, Below 1, Below 2, Below 3
  const sortedData = ['Above 3', 'Above 2', 'Above 1', 'Dragged', 'Below 1', 'Below 2', 'Below 3']
    .map(pos => debugData.find(d => d.position === pos))
    .filter(Boolean) as ScoreDebugInfo[];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detailed Score Adjustment Debug Info</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {debugData.length === 0 ? (
            <p className="text-gray-600">No debug data available. Perform a drag-and-drop operation to see detailed score adjustments.</p>
          ) : (
            <>
              <div className="text-sm text-gray-700 mb-4">
                <p><strong>Legend:</strong></p>
                <ul className="list-disc list-inside ml-2">
                  <li><span className="text-blue-600">μ (Mu)</span> - Skill estimate</li>
                  <li><span className="text-green-600">σ (Sigma)</span> - Uncertainty</li>
                  <li><span className="text-purple-600">Score</span> - Display score (μ - σ)</li>
                  <li><span className="text-orange-600">Adjusted</span> - Modified by cascading logic</li>
                </ul>
              </div>

              {sortedData.map((pokemon) => (
                <div key={`${pokemon.name}-${pokemon.position}`} className={`border rounded-lg p-4 ${
                  pokemon.position === 'Dragged' ? 'bg-blue-50 border-blue-300' :
                  pokemon.position.startsWith('Above') ? 'bg-green-50 border-green-200' :
                  'bg-orange-50 border-orange-200'
                }`}>
                  <div className="font-semibold text-lg mb-3 flex items-center justify-between">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                        pokemon.position === 'Dragged' ? 'bg-blue-200 text-blue-800' :
                        pokemon.position.startsWith('Above') ? 'bg-green-200 text-green-800' :
                        'bg-orange-200 text-orange-800'
                      }`}>
                        {pokemon.position}
                      </span>
                      <span className="ml-3 text-gray-800">{pokemon.name}</span>
                    </div>
                    {pokemon.adjusted && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Cascading Adjusted
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-3 text-sm font-medium text-gray-700 border-b pb-2">
                      <span>State</span>
                      <span className="text-blue-600">μ (Mu)</span>
                      <span className="text-green-600">σ (Sigma)</span>
                      <span className="text-purple-600">Score (μ-σ)</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <span className="font-medium text-gray-600">Before:</span>
                      <span className="font-mono">{pokemon.muBefore.toFixed(5)}</span>
                      <span className="font-mono">{pokemon.sigmaBefore.toFixed(5)}</span>
                      <span className="font-mono font-semibold">{pokemon.scoreBefore.toFixed(5)}</span>
                    </div>
                    
                    {pokemon.muAfter !== undefined && pokemon.sigmaAfter !== undefined && pokemon.scoreAfter !== undefined && (
                      <>
                        <div className="grid grid-cols-4 gap-3 text-sm bg-white p-2 rounded border">
                          <span className="font-medium text-gray-600">After:</span>
                          <span className="font-mono font-semibold text-blue-700">{pokemon.muAfter.toFixed(5)}</span>
                          <span className="font-mono font-semibold text-green-700">{pokemon.sigmaAfter.toFixed(5)}</span>
                          <span className="font-mono font-semibold text-purple-700">{pokemon.scoreAfter.toFixed(5)}</span>
                        </div>
                        
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                          <strong>Changes:</strong>{' '}
                          μ {pokemon.muAfter > pokemon.muBefore ? '+' : ''}{(pokemon.muAfter - pokemon.muBefore).toFixed(5)}, 
                          σ {pokemon.sigmaAfter > pokemon.sigmaBefore ? '+' : ''}{(pokemon.sigmaAfter - pokemon.sigmaBefore).toFixed(5)}, 
                          Score {pokemon.scoreAfter > pokemon.scoreBefore ? '+' : ''}{(pokemon.scoreAfter - pokemon.scoreBefore).toFixed(5)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
                <p><strong>Debug Summary:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Shows the dragged Pokémon and up to 3 neighbors above and below</li>
                  <li>Before/After values show TrueSkill rating changes</li>
                  <li>"Cascading Adjusted" indicates Pokémon affected by identical score resolution</li>
                  <li>Final position is determined by the Score (μ - σ) value</li>
                </ul>
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreAdjustmentDebugModal;
