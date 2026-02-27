const GAME_ID_KEY = "spades_gameId";
const PLAYER_NAME_KEY = "spades_playerName";

export const saveGameId = (gameId: string) => {
  localStorage.setItem(GAME_ID_KEY, gameId);
};

export const getGameId = (): string | null => {
  return localStorage.getItem(GAME_ID_KEY);
};

export const clearGameId = () => {
  localStorage.removeItem(GAME_ID_KEY);
};

export const savePlayerName = (name: string) => {
  localStorage.setItem(PLAYER_NAME_KEY, name);
};

export const getPlayerName = (): string | null => {
  return localStorage.getItem(PLAYER_NAME_KEY);
};

