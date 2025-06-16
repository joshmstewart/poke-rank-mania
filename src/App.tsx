import React from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient } from './components/providers/QueryClient';
import { AppSessionManager } from './components/session/AppSessionManager';
import { SplashPage } from './components/SplashPage';
import { useSplashLoader } from './hooks/useSplashLoader';

function App() {
  const { isLoading } = useSplashLoader();

  if (isLoading) {
    return <SplashPage />;
  }

  return (
    <QueryClient>
      <Toaster />
      <AppSessionManager />
    </QueryClient>
  );
}

export default App;
