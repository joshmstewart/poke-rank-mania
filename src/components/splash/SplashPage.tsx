
import React from 'react';
import { Logo } from '@/components/ui/Logo';
import { SplashBackground } from './SplashBackground';
import { LoadingIndicator } from './LoadingIndicator';

interface SplashPageProps {
  loadingStatus: string;
  progress: number;
}

export const SplashPage: React.FC<SplashPageProps> = ({ loadingStatus, progress }) => {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <SplashBackground />
      
      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-8">
        {/* Logo Container with Glass Effects */}
        <div className="relative mb-8 logo-container">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl scale-150 animate-pulse" />
          <div className="relative z-10 transform hover:scale-105 transition-transform duration-700 ease-out">
            <div className="glass-card p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl">
              <Logo />
            </div>
          </div>
        </div>

        {/* Loading Section */}
        <div className="text-center space-y-6">
          <LoadingIndicator progress={progress} />
          
          <div className="glass-text-container">
            <p className="text-white/90 text-lg font-medium tracking-wide">
              {loadingStatus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
