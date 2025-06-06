import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from "@/components/ui/sonner"

import Index from './routes/Index';
import NotFound from './routes/NotFound';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { TourProvider } from '@/components/tour/TourProvider';
import { TourOverlay } from '@/components/tour/TourOverlay';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';

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
            <FeedbackButton />
          </div>
          <TourOverlay />
        </TourProvider>
      </AuthWrapper>
    </QueryClientProvider>
  );
}

export default App;
