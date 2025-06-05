
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ScoreDebugInfo {
  name: string;
  position: string;
  muBefore: number;
  sigmaBefore: number;
  scoreBefore: number;
  muAfter?: number;
  sigmaAfter?: number;
  scoreAfter?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  debugData: ScoreDebugInfo[];
}

const ScoreAdjustmentDebugModal: React.FC<Props> = ({ open, onClose, debugData }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Score Adjustment Debug Info</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {debugData.length === 0 ? (
            <p className="text-gray-600">No debug data available. Perform a drag-and-drop operation to see score adjustments.</p>
          ) : (
            debugData.map((pokemon, index) => (
              <div key={`${pokemon.name}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                <div className="font-semibold text-lg mb-2">
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    pokemon.position === 'Moved' ? 'bg-blue-100 text-blue-800' :
                    pokemon.position === 'Above' ? 'bg-green-100 text-green-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {pokemon.position}
                  </span>
                  <span className="ml-2">{pokemon.name}</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-4 gap-2 font-medium text-gray-700">
                    <span>State</span>
                    <span>μ (Mu)</span>
                    <span>σ (Sigma)</span>
                    <span>Score (μ-σ)</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    <span className="font-medium">Before:</span>
                    <span>{pokemon.muBefore.toFixed(3)}</span>
                    <span>{pokemon.sigmaBefore.toFixed(3)}</span>
                    <span>{pokemon.scoreBefore.toFixed(3)}</span>
                  </div>
                  
                  {pokemon.muAfter !== undefined && pokemon.sigmaAfter !== undefined && (
                    <div className="grid grid-cols-4 gap-2 bg-blue-50 p-2 rounded">
                      <span className="font-medium">After:</span>
                      <span className="font-semibold">{pokemon.muAfter.toFixed(3)}</span>
                      <span className="font-semibold">{pokemon.sigmaAfter.toFixed(3)}</span>
                      <span className="font-semibold">{pokemon.scoreAfter!.toFixed(3)}</span>
                    </div>
                  )}
                  
                  {pokemon.muAfter !== undefined && (
                    <div className="text-xs text-gray-600 mt-2">
                      <strong>Change:</strong> μ {pokemon.muAfter > pokemon.muBefore ? '+' : ''}{(pokemon.muAfter - pokemon.muBefore).toFixed(3)}, 
                      σ {pokemon.sigmaAfter! > pokemon.sigmaBefore ? '+' : ''}{(pokemon.sigmaAfter! - pokemon.sigmaBefore).toFixed(3)}, 
                      Score {pokemon.scoreAfter! > pokemon.scoreBefore ? '+' : ''}{(pokemon.scoreAfter! - pokemon.scoreBefore).toFixed(3)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScoreAdjustmentDebugModal;
