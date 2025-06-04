
export interface ScoreDebugInfo {
  name: string;
  position: string; // e.g., 'Dragged', 'Above 1', 'Below 1', etc.
  muBefore: number;
  sigmaBefore: number;
  scoreBefore: number;
  muAfter?: number;
  sigmaAfter?: number;
  scoreAfter?: number;
  adjusted?: boolean; // explicitly indicates if adjusted by cascading logic
}
