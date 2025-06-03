
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Users, User } from 'lucide-react';
import { GlobalRankingsView } from './GlobalRankingsView';
import { PersonalRankingsView } from './PersonalRankingsView';

type ViewMode = 'personal' | 'global';

export const CommunityRankingsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('personal');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header with Toggle */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Rankings</h1>
              <p className="text-gray-600 mt-2">
                {viewMode === 'personal' 
                  ? 'Manage your personal Pokémon rankings with interactive drag and drop'
                  : 'View community rankings based on aggregated user data'
                }
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'personal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('personal')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Your Rankings
              </Button>
              <Button
                variant={viewMode === 'global' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('global')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Global Rankings
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {viewMode === 'personal' ? (
          <PersonalRankingsView />
        ) : (
          <GlobalRankingsView />
        )}
      </div>
    </div>
  );
};
