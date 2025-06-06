
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner"

import Index from './pages/Index';
import NotFound from './pages/NotFound';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { TourProvider } from '@/components/tour/TourProvider';
import { TourOverlay } from '@/components/tour/TourOverlay';

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <AuthWrapper>
        <TourProvider>
          <div className="min-h-screen bg-gray-50">
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </div>
          <TourOverlay />
        </TourProvider>
      </AuthWrapper>
    </QueryClientProvider>
  );
}

export default App;
