
import React from "react";
import { Pokemon } from "@/services/pokemon";
import { TCGCard } from "@/hooks/pokemon/tcg/types";
import PokemonTCGCardDisplay from "./PokemonTCGCardDisplay";
import PokemonBasicInfo from "./PokemonBasicInfo";
import PokemonStats from "./PokemonStats";
import PokemonDescription from "./PokemonDescription";
import { getGenerationName } from "@/utils/pokemon/pokemonGenerationUtils";
import { normalizePokedexNumber } from "@/utils/pokemon";
import { typeColors } from "@/utils/pokemon/typeColors";

interface PokemonModalContentProps {
  pokemon: Pokemon;
  showLoading: boolean;
  showTCGCards: boolean;
  showFallbackInfo: boolean;
  tcgCard: TCGCard | null;
  secondTcgCard: TCGCard | null;
  flavorText: string;
  isLoadingFlavor: boolean;
}

const PokemonModalContent: React.FC<PokemonModalContentProps> = ({
  pokemon,
  showTCGCards,
  showFallbackInfo,
  tcgCard,
  secondTcgCard,
  flavorText,
  isLoadingFlavor
}) => {
  if (showTCGCards && tcgCard) {
    return (
      <div className="space-y-4">
        <PokemonMetaHeader pokemon={pokemon} />
        <PokemonTCGCardDisplay tcgCard={tcgCard} secondCard={secondTcgCard} />
      </div>
    );
  }

  if (showFallbackInfo) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side - Pokemon image and basic info */}
        <PokemonBasicInfo pokemon={pokemon} />

        {/* Right side - Stats and description */}
        <div className="space-y-4">
          <PokemonStats pokemon={pokemon} />
          <PokemonDescription flavorText={flavorText} isLoadingFlavor={isLoadingFlavor} />
        </div>
      </div>
    );
  }

  return null;
};

export default PokemonModalContent;

const PokemonMetaHeader: React.FC<{ pokemon: Pokemon }> = ({ pokemon }) => {
  const formattedId = `#${normalizePokedexNumber(pokemon.id)}`;
  const generation = getGenerationName(pokemon.id);
  const heightMeters = pokemon.height ? (pokemon.height / 10).toFixed(1) : null;
  const weightKg = pokemon.weight ? (pokemon.weight / 10).toFixed(1) : null;
  const genShort = generation.replace(/^Generation\s+/i, "Gen ");

  // Gradient tint from the Pokémon's primary (and optional secondary) type.
  const primaryType = pokemon.types?.[0];
  const secondaryType = pokemon.types?.[1] ?? primaryType;
  const tintFrom = typeTintFrom(primaryType);
  const tintTo = typeTintTo(secondaryType);

  return (
    <div
      className={`relative rounded-2xl border border-border overflow-hidden bg-gradient-to-br ${tintFrom} ${tintTo} p-5`}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="No." value={formattedId} />
        {heightMeters && <StatTile label="Height" value={heightMeters} unit="m" />}
        {weightKg && <StatTile label="Weight" value={weightKg} unit="kg" />}
        <StatTile label="Gen" value={genShort} />
      </div>

      {pokemon.types && pokemon.types.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Type
          </span>
          {pokemon.types.map((type) => {
            const colorClass = typePillClass(type);
            return (
              <span
                key={type}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md ring-2 ring-white/40 ${colorClass}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                {type}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

const StatTile: React.FC<{ label: string; value: React.ReactNode; unit?: string }> = ({
  label,
  value,
  unit,
}) => (
  <div className="rounded-xl border border-white/60 bg-white/70 backdrop-blur-md p-3 shadow-sm transition-transform hover:scale-[1.02]">
    <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {label}
    </p>
    <p className="text-base font-bold text-foreground">
      {value}
      {unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>}
    </p>
  </div>
);

// Lookup helpers — typeColors keys are Capitalized; data is lowercase.
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();

const typePillClass = (t: string) => typeColors[cap(t)] ?? "bg-muted text-foreground";

const typeTintFrom = (t?: string) => {
  if (!t) return "from-muted/40";
  const map: Record<string, string> = {
    normal: "from-gray-100",
    fire: "from-red-100",
    water: "from-blue-100",
    electric: "from-yellow-100",
    grass: "from-green-100",
    ice: "from-cyan-100",
    fighting: "from-red-100",
    poison: "from-purple-100",
    ground: "from-amber-100",
    flying: "from-indigo-100",
    psychic: "from-pink-100",
    bug: "from-lime-100",
    rock: "from-stone-100",
    ghost: "from-purple-100",
    dragon: "from-indigo-100",
    dark: "from-stone-200",
    steel: "from-slate-100",
    fairy: "from-pink-100",
  };
  return map[t.toLowerCase()] ?? "from-muted/40";
};

const typeTintTo = (t?: string) => {
  if (!t) return "to-accent/30";
  const map: Record<string, string> = {
    normal: "to-gray-50",
    fire: "to-orange-50",
    water: "to-cyan-50",
    electric: "to-amber-50",
    grass: "to-emerald-50",
    ice: "to-blue-50",
    fighting: "to-rose-50",
    poison: "to-fuchsia-50",
    ground: "to-yellow-50",
    flying: "to-sky-50",
    psychic: "to-rose-50",
    bug: "to-green-50",
    rock: "to-amber-50",
    ghost: "to-indigo-50",
    dragon: "to-violet-50",
    dark: "to-slate-100",
    steel: "to-zinc-50",
    fairy: "to-rose-50",
  };
  return map[t.toLowerCase()] ?? "to-accent/30";
};
