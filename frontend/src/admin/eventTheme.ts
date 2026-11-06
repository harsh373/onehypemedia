export type Theme = {
  id: string;
  label: string;
  swatch: string;
  background: string;
  accent: string;
};

export const THEMES: Theme[] = [
  {
    id: "minimal",
    label: "Minimal",
    swatch: "#6d5fd3",
    background: "linear-gradient(160deg, #2c2650 0%, #1a1a20 70%)",
    accent: "#a78bfa",
  },
  {
    id: "dark",
    label: "Dark",
    swatch: "#2b2b30",
    background: "linear-gradient(160deg, #1f1f23 0%, #0e0e10 80%)",
    accent: "#e5e5e5",
  },
  {
    id: "violet",
    label: "Violet",
    swatch: "#8b5cf6",
    background: "linear-gradient(160deg, #4a2a8a 0%, #1b1230 75%)",
    accent: "#c4b5fd",
  },
  {
    id: "ember",
    label: "Ember",
    swatch: "#e31d25",
    background: "linear-gradient(160deg, #7a1f24 0%, #220c0e 75%)",
    accent: "#fca5a5",
  },
  {
    id: "ocean",
    label: "Ocean",
    swatch: "#0ea5e9",
    background: "linear-gradient(160deg, #124a6b 0%, #0b1b27 75%)",
    accent: "#7dd3fc",
  },
  {
    id: "forest",
    label: "Forest",
    swatch: "#10b981",
    background: "linear-gradient(160deg, #17583a 0%, #0a1a12 75%)",
    accent: "#6ee7b7",
  },
];

export function getTheme(id?: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}