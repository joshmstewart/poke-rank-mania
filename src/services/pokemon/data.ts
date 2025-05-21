
import { Pokemon } from './types';

interface Generation {
  id: number;
  name: string;
  start: number;
  end: number;
}

// Pokémon generations data
export const generations: Generation[] = [
  { id: 0, name: "All Generations", start: 1, end: 1025 },
  { id: 1, name: "Generation I", start: 1, end: 151 },
  { id: 2, name: "Generation II", start: 152, end: 251 },
  { id: 3, name: "Generation III", start: 252, end: 386 },
  { id: 4, name: "Generation IV", start: 387, end: 493 },
  { id: 5, name: "Generation V", start: 494, end: 649 },
  { id: 6, name: "Generation VI", start: 650, end: 721 },
  { id: 7, name: "Generation VII", start: 722, end: 809 },
  { id: 8, name: "Generation VIII", start: 810, end: 905 },
  { id: 9, name: "Generation IX", start: 906, end: 1025 }
];
