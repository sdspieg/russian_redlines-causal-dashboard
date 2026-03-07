// Predicate color scheme
export const PRED_COLORS: Record<string, string> = {
  ATTACKS: '#ff4444',
  THREATENS: '#58a6ff',
  SANCTIONS: '#ffa657',
  AIDS: '#3fb950',
  TRADES_FOSSIL: '#f778ba',
  CONTROLS: '#79c0ff',
  LAUNCHES: '#d2a8ff',
  DISPLACES: '#a5d6ff',
  CYBER_ATTACKS: '#ff9bce',
  DISINFORMS: '#d2a8ff',
  ARMS: '#56d364',
  RED_LINES: '#ff7b72',
  NUCLEAR_THREATS: '#ffd700',
};

export function predColor(pred: string): string {
  return PRED_COLORS[pred] || '#8b949e';
}

// Significance colors
export function sigColor(p: number): string {
  if (p < 0.001) return '#ff4444';
  if (p < 0.01) return '#ffa657';
  if (p < 0.05) return '#ffd700';
  return '#8b949e';
}
