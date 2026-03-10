const PALETTE = [
  "#1d4ed8", "#0f766e", "#7e22ce",
  "#b45309", "#be123c", "#0369a1",
  "#15803d", "#b91c1c",
];

/** Deterministic background color for a player avatar based on their name. */
export function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
