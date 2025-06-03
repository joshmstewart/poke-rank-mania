
import React, { useMemo } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { PokemonProvider } from "@/contexts/PokemonContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import PokemonBattles from "@/pages/PokemonBattles";
import PokemonRanker from "@/pages/PokemonRanker";
import CommunityPage from "@/pages/CommunityPage";

const AppContent: React.FC = React.memo(() => {
  console.log(`🚀🚀🚀 APP_CONTENT_FIXED: Rendering with stability measures`);

  const routes = useMemo(() => [
    { path: "/", element: <PokemonBattles /> },
    { path: "/ranker", element: <PokemonRanker /> },
    { path: "/community", element: <CommunityPage /> }
  ], []);

  return (
    <AuthProvider>
      <PokemonProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-16">
              <Routes>
                {routes.map(({ path, element }) => (
                  <Route key={path} path={path} element={element} />
                ))}
              </Routes>
            </main>
            <Toaster />
          </div>
        </Router>
      </PokemonProvider>
    </AuthProvider>
  );
});

AppContent.displayName = 'AppContent';

export default AppContent;
