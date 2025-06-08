
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const HelpModal: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">How to Use Pokémon Ranker</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Battle Mode Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">🥊 Battle Mode</h3>
            <div className="space-y-2 text-sm">
              <p><strong>What it is:</strong> Compare Pokémon head-to-head to build your personal rankings using TrueSkill algorithm.</p>
              <p><strong>How to use:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Click on your preferred Pokémon in each battle</li>
                <li>Choose between Pairs (2 Pokémon) or Triplets (3 Pokémon) battle modes</li>
                <li>Filter by generation to focus on specific Pokémon groups</li>
                <li>View milestones every 25 battles to see your current rankings</li>
                <li>Continue battles to refine your rankings over time</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Manual Ranking Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">📋 Manual Ranking</h3>
            <div className="space-y-2 text-sm">
              <p><strong>What it is:</strong> Manually organize your Pokémon rankings by dragging and dropping.</p>
              <p><strong>How to use:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Drag Pokémon from the "Available" section to the "Rankings" section</li>
                <li>Reorder your rankings by dragging Pokémon up or down</li>
                <li>Filter by generation to manage specific groups</li>
                <li>Use the voting arrows (↑↓) to suggest ranking changes</li>
                <li>Remove Pokémon from rankings by dragging them back to Available</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Tips Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">💡 Tips</h3>
            <div className="space-y-2 text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Generation Filtering:</strong> Use the generation dropdown to focus on Pokémon from specific games</li>
                <li><strong>Battle Strategy:</strong> More battles = more accurate rankings. The TrueSkill algorithm learns your preferences</li>
                <li><strong>Milestones:</strong> Check your progress every 25 battles to see how your rankings evolve</li>
                <li><strong>Manual Fine-tuning:</strong> Use Manual Ranking mode to make precise adjustments to your battle-generated rankings</li>
                <li><strong>Save Progress:</strong> Your data is automatically saved locally and can be synced to the cloud</li>
              </ul>
            </div>
          </div>

          <Separator />

          {/* Controls Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3">🎮 Controls</h3>
            <div className="space-y-2 text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Mode Switch:</strong> Toggle between Battle and Manual Ranking modes in the header</li>
                <li><strong>Reset:</strong> Use the reset button to start fresh (this will clear all your data)</li>
                <li><strong>Info Button (i):</strong> Click on any Pokémon's info button to see detailed stats and information</li>
                <li><strong>Cloud Sync:</strong> Sign in to save your progress across devices</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
