
import React, { useState } from "react";
import { InfiniteScrollLoader } from "./InfiniteScrollLoader";
import { PaginationControls } from "./PaginationControls";
import { LoadingType } from "@/hooks/usePokemonRanker";
import { ITEMS_PER_PAGE } from "@/services/pokemon";
import { ViewToggle } from "./ViewToggle";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AvailablePokemonSectionProps {
  availablePokemon: any[];
  isLoading: boolean;
  selectedGeneration: number;
  loadingType: LoadingType;
  currentPage: number;
  totalPages: number;
  loadingRef: React.RefObject<HTMLDivElement>;
  handlePageChange: (page: number) => void;
  getPageRange: () => number[];
}

export const AvailablePokemonSection: React.FC<AvailablePokemonSectionProps> = ({
  availablePokemon,
  isLoading,
  selectedGeneration,
  loadingType,
  currentPage,
  totalPages,
  loadingRef,
  handlePageChange,
  getPageRange
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredPokemon = availablePokemon.filter(pokemon =>
    pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            Available Pokémon (Unrated)
          </h2>
          <div className="flex items-center gap-3">
            <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-2"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
              {isCollapsed ? 'Expand' : 'Collapse'}
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search Pokémon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-y-auto">
          {filteredPokemon.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">
                {searchTerm ? 'No Pokémon found matching your search.' : 'No available Pokémon to display.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredPokemon.map((pokemon, index) => (
                <div key={pokemon.id} className="relative group">
                  <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer">
                    {/* Pokemon Image */}
                    <div className="aspect-square bg-gray-50 p-3 flex items-center justify-center">
                      <img
                        src={pokemon.image}
                        alt={pokemon.name}
                        className="w-full h-full object-contain max-w-16 max-h-16"
                        loading="lazy"
                      />
                    </div>

                    {/* Pokemon Info */}
                    <div className="p-3 text-center">
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-1 mb-1">
                        {pokemon.name}
                      </h3>
                      <p className="text-xs text-gray-500">#{pokemon.id}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading and Pagination */}
      {!isCollapsed && (
        <div className="mt-auto border-t border-gray-100 p-4">
          {loadingType === "infinite" && (
            <InfiniteScrollLoader
              isLoading={isLoading}
              currentPage={currentPage}
              totalPages={totalPages}
              loadingRef={loadingRef}
            />
          )}
          
          {selectedGeneration === 0 && loadingType === "pagination" && totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageRange={getPageRange()}
              onPageChange={handlePageChange}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
          
          {loadingType === "single" && (
            <div className="text-center text-sm text-muted-foreground">
              Loaded {availablePokemon.length} Pokémon
            </div>
          )}
        </div>
      )}
    </div>
  );
};
