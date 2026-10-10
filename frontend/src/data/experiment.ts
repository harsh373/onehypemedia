export interface Experiment {
  id: string
  title: string
  category: string
}

// No real experiments yet — do not invent placeholder projects.
// When real work exists, add entries here; HypeLab.tsx already
// branches on this array's length, no component changes needed.
export const EXPERIMENTS: Experiment[] = []