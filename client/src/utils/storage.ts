const GAME_ID_KEY = "spades_gameId";
const PLAYER_NAME_KEY = "spades_playerName";

export const saveGameId = (gameId: string) => {
  sessionStorage.setItem(GAME_ID_KEY, gameId);
};

export const getGameId = (): string | null => {
  return sessionStorage.getItem(GAME_ID_KEY);
};

export const clearGameId = () => {
  sessionStorage.removeItem(GAME_ID_KEY);
};

export const savePlayerName = (name: string) => {
  sessionStorage.setItem(PLAYER_NAME_KEY, name);
};

export const getPlayerName = (): string | null => {
  return sessionStorage.getItem(PLAYER_NAME_KEY);
};

