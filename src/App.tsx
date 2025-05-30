
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/toaster";
import { PokemonProvider } from "./contexts/PokemonContext";
import { ImpliedBattleTrackerProvider } from "./contexts/ImpliedBattleTracker";
import MainPage from "./components/MainPage";
import PokemonRanker from "./components/PokemonRanker";
import "./App.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PokemonProvider allPokemon={[]}>
        <ImpliedBattleTrackerProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
              <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/ranker" element={<PokemonRanker />} />
              </Routes>
              <Toaster />
              <ReactQueryDevtools initialIsOpen={false} />
            </div>
          </Router>
        </ImpliedBattleTrackerProvider>
      </PokemonProvider>
    </QueryClientProvider>
  );
}

export default App;
