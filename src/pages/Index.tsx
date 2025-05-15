
import React, { useState } from "react";
import PokemonRanker from "@/components/PokemonRanker";
import BattleMode from "@/components/BattleMode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppSessionManager from "@/components/AppSessionManager";

const Index = () => {
  const [mode, setMode] = useState<"rank" | "battle">("rank");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold">Pokémon Rank Mania</h1>
          <AppSessionManager />
        </div>
        <p className="text-center text-muted-foreground mb-8">
          Create your personal Pokémon rankings using two different methods
        </p>

        <div className="max-w-3xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Ranking Method</CardTitle>
              <CardDescription>Select how you want to create your Pokémon rankings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setMode("rank")}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5 ${mode === "rank" ? "border-primary bg-primary/5" : "border-muted"}`}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${mode === "rank" ? "border-primary" : "border-muted-foreground"}`}>
                      {mode === "rank" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="grid gap-1.5">
                      <h3 className="text-lg font-medium">Manual Ranking</h3>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop Pokémon to create your ranking list.
                      </p>
                    </div>
                  </div>
                </div>
                <div 
                  onClick={() => setMode("battle")}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5 ${mode === "battle" ? "border-primary bg-primary/5" : "border-muted"}`}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-5 h-5 rounded-full border-2 mt-1 flex items-center justify-center ${mode === "battle" ? "border-primary" : "border-muted-foreground"}`}>
                      {mode === "battle" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="grid gap-1.5">
                      <h3 className="text-lg font-medium">Battle Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        Compare Pokémon head-to-head to generate rankings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {mode === "rank" ? <PokemonRanker /> : <BattleMode />}
      </div>
    </div>
  );
};

export default Index;
