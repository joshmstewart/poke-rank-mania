
import React, { useMemo } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { PokemonProvider } from "@/contexts/PokemonContext";
// Use correct import paths based on existing file structure
import BattleModeCore from "@/components/battle/BattleModeCore";
import PokemonRankerWithProvider from "@/components/pokemon/PokemonRankerWithProvider";

// Simple navbar component for now
const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">Pokémon Battles</h1>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Simple community page component for now
const CommunityPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Community</h2>
      <p className="text-gray-600">Community features coming soon!</p>
    </div>
  );
};

const AppContent: React.FC = React.memo(() => {
  console.log(`🚀🚀🚀 APP_CONTENT_FIXED: Rendering with stability measures`);

  const routes = useMemo(() => [
    { path: "/", element: <BattleModeCore /> },
    { path: "/ranker", element: <PokemonRankerWithProvider /> },
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
