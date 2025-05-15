
import React, { useState, useEffect } from "react";
import PokemonRanker from "@/components/PokemonRanker";
import BattleMode from "@/components/BattleMode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AppSessionManager from "@/components/AppSessionManager";
import Logo from "@/components/ui/Logo";
import { ChevronDown, ChevronUp } from "lucide-react";

const Index = () => {
  const [mode, setMode] = useState<"rank" | "battle">("rank");
  const [isOpen, setIsOpen] = useState(true);
  
  // Collapse the ranking method selection after a short delay on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <Logo />
          <AppSessionManager />
        </div>

        <div className="max-w-3xl mx-auto mb-6">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
              <CollapsibleTrigger className="w-full" asChild>
                <CardHeader className="pb-2 flex flex-row items-center justify-between cursor-pointer">
                  <div>
                    <CardTitle>
                      {mode === "rank" ? "Manual Ranking" : "Battle Mode"}
                    </CardTitle>
                  </div>
                  <div className="text-muted-foreground">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div 
                      onClick={() => setMode("rank")}
                      className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5 ${mode === "rank" ? "border-primary bg-primary/5" : "border-muted"}`}
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
                    <div 
                      onClick={() => setMode("battle")}
                      className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5 ${mode === "battle" ? "border-primary bg-primary/5" : "border-muted"}`}
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
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>

        {mode === "rank" ? <PokemonRanker /> : <BattleMode />}
      </div>
    </div>
  );
};

export default Index;
