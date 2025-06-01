
import React from 'react';

export const UserDisplayLoading: React.FC = () => {
  console.log('🔄 [USER_DISPLAY_LOADING] Showing loading state - profile not loaded yet');
  
  return (
    <div className="flex items-center gap-2">
      <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
      <div className="hidden sm:inline h-4 w-24 bg-gray-200 animate-pulse rounded" />
    </div>
  );
};
