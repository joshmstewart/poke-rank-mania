
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PokemonProvider } from "@/contexts/PokemonContext";
import { ImpliedBattleTrackerProvider } from "@/contexts/ImpliedBattleTracker";
import ImpliedBattleValidator from "@/components/battle/ImpliedBattleValidator";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <PokemonProvider allPokemon={[]}>
        <ImpliedBattleTrackerProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen">
                <Routes>
                  <Route path="/" element={
                    <>
                      <ImpliedBattleValidator />
                      <Index />
                    </>
                  } />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ImpliedBattleTrackerProvider>
      </PokemonProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
