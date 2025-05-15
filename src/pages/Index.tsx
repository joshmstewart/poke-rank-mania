
import React, { useState } from "react";
import PokemonRanker from "@/components/PokemonRanker";
import BattleMode from "@/components/BattleMode";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const [mode, setMode] = useState<"rank" | "battle">("rank");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto py-6">
        <h1 className="text-4xl font-bold text-center mb-4">Pokémon Rank Mania</h1>
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
              <RadioGroup 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                value={mode} 
                onValueChange={(value) => setMode(value as "rank" | "battle")}
              >
                <div className={`border rounded-lg p-4 ${mode === "rank" ? "border-primary bg-primary/5" : "border-muted"}`}>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="rank" id="rank" />
                    <div className="grid gap-1.5">
                      <Label htmlFor="rank" className="text-lg font-medium">Manual Ranking</Label>
                      <p className="text-sm text-muted-foreground">
                        Drag and drop Pokémon to create your ranking list. Perfect for precise control over your order.
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`border rounded-lg p-4 ${mode === "battle" ? "border-primary bg-primary/5" : "border-muted"}`}>
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="battle" id="battle" />
                    <div className="grid gap-1.5">
                      <Label htmlFor="battle" className="text-lg font-medium">Battle Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Compare Pokémon head-to-head to automatically generate rankings. Faster for ranking many Pokémon.
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {mode === "rank" ? <PokemonRanker /> : <BattleMode />}
      </div>
    </div>
  );
};

export default Index;
