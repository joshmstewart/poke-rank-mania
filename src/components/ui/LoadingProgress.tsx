
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface LoadingProgressProps {
  isVisible: boolean;
  progress: number;
  message?: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({ 
  isVisible, 
  progress, 
  message = "Loading additional Pokemon..." 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-gray-200 z-50 min-w-64">
      <div className="flex items-center space-x-3">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700 mb-1">{message}</p>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% complete</p>
        </div>
      </div>
    </div>
  );
};
