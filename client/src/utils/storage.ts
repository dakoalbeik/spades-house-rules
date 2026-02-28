const GAME_ID_KEY = "spades_gameId";
const PLAYER_NAME_KEY = "spades_playerName";
const PLAYER_ID_KEY = "spades_playerId";

/** Session storage so each tab can have its own game/player; rejoin by gameId + playerId on refresh */
const storage = typeof sessionStorage !== "undefined" ? sessionStorage : (null as unknown as Storage);
const fallback = Object.create(null) as Record<string, string>;

function get(key: string): string | null {
  return storage ? storage.getItem(key) : fallback[key] ?? null;
}
function set(key: string, value: string): void {
  if (storage) storage.setItem(key, value);
  else fallback[key] = value;
}
function remove(key: string): void {
  if (storage) storage.removeItem(key);
  else delete fallback[key];
}

export const saveGameId = (gameId: string) => set(GAME_ID_KEY, gameId);
export const getGameId = (): string | null => get(GAME_ID_KEY);
export const clearGameId = () => remove(GAME_ID_KEY);

export const savePlayerId = (playerId: string) => set(PLAYER_ID_KEY, playerId);
export const getPlayerId = (): string | null => get(PLAYER_ID_KEY);
export const clearPlayerId = () => remove(PLAYER_ID_KEY);

export const savePlayerName = (name: string) => set(PLAYER_NAME_KEY, name);
export const getPlayerName = (): string | null => get(PLAYER_NAME_KEY);

