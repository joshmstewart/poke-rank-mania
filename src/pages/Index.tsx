
import React, { useState } from "react";
import PokemonRanker from "@/components/PokemonRanker";
import BattleMode from "@/components/BattleMode";
import AppSessionManager from "@/components/AppSessionManager";
import Logo from "@/components/ui/Logo";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import ImagePreferenceSelector from "@/components/settings/ImagePreferenceSelector";

const Index = () => {
  const [mode, setMode] = useState<"rank" | "battle">("battle"); // Default is battle mode
  const [imageSettingsOpen, setImageSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Dialog open={imageSettingsOpen} onOpenChange={setImageSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex gap-1 items-center">
                  <Settings className="h-4 w-4" /> Image Style
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Image Style Preferences</DialogTitle>
                  <DialogDescription>
                    Choose your preferred Pokémon image style for the app.
                  </DialogDescription>
                </DialogHeader>
                <ImagePreferenceSelector onClose={() => setImageSettingsOpen(false)} />
              </DialogContent>
            </Dialog>
            <AppSessionManager />
          </div>
        </div>

        <div className="max-w-3xl mx-auto mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setMode("battle")}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5 ${mode === "battle" ? "border-primary bg-primary/5" : "border-muted"}`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${mode === "battle" ? "border-primary" : "border-muted-foreground"}`}>
                  {mode === "battle" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <h3 className="text-base font-medium">Battle Mode</h3>
                  <p className="text-xs text-muted-foreground">
                    Compare Pokémon head-to-head to generate rankings.
                  </p>
                </div>
              </div>
            </div>
            <div 
              onClick={() => setMode("rank")}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5 ${mode === "rank" ? "border-primary bg-primary/5" : "border-muted"}`}
            >
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${mode === "rank" ? "border-primary" : "border-muted-foreground"}`}>
                  {mode === "rank" && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div>
                  <h3 className="text-base font-medium">Manual Ranking</h3>
                  <p className="text-xs text-muted-foreground">
                    Drag and drop Pokémon to create your ranking list.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {mode === "rank" ? <PokemonRanker /> : <BattleMode />}
      </div>
    </div>
  );
};

export default Index;
