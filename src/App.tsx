import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import AppContent from './components/AppContent';
import { PokemonProvider } from './contexts/PokemonContext';
import { UnifiedDragProvider } from "@/providers/UnifiedDragProvider";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PokemonProvider>
          <UnifiedDragProvider>
            <BrowserRouter>
              <div className="min-h-screen">
                <Toaster />
                <AppContent />
              </div>
            </BrowserRouter>
          </UnifiedDragProvider>
        </PokemonProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
