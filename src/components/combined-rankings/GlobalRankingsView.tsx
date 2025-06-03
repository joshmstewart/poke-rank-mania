
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGlobalRankingsV2 } from './hooks/useGlobalRankingsV2';
import MilestoneStyleGlobalCard from './MilestoneStyleGlobalCard';

const GlobalRankingsView: React.FC = () => {
  const [generationFilter, setGenerationFilter] = useState<string>('all');
  const [minUsersFilter, setMinUsersFilter] = useState<number>(1);

  const { data: rankingsData, isLoading, error } = useGlobalRankingsV2({
    generation: generationFilter,
    minUsers: minUsersFilter
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading global rankings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Failed to load global rankings. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  const rankings = rankingsData?.rankings || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Global Pokemon Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="generation-filter" className="text-sm font-medium">
                Generation:
              </label>
              <Select value={generationFilter} onValueChange={setGenerationFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1">Gen 1</SelectItem>
                  <SelectItem value="2">Gen 2</SelectItem>
                  <SelectItem value="3">Gen 3</SelectItem>
                  <SelectItem value="4">Gen 4</SelectItem>
                  <SelectItem value="5">Gen 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="min-users-filter" className="text-sm font-medium">
                Min Users:
              </label>
              <Select value={minUsersFilter.toString()} onValueChange={(v) => setMinUsersFilter(parseInt(v))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                  <SelectItem value="10">10+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {rankings.length} Pokémon
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rankings Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        {rankings.map((ranking) => (
          <MilestoneStyleGlobalCard
            key={ranking.pokemonId}
            ranking={ranking}
          />
        ))}
      </div>

      {rankings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">No rankings found with the current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GlobalRankingsView;
