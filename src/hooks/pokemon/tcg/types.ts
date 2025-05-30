
export interface TCGCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  rarity?: string;
  set: {
    id: string;
    name: string;
    series: string;
  };
  images: {
    small: string;
    large: string;
  };
  flavorText?: string;
  attacks?: Array<{
    name: string;
    cost: string[];
    convertedEnergyCost: number;
    damage: string;
    text: string;
  }>;
}

export interface TCGApiResponse {
  data: TCGCard[];
  page: number;
  pageSize: number;
  count: number;
  totalCount: number;
}

export interface CachedTCGCard {
  card: TCGCard | null;
  timestamp: number;
}
